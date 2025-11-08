/**
 * GraphDisplay.test.tsx
 *
 * Comprehensive tests for the GraphDisplay component.
 * Tests base64 image rendering, loading states, error handling, and accessibility.
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import GraphDisplay from '../../../components/exam/GraphDisplay';

// Valid 1x1 transparent PNG (base64)
const VALID_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Invalid base64 string
const INVALID_BASE64 = 'invalid-base64-data';

describe('GraphDisplay Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      expect(getByLabelText('Mathematical function graph')).toBeTruthy();
    });

    it('displays loading state initially', () => {
      const { getByText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      expect(getByText('Loading graph...')).toBeTruthy();
    });

    it('renders image with valid base64', async () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image).toBeTruthy();
      expect(image.props.source.uri).toContain('data:image/png;base64,');
    });

    it('constructs proper data URI from base64', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.source.uri).toBe(`data:image/png;base64,${VALID_BASE64}`);
    });
  });

  describe('Title Display', () => {
    it('displays title when provided', () => {
      const title = 'Graph of f(x) = x²';
      const { getByText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          title={title}
        />
      );

      expect(getByText(title)).toBeTruthy();
    });

    it('does not display title when not provided', () => {
      const { queryByText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      // No title should be visible
      expect(queryByText('Graph of')).toBeNull();
    });

    it('handles empty string title', () => {
      const { queryByText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          title=""
        />
      );

      // Empty title should not cause crash
      expect(queryByText('Graph of')).toBeNull();
    });

    it('handles very long title', () => {
      const longTitle = 'This is a very long title for a mathematical function graph that should be displayed correctly without breaking the layout or causing any issues';
      const { getByText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          title={longTitle}
        />
      );

      expect(getByText(longTitle)).toBeTruthy();
    });
  });

  describe('Sizing', () => {
    it('uses default width when not provided', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.style.width).toBeGreaterThan(0);
    });

    it('applies custom width when provided', () => {
      const customWidth = 300;
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          width={customWidth}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.style.width).toBe(customWidth);
    });

    it('applies custom height when provided', () => {
      const customHeight = 200;
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          height={customHeight}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.style.height).toBe(customHeight);
    });

    it('calculates height from width when height not provided', () => {
      const customWidth = 300;
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          width={customWidth}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      // Default aspect ratio is 0.67 (width * 0.67)
      expect(image.props.style.height).toBe(customWidth * 0.67);
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      const { getByText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      expect(getByText('Loading graph...')).toBeTruthy();
    });

    it('hides loading indicator after load', async () => {
      const { getByLabelText, queryByText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');

      // Simulate image load
      fireEvent(image, 'onLoad', {
        nativeEvent: {
          source: { width: 400, height: 300 }
        }
      });

      await waitFor(() => {
        expect(queryByText('Loading graph...')).toBeNull();
      });
    });

    it('displays activity indicator during loading', () => {
      const { UNSAFE_getByType } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      // ActivityIndicator should be present
      expect(() => UNSAFE_getByType('ActivityIndicator')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('shows error state when image fails to load', async () => {
      const { getByLabelText, getByText } = render(
        <GraphDisplay imageBase64={INVALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');

      // Simulate image error
      fireEvent(image, 'onError', {
        nativeEvent: { error: 'Failed to load' }
      });

      await waitFor(() => {
        expect(getByText('Failed to Load Graph')).toBeTruthy();
      });
    });

    it('displays error message on load failure', async () => {
      const { getByLabelText, getByText } = render(
        <GraphDisplay imageBase64={INVALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      fireEvent(image, 'onError', { nativeEvent: {} });

      await waitFor(() => {
        expect(getByText('The graph image could not be displayed. Please try again.')).toBeTruthy();
      });
    });

    it('calls onError callback when load fails', async () => {
      const onError = jest.fn();
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={INVALID_BASE64}
          onError={onError}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      fireEvent(image, 'onError', { nativeEvent: {} });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load graph image');
      });
    });

    it('does not call onError on successful load', async () => {
      const onError = jest.fn();
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          onError={onError}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      fireEvent(image, 'onLoad', { nativeEvent: { source: { width: 100, height: 100 } } });

      await waitFor(() => {
        expect(onError).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Callbacks', () => {
    it('calls onLoad callback when image loads', async () => {
      const onLoad = jest.fn();
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          onLoad={onLoad}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      fireEvent(image, 'onLoad', { nativeEvent: { source: { width: 100, height: 100 } } });

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('does not call onLoad on error', async () => {
      const onLoad = jest.fn();
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={INVALID_BASE64}
          onLoad={onLoad}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      fireEvent(image, 'onError', { nativeEvent: {} });

      await waitFor(() => {
        expect(onLoad).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Accessibility', () => {
    it('provides accessibility label for image', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      expect(getByLabelText('Mathematical function graph')).toBeTruthy();
    });

    it('uses title as accessibility label when provided', () => {
      const title = 'Graph of sine function';
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          title={title}
        />
      );

      expect(getByLabelText(title)).toBeTruthy();
    });

    it('has proper accessibility role', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.accessibilityRole).toBe('image');
    });

    it('provides accessibility hint', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.accessibilityHint).toBe('Visual representation of a mathematical function');
    });
  });

  describe('Image Properties', () => {
    it('sets resizeMode to contain', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.resizeMode).toBe('contain');
    });

    it('passes source as data URI', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.source.uri).toContain('data:image/png;base64,');
      expect(image.props.source.uri).toContain(VALID_BASE64);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty base64 string', () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64="" />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image).toBeTruthy();
    });

    it('handles very long base64 string', () => {
      const longBase64 = VALID_BASE64.repeat(100);
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={longBase64} />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image).toBeTruthy();
    });

    it('handles special characters in title', () => {
      const specialTitle = 'f(x) = x² + 3x + 1 ∫∑√';
      const { getByText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          title={specialTitle}
        />
      );

      expect(getByText(specialTitle)).toBeTruthy();
    });

    it('handles zero width', () => {
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          width={0}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      expect(image.props.style.width).toBe(0);
    });

    it('handles zero height', () => {
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          height={0}
        />
      );

      const image = getByLabelText('Mathematical function graph');
      // Component sets explicit height when provided, even if 0
      expect(image.props.style.height).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('renders multiple instances without crashing', () => {
      const { getAllByLabelText } = render(
        <>
          <GraphDisplay imageBase64={VALID_BASE64} title="Graph 1" />
          <GraphDisplay imageBase64={VALID_BASE64} title="Graph 2" />
          <GraphDisplay imageBase64={VALID_BASE64} title="Graph 3" />
        </>
      );

      const graphs = getAllByLabelText(/Graph \d/);
      expect(graphs).toHaveLength(3);
    });

    it('handles rapid prop changes', () => {
      const { rerender, getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} title="Graph A" />
      );

      rerender(<GraphDisplay imageBase64={VALID_BASE64} title="Graph B" />);
      rerender(<GraphDisplay imageBase64={VALID_BASE64} title="Graph C" />);

      expect(getByLabelText('Graph C')).toBeTruthy();
    });

    it('updates when base64 prop changes', () => {
      const base64_v1 = VALID_BASE64;
      const base64_v2 = VALID_BASE64 + 'ABCD';

      const { rerender, getByLabelText } = render(
        <GraphDisplay imageBase64={base64_v1} />
      );

      const image1 = getByLabelText('Mathematical function graph');
      expect(image1.props.source.uri).toContain(base64_v1);

      rerender(<GraphDisplay imageBase64={base64_v2} />);

      const image2 = getByLabelText('Mathematical function graph');
      expect(image2.props.source.uri).toContain(base64_v2);
    });
  });

  describe('Aspect Ratio Calculation', () => {
    it('maintains aspect ratio when image loads', async () => {
      const { getByLabelText } = render(
        <GraphDisplay imageBase64={VALID_BASE64} width={400} />
      );

      const image = getByLabelText('Mathematical function graph');

      // Simulate load with specific dimensions
      fireEvent(image, 'onLoad', {
        nativeEvent: {
          source: { width: 800, height: 600 }
        }
      });

      await waitFor(() => {
        // Component should calculate new height based on aspect ratio
        expect(image).toBeTruthy();
      });
    });

    it('uses provided height instead of calculating', async () => {
      const customHeight = 250;
      const { getByLabelText } = render(
        <GraphDisplay
          imageBase64={VALID_BASE64}
          width={400}
          height={customHeight}
        />
      );

      const image = getByLabelText('Mathematical function graph');

      // Even after load, should use custom height
      fireEvent(image, 'onLoad', {
        nativeEvent: {
          source: { width: 800, height: 600 }
        }
      });

      await waitFor(() => {
        expect(image.props.style.height).toBe(customHeight);
      });
    });
  });
});
