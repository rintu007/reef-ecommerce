import { forwardRef } from "react";
import { TextInput as RNTextInput, type TextInputProps } from "react-native";

/**
 * Defaults scrollEnabled=false for single-line inputs. Android's underlying
 * EditText has its own internal scroll/overscroll-glow behavior even for
 * short, non-multiline text — touching and dragging inside the field feels
 * like something is "scrolling" even when there's nothing to scroll to.
 * Multiline inputs keep native scrolling since they actually need it.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { scrollEnabled, multiline, ...props },
  ref
) {
  return <RNTextInput ref={ref} multiline={multiline} scrollEnabled={scrollEnabled ?? !!multiline} {...props} />;
});
