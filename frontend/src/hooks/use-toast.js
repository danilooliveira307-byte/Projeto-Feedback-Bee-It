import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback se não estiver dentro do provider
    return { 
      toast: () => console.log('Toast not available'),
      toasts: []
    };
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default' }) => {
    const id = Date.now() + Math.random();
    const newToast = { id, title, description, variant };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
    
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts, dismissToast }}>
      {children}
      {/* Toast Container - rendered inline, not via portal */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-2xl border animate-fade-in backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] ${
              t.variant === 'destructive'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : 'bg-slate-800/90 border-slate-700/50 text-white'
            }`}
            onClick={() => dismissToast(t.id)}
            data-testid="toast-message"
          >
            {t.title && (
              <p className="font-semibold text-sm">{t.title}</p>
            )}
            {t.description && (
              <p className="text-sm mt-1 opacity-80 whitespace-pre-line">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Named export for compatibility
export const toast = ({ title, description, variant }) => {
  console.log('Toast:', title, description);
};
