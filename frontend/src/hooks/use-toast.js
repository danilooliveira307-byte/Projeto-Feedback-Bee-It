import { useCallback, useRef, useEffect } from 'react';

// Global toast state (outside React)
let toastContainer = null;
let toastIdCounter = 0;

const createToastContainer = () => {
  if (typeof document === 'undefined') return null;
  
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(container);
  }
  return container;
};

const showToast = ({ title, description, variant = 'default', duration = 4000 }) => {
  const container = createToastContainer();
  if (!container) return;

  const id = ++toastIdCounter;
  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.className = `pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-sm cursor-pointer transition-all duration-300 transform translate-x-full opacity-0 ${
    variant === 'destructive'
      ? 'bg-red-900/90 border-red-500/50 text-red-100'
      : 'bg-slate-800/95 border-slate-600/50 text-white'
  }`;
  
  toast.innerHTML = `
    ${title ? `<p class="font-semibold text-sm">${title}</p>` : ''}
    ${description ? `<p class="text-sm mt-1 opacity-80">${description}</p>` : ''}
  `;

  // Click to dismiss
  toast.onclick = () => dismissToast(id);

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  });

  // Auto dismiss
  setTimeout(() => dismissToast(id), duration);

  return id;
};

const dismissToast = (id) => {
  const toast = document.getElementById(`toast-${id}`);
  if (toast) {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
};

// React hook
export const useToast = () => {
  const toast = useCallback(({ title, description, variant }) => {
    return showToast({ title, description, variant });
  }, []);

  return { toast };
};

// Direct function export for non-React contexts
export const toast = showToast;

// Empty provider for compatibility (no longer needed but keeps imports working)
export const ToastProvider = ({ children }) => children;
