import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { playNotification, playSuccess, playError } from '../../utils/synthSounds';
import './Toast.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);

    // Play sound
    if (type === 'success') playSuccess();
    else if (type === 'error') playError();
    else playNotification();

    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span className="toast__message">{toast.message}</span>
            <div className="toast__progress">
              <div className="toast__progress-bar"></div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
