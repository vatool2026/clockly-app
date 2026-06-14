import React from 'react';
import { useToastStore } from '../stores/toastStore';
import { CheckCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999
    }}>
      {toasts.map(toast => {
        let bgColor = 'var(--bg-surface)';
        let icon = <Info size={18} color="var(--primary)" />;
        let borderColor = 'var(--primary)';

        if (toast.type === 'success') {
          icon = <CheckCircle size={18} color="var(--success)" />;
          borderColor = 'var(--success)';
        } else if (toast.type === 'error') {
          icon = <XCircle size={18} color="var(--danger)" />;
          borderColor = 'var(--danger)';
        }

        return (
          <div key={toast.id} className="toast-animation" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: bgColor,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            borderLeft: `4px solid ${borderColor}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            minWidth: '250px',
            color: 'var(--text-primary)'
          }}>
            {icon}
            <span style={{ flex: 1, fontSize: '0.9em' }}>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0' }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
