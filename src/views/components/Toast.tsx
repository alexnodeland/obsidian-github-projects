import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastProps {
    message: ToastMessage;
    onClose: (id: string) => void;
}

const Toast = ({ message, onClose }: ToastProps) => {
    useEffect(() => {
        const duration = message.duration || 5000;
        const timer = setTimeout(() => {
            onClose(message.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [message, onClose]);

    const getIcon = () => {
        switch (message.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✗';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
        }
    };

    return (
        <div className={`toast toast-${message.type}`}>
            <span className="toast-icon">{getIcon()}</span>
            <span className="toast-message">{message.message}</span>
            <button
                className="toast-close"
                onClick={() => onClose(message.id)}
                title="Dismiss"
            >
                ×
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast} onClose={onClose} />
            ))}
        </div>
    );
};

// Toast manager for global toast notifications
class ToastManager {
    private listeners: Array<(toasts: ToastMessage[]) => void> = [];
    private toasts: ToastMessage[] = [];
    private nextId = 0;

    subscribe(listener: (toasts: ToastMessage[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(listener => listener([...this.toasts]));
    }

    show(message: string, type: ToastType = 'info', duration?: number) {
        const id = `toast-${this.nextId++}`;
        const toast: ToastMessage = { id, message, type, duration };
        this.toasts.push(toast);
        this.notify();
        return id;
    }

    success(message: string, duration?: number) {
        return this.show(message, 'success', duration);
    }

    error(message: string, duration?: number) {
        return this.show(message, 'error', duration);
    }

    warning(message: string, duration?: number) {
        return this.show(message, 'warning', duration);
    }

    info(message: string, duration?: number) {
        return this.show(message, 'info', duration);
    }

    close(id: string) {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
    }

    closeAll() {
        this.toasts = [];
        this.notify();
    }
}

export const toastManager = new ToastManager();

// Hook for using toasts in components
export const useToasts = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        return toastManager.subscribe(setToasts);
    }, []);

    return {
        toasts,
        showToast: toastManager.show.bind(toastManager),
        success: toastManager.success.bind(toastManager),
        error: toastManager.error.bind(toastManager),
        warning: toastManager.warning.bind(toastManager),
        info: toastManager.info.bind(toastManager),
        close: toastManager.close.bind(toastManager),
    };
};
