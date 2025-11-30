import * as React from 'react';
import { Toast, ToastTitle, ToastDescription } from './ui/toast';
import { useToast } from '@/hooks/useToast';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-full duration-200 sm:slide-in-from-bottom-full"
        >
          <Toast
            variant={toast.variant}
            onClose={() => dismiss(toast.id)}
            className="mb-2"
          >
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          </Toast>
        </div>
      ))}
    </div>
  );
}