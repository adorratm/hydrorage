import { Platform } from 'react-native';

/** Native: expo-google-fonts face names. Web: CSS family "Ubuntu". */
export const fonts = {
  light: Platform.OS === 'web' ? 'Ubuntu' : 'Ubuntu_300Light',
  regular: Platform.OS === 'web' ? 'Ubuntu' : 'Ubuntu_400Regular',
  medium: Platform.OS === 'web' ? 'Ubuntu' : 'Ubuntu_500Medium',
  bold: Platform.OS === 'web' ? 'Ubuntu' : 'Ubuntu_700Bold',
} as const;

export const font = {
  light: { fontFamily: fonts.light },
  regular: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  bold: { fontFamily: fonts.bold },
} as const;
