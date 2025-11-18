import { h } from 'preact';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmType?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmType = 'primary',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <h2 className="confirm-dialog-title">{title}</h2>
                <p className="confirm-dialog-message">{message}</p>
                <div className="confirm-dialog-buttons">
                    <button className="confirm-dialog-button-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`confirm-dialog-button-confirm confirm-dialog-button-${confirmType}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
