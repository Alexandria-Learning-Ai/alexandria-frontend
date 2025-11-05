/**
 * Accessibility Utilities
 * Helper functions for creating consistent accessibility props
 */

export type AccessibilityRole =
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'text'
  | 'header'
  | 'adjustable'
  | 'imagebutton'
  | 'keyboardkey'
  | 'none'
  | 'summary'
  | 'checkbox'
  | 'radio'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'toolbar';

interface A11yProps {
  accessibilityLabel: string;
  accessibilityRole: AccessibilityRole;
  accessibilityHint?: string;
  accessibilityValue?: { text: string };
  accessible?: boolean;
}

/**
 * Creates accessibility props for a component
 *
 * @param label - Brief description of the element (e.g., "Submit button")
 * @param role - The role of the element (button, text, image, etc.)
 * @param hint - Optional hint about what happens when interacted with
 * @param value - Optional current value (for inputs, sliders, etc.)
 * @returns Accessibility props object to spread on component
 *
 * @example
 * <TouchableOpacity {...createA11yProps('Go back', 'button', 'Returns to home screen')}>
 */
export const createA11yProps = (
  label: string,
  role: AccessibilityRole,
  hint?: string,
  value?: string
): A11yProps => {
  const props: A11yProps = {
    accessibilityLabel: label,
    accessibilityRole: role,
    accessible: true,
  };

  if (hint) {
    props.accessibilityHint = hint;
  }

  if (value) {
    props.accessibilityValue = { text: value };
  }

  return props;
};

/**
 * Creates accessibility props for a button
 *
 * @param label - What the button does (e.g., "Submit quiz", "Go back")
 * @param hint - Optional hint about the action
 * @returns Accessibility props for button
 *
 * @example
 * <TouchableOpacity {...buttonA11y('Submit quiz', 'Submits your answers')}>
 */
export const buttonA11y = (label: string, hint?: string) =>
  createA11yProps(label, 'button', hint);

/**
 * Creates accessibility props for a text input
 *
 * @param label - Input purpose (e.g., "Email address")
 * @param value - Current value of the input
 * @param hint - Optional hint about expected input
 * @returns Accessibility props for text input
 *
 * @example
 * <TextInput {...inputA11y('Email address', email, 'Enter your email')} />
 */
export const inputA11y = (label: string, value?: string, hint?: string) =>
  createA11yProps(label, 'search', hint, value);

/**
 * Creates accessibility props for an image
 *
 * @param description - Description of the image content
 * @returns Accessibility props for image
 *
 * @example
 * <Image {...imageA11y('User profile photo')} />
 */
export const imageA11y = (description: string) =>
  createA11yProps(description, 'image');

/**
 * Creates accessibility props for a header/title
 *
 * @param title - The header text
 * @returns Accessibility props for header
 *
 * @example
 * <Text {...headerA11y('Quiz Results')}>Quiz Results</Text>
 */
export const headerA11y = (title: string) =>
  createA11yProps(title, 'header');

/**
 * Creates accessibility props for disabled state
 *
 * @param label - Element label
 * @param role - Element role
 * @returns Accessibility props with disabled state
 *
 * @example
 * <TouchableOpacity {...disabledA11y('Submit', 'button')} disabled>
 */
export const disabledA11y = (label: string, role: AccessibilityRole) => ({
  ...createA11yProps(`${label} (disabled)`, role, 'This button is currently disabled'),
  accessibilityState: { disabled: true },
});

/**
 * Creates accessibility props for loading state
 *
 * @param label - Element label
 * @returns Accessibility props with busy state
 *
 * @example
 * <View {...loadingA11y('Loading quiz')}>
 */
export const loadingA11y = (label: string) => ({
  ...createA11yProps(label, 'none', 'Please wait'),
  accessibilityState: { busy: true },
});

/**
 * Creates accessibility props for selected/checked state
 *
 * @param label - Element label
 * @param role - Element role (checkbox, radio, etc.)
 * @param isSelected - Whether the element is selected
 * @returns Accessibility props with selected state
 *
 * @example
 * <TouchableOpacity {...selectedA11y('Multiple choice', 'radio', isSelected)}>
 */
export const selectedA11y = (label: string, role: AccessibilityRole, isSelected: boolean) => ({
  ...createA11yProps(label, role),
  accessibilityState: { selected: isSelected, checked: isSelected },
});

export default {
  createA11yProps,
  buttonA11y,
  inputA11y,
  imageA11y,
  headerA11y,
  disabledA11y,
  loadingA11y,
  selectedA11y,
};
