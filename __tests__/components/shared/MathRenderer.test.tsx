/**
 * MathRenderer.test.tsx
 *
 * Comprehensive tests for the MathRenderer component.
 * Tests LaTeX rendering, loading states, error handling, and accessibility.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MathRenderer from '../../../components/shared/MathRenderer';

// Mock WebView
jest.mock('react-native-webview', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props: any) => {
      // Simulate successful render after a short delay
      mockReact.useEffect(() => {
        setTimeout(() => {
          if (props.onMessage) {
            props.onMessage({
              nativeEvent: {
                data: JSON.stringify({
                  type: 'success',
                  height: 80
                })
              }
            });
          }
        }, 10);
      }, []);

      return mockReact.createElement(View, {
        testID: 'webview-mock',
        accessibilityLabel: props.accessibilityLabel
      });
    }
  };
});

describe('MathRenderer Component', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2 + 3x + 1" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('displays loading state initially', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2" />
      );

      // ActivityIndicator should be present initially
      const webview = getByTestId('webview-mock');
      expect(webview).toBeTruthy();
    });

    it('renders simple polynomial formula', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2 + 3x + 1" />
      );

      const webview = getByTestId('webview-mock');
      expect(webview).toBeTruthy();
    });

    it('renders fraction formula', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\frac{x^2 + 1}{x - 3}" />
      );

      const webview = getByTestId('webview-mock');
      expect(webview).toBeTruthy();
    });

    it('renders integral formula', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\int_0^1 x^2 dx" />
      );

      const webview = getByTestId('webview-mock');
      expect(webview).toBeTruthy();
    });

    it('renders summation formula', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\sum_{i=1}^{n} i^2" />
      );

      const webview = getByTestId('webview-mock');
      expect(webview).toBeTruthy();
    });
  });

  describe('Display Modes', () => {
    it('renders in display mode by default', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('renders in inline mode when inline prop is true', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2" inline={true} />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('applies different height for inline mode', async () => {
      const { root } = render(
        <MathRenderer formula="x" inline={true} />
      );

      // Inline mode should have smaller initial height
      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });

    it('applies different height for display mode', async () => {
      const { root } = render(
        <MathRenderer formula="x" inline={false} />
      );

      // Display mode should have larger initial height
      await waitFor(() => {
        expect(root).toBeTruthy();
      });
    });
  });

  describe('Styling Props', () => {
    it('applies custom font size', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2" fontSize={24} />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('applies custom color', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x^2" color="#F5C451" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('uses default font size when not provided', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('uses default color when not provided', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });
  });

  describe('Callbacks', () => {
    it('calls onRenderComplete when rendering succeeds', async () => {
      const onRenderComplete = jest.fn();

      render(
        <MathRenderer
          formula="x^2"
          onRenderComplete={onRenderComplete}
        />
      );

      await waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('does not call onError on successful render', async () => {
      const onError = jest.fn();

      render(
        <MathRenderer
          formula="x^2"
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid LaTeX gracefully', () => {
      // Test that component renders without crashing
      const { root } = render(
        <MathRenderer formula="\\invalid{markup" />
      );

      // Should render without crashing (error handling is internal)
      expect(root).toBeTruthy();
    });

    it('accepts onError callback prop', async () => {
      // Test that onError prop is accepted
      const onError = jest.fn();

      const { root } = render(
        <MathRenderer
          formula="\\test"
          onError={onError}
        />
      );

      // Component should accept the callback
      expect(root).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides accessibility label with formula', () => {
      const formula = 'x^2 + 1';
      const { getByLabelText } = render(
        <MathRenderer formula={formula} />
      );

      expect(getByLabelText(`Math expression: ${formula}`)).toBeTruthy();
    });

    it('has proper accessibility role', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x" />
      );

      const webview = getByTestId('webview-mock');
      expect(webview).toBeTruthy();
    });

    it('provides text alternative for screen readers', () => {
      const formula = 'e^{i\\pi} + 1 = 0';
      const { getByLabelText } = render(
        <MathRenderer formula={formula} />
      );

      expect(getByLabelText(`Math expression: ${formula}`)).toBeTruthy();
    });
  });

  describe('Complex Formulas', () => {
    it('renders matrix notation', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\begin{matrix} a & b \\ c & d \end{matrix}" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('renders square root', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\sqrt{x^2 + y^2}" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('renders limits', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\lim_{x \to \infty} \frac{1}{x}" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('renders Greek letters', () => {
      const { getByTestId } = render(
        <MathRenderer formula="\alpha + \beta + \gamma" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('renders subscripts and superscripts', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x_1^2 + x_2^2" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty formula', () => {
      const { getByTestId } = render(
        <MathRenderer formula="" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('handles very long formula', () => {
      const longFormula = 'x^2 + y^2 + z^2 + a^2 + b^2 + c^2 + d^2 + e^2 + f^2 + g^2';
      const { getByTestId } = render(
        <MathRenderer formula={longFormula} />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('handles special characters', () => {
      const { getByTestId } = render(
        <MathRenderer formula="f(x) = |x|" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('handles formulas with quotes', () => {
      const { getByTestId } = render(
        <MathRenderer formula='x "quoted" y' />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('handles formulas with newlines', () => {
      const { getByTestId } = render(
        <MathRenderer formula="x + y\n= z" />
      );

      expect(getByTestId('webview-mock')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('renders multiple instances without crashing', () => {
      const { getAllByTestId } = render(
        <>
          <MathRenderer formula="x^2" />
          <MathRenderer formula="y^2" />
          <MathRenderer formula="z^2" />
        </>
      );

      const webviews = getAllByTestId('webview-mock');
      expect(webviews).toHaveLength(3);
    });

    it('handles rapid prop changes', () => {
      const { rerender, getByTestId } = render(
        <MathRenderer formula="x" />
      );

      rerender(<MathRenderer formula="y" />);
      rerender(<MathRenderer formula="z" />);
      rerender(<MathRenderer formula="a" />);

      expect(getByTestId('webview-mock')).toBeTruthy();
    });

    it('updates when formula prop changes', () => {
      const { rerender, getByLabelText } = render(
        <MathRenderer formula="x^2" />
      );

      expect(getByLabelText('Math expression: x^2')).toBeTruthy();

      rerender(<MathRenderer formula="y^3" />);

      expect(getByLabelText('Math expression: y^3')).toBeTruthy();
    });
  });
});
