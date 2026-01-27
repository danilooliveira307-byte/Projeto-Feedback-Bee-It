import { toast as sonnerToast } from 'sonner';

// React hook - compatible with existing usage
export const useToast = () => {
  const toast = ({ title, description, variant }) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, { description });
    } else {
      sonnerToast.success(title, { description });
    }
  };

  return { toast };
};

// Direct function export for non-React contexts
export const toast = ({ title, description, variant }) => {
  if (variant === 'destructive') {
    sonnerToast.error(title, { description });
  } else {
    sonnerToast.success(title, { description });
  }
};

// Empty provider for compatibility
export const ToastProvider = ({ children }) => children;
