import { StyleProp, ViewStyle } from 'react-native';

interface ConfirmOptions {
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  destructive?: boolean;
}

interface SafeBackButtonProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: (() => void) | null;
  fallbackScreen?: string;
  confirmOptions?: ConfirmOptions | null;
  disabled?: boolean;
}

declare const SafeBackButton: React.FC<SafeBackButtonProps>;

export default SafeBackButton;
