import { h } from 'preact';

interface EmptyStateProps {
    message: string;
    icon?: string;
    action?: {
        text: string;
        onClick: () => void;
    };
}

export const EmptyState = ({ message, icon, action }: EmptyStateProps) => {
    return (
        <div className="empty-state">
            {icon && <div className="empty-state-icon">{icon}</div>}
            <div className="empty-state-message">{message}</div>
            {action && (
                <button
                    className="empty-state-action"
                    onClick={action.onClick}
                >
                    {action.text}
                </button>
            )}
        </div>
    );
};
