import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-slide-up flex items-start gap-3 transition-all ${toast.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : toast.type === 'error'
                                    ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                                    : 'bg-blue-500/10 border-blue-500/20 text-brand-primary'
                            }`}
                    >
                        <div className="mt-0.5 text-lg">
                            {toast.type === 'success' && <FaCheckCircle />}
                            {toast.type === 'error' && <FaExclamationCircle />}
                            {toast.type === 'info' && <FaInfoCircle />}
                        </div>
                        <div className="flex-1 text-sm font-bold leading-relaxed">
                            {toast.message}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
