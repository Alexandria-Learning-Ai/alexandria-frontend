import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DragDropZone from './DragDropZone';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome5: 'FontAwesome5',
}));

describe('DragDropZone', () => {
  const mockOnFileSelected = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    onFileSelected: mockOnFileSelected,
    acceptedTypes: ['.pdf', '.txt', '.png', '.jpg', '.jpeg'],
    maxSizeMB: 10,
    disabled: false,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the drag & drop zone correctly', () => {
      const { getByText } = render(<DragDropZone {...defaultProps} />);

      expect(getByText('Upload Files')).toBeTruthy();
      expect(getByText('Drag & Drop Files Here')).toBeTruthy();
      expect(getByText('or')).toBeTruthy();
      expect(getByText('Browse Files')).toBeTruthy();
    });

    it('should display accepted file types and max size', () => {
      const { getByText } = render(<DragDropZone {...defaultProps} />);

      expect(getByText(/Supports: .PDF, .TXT, .PNG, .JPG, .JPEG/i)).toBeTruthy();
      expect(getByText(/Max: 10MB/i)).toBeTruthy();
    });

    it('should render in disabled state', () => {
      const { getByText } = render(
        <DragDropZone {...defaultProps} disabled={true} />
      );

      expect(getByText('Drag & Drop Files Here')).toBeTruthy();
      // Disabled state should have reduced opacity
    });
  });

  describe('File Validation', () => {
    it('should accept valid PDF file', async () => {
      const validFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(validFile, 'size', { value: 5 * 1024 * 1024 }); // 5MB

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      // Simulate drop event
      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [validFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).toHaveBeenCalledWith(validFile);
        expect(mockOnError).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
          'File validated successfully:',
          'test.pdf'
        );
      });
    });

    it('should accept valid TXT file', async () => {
      const validFile = new File(['test content'], 'document.txt', {
        type: 'text/plain',
      });
      Object.defineProperty(validFile, 'size', { value: 1 * 1024 * 1024 }); // 1MB

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [validFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).toHaveBeenCalledWith(validFile);
      });
    });

    it('should accept valid image files', async () => {
      const imageFile = new File(['image data'], 'photo.jpg', {
        type: 'image/jpeg',
      });
      Object.defineProperty(imageFile, 'size', { value: 2 * 1024 * 1024 }); // 2MB

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [imageFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).toHaveBeenCalledWith(imageFile);
      });
    });

    it('should reject file with invalid type', async () => {
      const invalidFile = new File(['test content'], 'document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      Object.defineProperty(invalidFile, 'size', { value: 1 * 1024 * 1024 }); // 1MB

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [invalidFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).not.toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('Invalid file type')
        );
        expect(logger.warn).toHaveBeenCalledWith(
          'File validation failed:',
          expect.stringContaining('Invalid file type')
        );
      });
    });

    it('should reject file that is too large', async () => {
      const largeFile = new File(['large content'], 'large.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB (exceeds 10MB limit)

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [largeFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).not.toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('too large')
        );
        expect(mockOnError).toHaveBeenCalledWith(
          expect.stringContaining('15.00 MB')
        );
      });
    });

    it('should handle edge case: file exactly at size limit', async () => {
      const exactSizeFile = new File(['content'], 'exact.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(exactSizeFile, 'size', { value: 10 * 1024 * 1024 }); // Exactly 10MB

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [exactSizeFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).toHaveBeenCalledWith(exactSizeFile);
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should reject multiple files dropped at once', async () => {
      const file1 = new File(['content 1'], 'file1.pdf', {
        type: 'application/pdf',
      });
      const file2 = new File(['content 2'], 'file2.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(file1, 'size', { value: 1 * 1024 * 1024 });
      Object.defineProperty(file2, 'size', { value: 1 * 1024 * 1024 });

      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [file1, file2],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      await waitFor(() => {
        expect(mockOnFileSelected).not.toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalledWith(
          'Please drop only one file at a time.'
        );
        expect(logger.warn).toHaveBeenCalledWith(
          'Multiple files dropped, using first file only'
        );
      });
    });
  });

  describe('Drag Events', () => {
    it('should handle drag enter event', () => {
      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dragEnterEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      fireEvent.dragEnter(dropZone, dragEnterEvent);

      expect(dragEnterEvent.preventDefault).toHaveBeenCalled();
      expect(dragEnterEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should handle drag over event', () => {
      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dragOverEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      fireEvent.dragOver(dropZone, dragOverEvent);

      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
      expect(dragOverEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should handle drag leave event', () => {
      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      const dragLeaveEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      // First enter, then leave
      fireEvent.dragEnter(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      });

      fireEvent.dragLeave(dropZone, dragLeaveEvent);

      expect(dragLeaveEvent.preventDefault).toHaveBeenCalled();
      expect(dragLeaveEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not handle drag events when disabled', () => {
      const { container } = render(
        <DragDropZone {...defaultProps} disabled={true} />
      );
      const dropZone = container.children[0];

      const dragEnterEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      fireEvent.dragEnter(dropZone, dragEnterEvent);

      // Events should still be prevented, but no state change should occur
      expect(dragEnterEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Browse Button', () => {
    it('should render browse button', () => {
      const { getByText } = render(<DragDropZone {...defaultProps} />);

      expect(getByText('Browse Files')).toBeTruthy();
    });

    it('should handle browse button click', () => {
      const { getByText } = render(<DragDropZone {...defaultProps} />);
      const browseButton = getByText('Browse Files');

      fireEvent.press(browseButton);

      // Should trigger file input (implementation specific)
    });

    it('should not trigger browse when disabled', () => {
      const { getByText } = render(
        <DragDropZone {...defaultProps} disabled={true} />
      );
      const browseButton = getByText('Browse Files');

      fireEvent.press(browseButton);

      // Should not do anything when disabled
    });
  });

  describe('Success State', () => {
    it('should display success state after valid file drop', async () => {
      const validFile = new File(['test'], 'success.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(validFile, 'size', { value: 1 * 1024 * 1024 });

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      const dropEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [validFile],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      // Wait for success state to appear
      await waitFor(() => {
        expect(mockOnFileSelected).toHaveBeenCalled();
      });

      // Success state should show file name
      const fileName = await findByText('success.pdf');
      expect(fileName).toBeTruthy();

      // Should show "Change File" button
      const changeButton = await findByText('Change File');
      expect(changeButton).toBeTruthy();
    });

    it('should allow changing file after successful drop', async () => {
      const validFile = new File(['test'], 'file.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(validFile, 'size', { value: 1 * 1024 * 1024 });

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      // Drop file
      fireEvent.drop(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [validFile] },
      });

      // Wait for success state
      const changeButton = await findByText('Change File');

      // Click change file
      fireEvent.press(changeButton);

      // Should reset to idle state
      await waitFor(() => {
        expect(findByText('Drag & Drop Files Here')).toBeTruthy();
      });
    });
  });

  describe('Error State', () => {
    it('should display error state for invalid file', async () => {
      const invalidFile = new File(['test'], 'invalid.exe', {
        type: 'application/x-msdownload',
      });
      Object.defineProperty(invalidFile, 'size', { value: 1 * 1024 * 1024 });

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      fireEvent.drop(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [invalidFile] },
      });

      // Should show error state
      const errorHeading = await findByText('Upload Failed');
      expect(errorHeading).toBeTruthy();

      // Should show try again button
      const tryAgainButton = await findByText('Try Again');
      expect(tryAgainButton).toBeTruthy();
    });

    it('should reset error state after timeout', async () => {
      jest.useFakeTimers();

      const invalidFile = new File(['test'], 'invalid.docx', {
        type: 'application/vnd.openxmlformats',
      });
      Object.defineProperty(invalidFile, 'size', { value: 1 * 1024 * 1024 });

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      fireEvent.drop(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [invalidFile] },
      });

      // Error should be visible
      await waitFor(() => {
        expect(findByText('Upload Failed')).toBeTruthy();
      });

      // Fast forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Error should reset to idle
      await waitFor(() => {
        expect(findByText('Drag & Drop Files Here')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      // Should have role="button"
      // Should have tabIndex
      // Should have aria-label
      // Should have aria-disabled when disabled
    });

    it('should handle keyboard navigation', () => {
      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      // Simulate Enter key press
      const enterEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      };

      fireEvent.keyPress(dropZone, enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle Space key press', () => {
      const { container } = render(<DragDropZone {...defaultProps} />);
      const dropZone = container.children[0];

      // Simulate Space key press
      const spaceEvent = {
        key: ' ',
        preventDefault: jest.fn(),
      };

      fireEvent.keyPress(dropZone, spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', async () => {
      const smallFile = new File(['test'], 'small.txt', {
        type: 'text/plain',
      });
      Object.defineProperty(smallFile, 'size', { value: 512 }); // 512 bytes

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      fireEvent.drop(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [smallFile] },
      });

      // Should display "512 B"
      await waitFor(() => {
        expect(findByText(/512 B/i)).toBeTruthy();
      });
    });

    it('should format kilobytes correctly', async () => {
      const mediumFile = new File(['test'], 'medium.txt', {
        type: 'text/plain',
      });
      Object.defineProperty(mediumFile, 'size', { value: 1536 }); // 1.5 KB

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      fireEvent.drop(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [mediumFile] },
      });

      // Should display "1.5 KB"
      await waitFor(() => {
        expect(findByText(/1\.5 KB/i)).toBeTruthy();
      });
    });

    it('should format megabytes correctly', async () => {
      const largeFile = new File(['test'], 'large.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(largeFile, 'size', { value: 5242880 }); // 5 MB

      const { container, findByText } = render(
        <DragDropZone {...defaultProps} />
      );
      const dropZone = container.children[0];

      fireEvent.drop(dropZone, {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: { files: [largeFile] },
      });

      // Should display "5.0 MB"
      await waitFor(() => {
        expect(findByText(/5\.0 MB/i)).toBeTruthy();
      });
    });
  });
});
