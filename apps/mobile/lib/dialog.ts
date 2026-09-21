type Listener = (payload: DialogPayload | null) => void;

export type DialogPayload =
  | {
      kind: 'alert';
      title: string;
      message?: string;
      onClose?: () => void;
    }
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmLabel?: string;
      cancelLabel?: string;
      destructive?: boolean;
      onConfirm: () => void;
      onCancel?: () => void;
    }
  | {
      kind: 'prompt';
      title: string;
      message?: string;
      defaultValue?: string;
      keyboardType?: 'default' | 'numeric';
      onSubmit: (value: string) => void;
      onCancel?: () => void;
    };

const listeners = new Set<Listener>();
let current: DialogPayload | null = null;

function emit() {
  listeners.forEach((fn) => fn(current));
}

export function subscribeDialog(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissDialog() {
  current = null;
  emit();
}

function present(payload: DialogPayload) {
  current = payload;
  emit();
}

/** Modern modal alert (web + native). */
export function showAlert(title: string, message?: string, onClose?: () => void) {
  present({ kind: 'alert', title, message, onClose });
}

/** Modern onay diyaloğu — silme vb. için. */
export function confirmAction(opts: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  present({
    kind: 'confirm',
    title: opts.title,
    message: opts.message,
    confirmLabel: opts.confirmLabel,
    cancelLabel: opts.cancelLabel,
    destructive: opts.destructive,
    onConfirm: opts.onConfirm,
    onCancel: opts.onCancel,
  });
}

/** Modern metin girişi diyaloğu. */
export function promptText(opts: {
  title: string;
  message?: string;
  defaultValue?: string;
  keyboardType?: 'default' | 'numeric';
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}) {
  present({
    kind: 'prompt',
    title: opts.title,
    message: opts.message,
    defaultValue: opts.defaultValue,
    keyboardType: opts.keyboardType,
    onSubmit: opts.onSubmit,
    onCancel: opts.onCancel,
  });
}
