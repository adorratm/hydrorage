import { Text, TextProps } from '@/components/Themed';
import { fonts } from '@/constants/fonts';

export function MonoText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, { fontFamily: fonts.regular }]} />
  );
}
