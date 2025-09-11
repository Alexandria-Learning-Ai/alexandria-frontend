/**
 * Script to help replace console.log statements with structured logging
 * Run with: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Directories to process
const directories = [
  'screens',
  'components', 
  'services',
  'utils',
  'contexts',
  'navigation'
];

// Files to skip
const skipFiles = [
  'logger.js',
  'replace-console-logs.js'
];

// Replacement patterns
const replacements = [
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
    description: 'Replace console.log with logger.info'
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    description: 'Replace console.warn with logger.warn'
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    description: 'Replace console.error with logger.error'
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
    description: 'Replace console.debug with logger.debug'
  }
];

// Import statement to add
const loggerImport = "import logger from '../utils/logger';\n";

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let hasConsoleUsage = false;

    // Check if file has console usage
    for (const { pattern } of replacements) {
      if (pattern.test(content)) {
        hasConsoleUsage = true;
        break;
      }
    }

    if (!hasConsoleUsage) {
      return { processed: false, changes: 0 };
    }

    // Apply replacements
    let changes = 0;
    for (const { pattern, replacement } of replacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changes += matches.length;
        modified = true;
      }
    }

    // Add logger import if not already present
    if (modified && !content.includes("from '../utils/logger'") && !content.includes("from './logger'")) {
      // Find the best place to insert import
      const importRegex = /^import.*from.*['"];?$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        // Add after last import
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastImportIndex) + '\n' + loggerImport + content.slice(lastImportIndex);
      } else {
        // Add at the beginning
        content = loggerImport + content;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    return { processed: true, changes };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { processed: false, changes: 0, error: error.message };
  }
}

function processDirectory(dirPath) {
  const results = {
    filesProcessed: 0,
    filesModified: 0,
    totalChanges: 0,
    errors: []
  };

  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively process subdirectories
        const subResults = processDirectory(filePath);
        results.filesProcessed += subResults.filesProcessed;
        results.filesModified += subResults.filesModified;
        results.totalChanges += subResults.totalChanges;
        results.errors.push(...subResults.errors);
      } else if (file.endsWith('.js') && !skipFiles.includes(file)) {
        results.filesProcessed++;
        const result = processFile(filePath);
        
        if (result.processed && result.changes > 0) {
          results.filesModified++;
          results.totalChanges += result.changes;
          console.log(`✅ Modified ${filePath}: ${result.changes} replacements`);
        }

        if (result.error) {
          results.errors.push({ file: filePath, error: result.error });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }

  return results;
}

function main() {
  console.log('🔄 Starting console.log replacement...\n');

  const totalResults = {
    filesProcessed: 0,
    filesModified: 0,
    totalChanges: 0,
    errors: []
  };

  // Process each directory
  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processing ${dir}/...`);
      const results = processDirectory(dirPath);
      
      totalResults.filesProcessed += results.filesProcessed;
      totalResults.filesModified += results.filesModified;
      totalResults.totalChanges += results.totalChanges;
      totalResults.errors.push(...results.errors);
      
      console.log(`   Files processed: ${results.filesProcessed}`);
      console.log(`   Files modified: ${results.filesModified}`);
      console.log(`   Total changes: ${results.totalChanges}\n`);
    } else {
      console.log(`⚠️  Directory ${dir}/ not found, skipping...\n`);
    }
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`   Total files processed: ${totalResults.filesProcessed}`);
  console.log(`   Total files modified: ${totalResults.filesModified}`);
  console.log(`   Total console.log replacements: ${totalResults.totalChanges}`);
  
  if (totalResults.errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    totalResults.errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`);
    });
  }

  console.log('\n✅ Console.log replacement complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. Test your application');
  console.log('   3. Commit the changes');
}

// Run the script
main();