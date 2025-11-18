import { h } from 'preact';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export const LoadingSpinner = ({ size = 'medium', className = '' }: LoadingSpinnerProps) => {
    return (
        <div className={`loading-spinner loading-spinner-${size} ${className}`}>
            <div className="spinner-ring"></div>
        </div>
    );
};

interface LoadingOverlayProps {
    message?: string;
}

export const LoadingOverlay = ({ message = 'Loading...' }: LoadingOverlayProps) => {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay-content">
                <LoadingSpinner size="large" />
                <p className="loading-overlay-message">{message}</p>
            </div>
        </div>
    );
};
