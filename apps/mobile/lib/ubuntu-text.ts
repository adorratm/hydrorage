import {
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { fonts } from '@/constants/fonts';

/**
 * Web: Ubuntu +html.tsx CSS ile gelir; Text.render yaması
 * CSSStyleDeclaration hatası verir → web'de hiç dokunma.
 * Native: defaultProps ile Ubuntu regular.
 */
export function patchTextToUbuntu() {
  if (Platform.OS === 'web') return;

  const base: TextStyle = { fontFamily: fonts.regular };
  const TextAny = RNText as unknown as {
    defaultProps?: { style?: StyleProp<TextStyle> };
  };
  const InputAny = RNTextInput as unknown as {
    defaultProps?: { style?: StyleProp<TextStyle> };
  };

  const prevText = StyleSheet.flatten(TextAny.defaultProps?.style) ?? {};
  const prevInput = StyleSheet.flatten(InputAny.defaultProps?.style) ?? {};

  TextAny.defaultProps = {
    ...TextAny.defaultProps,
    style: { ...prevText, ...base },
  };
  InputAny.defaultProps = {
    ...InputAny.defaultProps,
    style: { ...prevInput, ...base },
  };
}
