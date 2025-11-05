import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import logger from './logger';

/**
 * Calculate SHA-256 hash of a file for content-based deduplication
 *
 * For performance, we use different strategies based on file size:
 * - Small files (<1MB): Hash entire file
 * - Medium files (1-10MB): Hash first 512KB + last 512KB
 * - Large files (>10MB): Hash first 256KB + middle 256KB + last 256KB
 *
 * @param fileUri - URI of the file to hash
 * @param fileSize - Size of the file in bytes (optional, will be determined if not provided)
 * @returns Promise<string> - SHA-256 hash of the file content
 */
export async function calculateFileHash(
  fileUri: string,
  fileSize?: number
): Promise<string> {
  try {
    // Get file size if not provided
    if (!fileSize) {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${fileUri}`);
      }
      fileSize = fileInfo.size || 0;
    }

    const ONE_MB = 1024 * 1024;
    const TEN_MB = 10 * ONE_MB;

    // Strategy 1: Small files (<1MB) - hash entire file
    if (fileSize < ONE_MB) {
      logger.info(`Hashing small file (${(fileSize / 1024).toFixed(1)}KB)`);
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fileContent
      );
    }

    // Strategy 2: Medium files (1-10MB) - hash first 512KB + last 512KB
    if (fileSize < TEN_MB) {
      logger.info(`Hashing medium file (${(fileSize / ONE_MB).toFixed(1)}MB) using sampling`);
      const chunkSize = 512 * 1024; // 512KB

      // Read first chunk
      const firstChunk = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: chunkSize,
      });

      // Read last chunk
      const lastChunk = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
        position: fileSize - chunkSize,
        length: chunkSize,
      });

      // Combine chunks and hash
      const combined = firstChunk + lastChunk + fileSize.toString();
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined
      );
    }

    // Strategy 3: Large files (>10MB) - hash first + middle + last chunks
    logger.info(`Hashing large file (${(fileSize / ONE_MB).toFixed(1)}MB) using 3-point sampling`);
    const chunkSize = 256 * 1024; // 256KB

    // Read first chunk
    const firstChunk = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: chunkSize,
    });

    // Read middle chunk
    const middlePosition = Math.floor(fileSize / 2) - Math.floor(chunkSize / 2);
    const middleChunk = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: middlePosition,
      length: chunkSize,
    });

    // Read last chunk
    const lastChunk = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: fileSize - chunkSize,
      length: chunkSize,
    });

    // Combine all chunks with file size and hash
    const combined = firstChunk + middleChunk + lastChunk + fileSize.toString();
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
  } catch (error) {
    logger.error('Error calculating file hash:', error);
    throw new Error(`Failed to calculate file hash: ${error.message}`);
  }
}

/**
 * Simple cache key generator for file uploads
 * Combines file hash with upload parameters to create unique cache key
 *
 * @param fileHash - SHA-256 hash of the file
 * @param uploadType - Type of upload ('quiz' or 'study')
 * @param additionalParams - Additional parameters that affect the result (e.g., quiz difficulty)
 * @returns string - Cache key for this specific upload configuration
 */
export function generateCacheKey(
  fileHash: string,
  uploadType: 'quiz' | 'study',
  additionalParams?: Record<string, any>
): string {
  const paramsString = additionalParams
    ? JSON.stringify(additionalParams)
    : '';

  return `upload:${uploadType}:${fileHash}:${paramsString}`;
}

/**
 * Check if two files are identical based on their hashes
 *
 * @param hash1 - First file hash
 * @param hash2 - Second file hash
 * @returns boolean - True if files are identical
 */
export function areFilesIdentical(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}
