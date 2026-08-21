import { create } from 'zustand';

export type PromptType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface PromptAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export interface PromptOptions {
  type?: PromptType;
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  actions?: PromptAction[];
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface PromptStoreState {
  // Modal state
  activePrompt: PromptOptions | null;
  isPromptVisible: boolean;
  showPrompt: (options: PromptOptions) => void;
  hidePrompt: () => void;

  // Toast state
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  hideToast: (id: string) => void;
}

export const usePromptStore = create<PromptStoreState>((set, get) => ({
  activePrompt: null,
  isPromptVisible: false,

  showPrompt: (options: PromptOptions) => {
    set({
      activePrompt: options,
      isPromptVisible: true,
    });
  },

  hidePrompt: () => {
    set({
      isPromptVisible: false,
      activePrompt: null,
    });
  },

  toasts: [],

  showToast: (toast) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? 3500,
    };

    set((state) => ({
      toasts: [...state.toasts.slice(-2), newToast], // Keep max 3 toasts
    }));

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, newToast.duration);
    }
  },

  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenient global helper functions
export const promptModal = {
  success: (title: string, message?: string, onConfirm?: () => void) => {
    usePromptStore.getState().showPrompt({
      type: 'success',
      title,
      message,
      confirmText: 'Done',
      onConfirm,
    });
  },

  error: (title: string, message?: string, onConfirm?: () => void) => {
    usePromptStore.getState().showPrompt({
      type: 'error',
      title,
      message,
      confirmText: 'Dismiss',
      onConfirm,
    });
  },

  info: (title: string, message?: string, onConfirm?: () => void) => {
    usePromptStore.getState().showPrompt({
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
    });
  },

  confirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    usePromptStore.getState().showPrompt({
      type: options.isDestructive ? 'warning' : 'confirm',
      ...options,
    });
  },
};

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    usePromptStore.getState().showToast({
      type: 'success',
      title,
      message,
      duration,
    });
  },
  error: (title: string, message?: string, duration?: number) => {
    usePromptStore.getState().showToast({
      type: 'error',
      title,
      message,
      duration: duration ?? 4500,
    });
  },
  info: (title: string, message?: string, duration?: number) => {
    usePromptStore.getState().showToast({
      type: 'info',
      title,
      message,
      duration,
    });
  },
  warning: (title: string, message?: string, duration?: number) => {
    usePromptStore.getState().showToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  },
};
