import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Coffee, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      type: toast.type || 'success', // 'success', 'warning', 'error', 'info'
      title: toast.title,
      message: toast.message,
      duration: toast.duration || 4500,
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 420,
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          let bg = '#1F1B18';
          let border = '#332E2A';
          let Icon = CheckCircle2;
          let iconColor = '#1D8350';

          if (t.type === 'success') {
            bg = '#143022';
            border = '#1D8350';
            iconColor = '#4ADE80';
            Icon = CheckCircle2;
          } else if (t.type === 'warning' || t.type === 'break') {
            bg = '#36230C';
            border = '#EFA537';
            iconColor = '#FBBF24';
            Icon = Coffee;
          } else if (t.type === 'error') {
            bg = '#36151B';
            border = '#BF3A4C';
            iconColor = '#F87171';
            Icon = AlertCircle;
          }

          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                backgroundColor: bg,
                color: '#FFFEFC',
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <Icon size={20} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: t.message ? 2 : 0 }}>
                    {t.title}
                  </div>
                )}
                {t.message && (
                  <div style={{ fontSize: '0.82rem', color: '#D9D2C7', lineHeight: 1.4 }}>
                    {t.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9B938B',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
