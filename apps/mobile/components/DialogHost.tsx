import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';
import {
  subscribeDialog,
  dismissDialog,
  type DialogPayload,
} from '@/lib/dialog';
import { useT } from '@/lib/i18n';

export function DialogHost() {
  const tr = useT();
  const insets = useSafeAreaInsets();
  const [payload, setPayload] = useState<DialogPayload | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => subscribeDialog(setPayload), []);

  useEffect(() => {
    if (payload?.kind === 'prompt') {
      setPromptValue(payload.defaultValue ?? '');
    }
  }, [payload]);

  const visible = !!payload;
  const close = () => dismissDialog();

  const onCancel = () => {
    if (payload && (payload.kind === 'confirm' || payload.kind === 'prompt')) {
      payload.onCancel?.();
    }
    close();
  };

  const onConfirm = () => {
    if (!payload) return;
    if (payload.kind === 'prompt') {
      const v = promptValue.trim();
      if (!v) return;
      payload.onSubmit(v);
    } else if (payload.kind === 'confirm') {
      payload.onConfirm();
    }
    close();
  };

  const onAlertOk = () => {
    if (payload?.kind === 'alert') {
      payload.onClose?.();
    }
    close();
  };

  const destructive = payload?.kind === 'confirm' && payload.destructive;
  const title = payload?.title ?? '';
  const message = payload?.message;
  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWeb ? 'fade' : 'slide'}
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, isWeb && styles.overlayCenter]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={tr('common.close')}
        />
        <View
          style={[
            styles.sheet,
            isWeb ? styles.sheetCenter : null,
            { marginBottom: isWeb ? 0 : Math.max(insets.bottom, 16) + 8 },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          {destructive ? <View style={styles.dangerBar} /> : null}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {payload?.kind === 'prompt' ? (
            <TextInput
              style={styles.input}
              value={promptValue}
              onChangeText={setPromptValue}
              keyboardType={
                payload.keyboardType === 'numeric' ? 'number-pad' : 'default'
              }
              autoFocus
              placeholderTextColor={colors.muted}
              selectionColor={colors.primaryContainer}
            />
          ) : null}

          {payload?.kind === 'alert' ? (
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={onAlertOk}
              accessibilityRole="button"
            >
              <Text style={styles.btnPrimaryText}>{tr('common.ok')}</Text>
            </Pressable>
          ) : (
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={onCancel}
                accessibilityRole="button"
              >
                <Text style={styles.btnGhostText}>
                  {payload?.kind === 'confirm'
                    ? payload.cancelLabel ?? tr('common.cancel')
                    : tr('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  destructive ? styles.btnDanger : styles.btnPrimary,
                ]}
                onPress={onConfirm}
                accessibilityRole="button"
              >
                <Text
                  style={
                    destructive ? styles.btnDangerText : styles.btnPrimaryText
                  }
                >
                  {payload?.kind === 'confirm'
                    ? payload.confirmLabel ?? tr('common.ok')
                    : payload?.kind === 'prompt'
                      ? tr('common.save')
                      : tr('common.ok')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 7, 14, 0.72)',
  },
  sheet: {
    marginHorizontal: 14,
    borderRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 22,
    paddingBottom: 22,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(189, 147, 249, 0.28)',
    gap: 10,
    boxShadow: '0px 16px 28px rgba(0, 0, 0, 0.45)',
    elevation: 12,
  },
  sheetCenter: {
    marginHorizontal: 0,
    width: 400,
    maxWidth: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(189, 147, 249, 0.35)',
    marginBottom: 8,
  },
  dangerBar: {
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.danger,
    marginBottom: 4,
    opacity: 0.9,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(189, 147, 249, 0.35)',
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  btnGhostText: {
    color: colors.onSurfaceVariant,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  btnPrimary: {
    backgroundColor: colors.primaryContainer,
  },
  btnPrimaryText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnDangerText: {
    color: '#1a0a0a',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
