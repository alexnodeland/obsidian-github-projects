import { h } from 'preact';
import { ProjectItem } from '../../api/types';
import { truncate, getInitials } from '../../utils/formatting';

interface CardProps {
    card: ProjectItem;
    onClick: (card: ProjectItem) => void;
}

export const Card = ({ card, onClick }: CardProps) => {
    const handleClick = () => {
        onClick(card);
    };

    return (
        <div
            className="kanban-card"
            data-card-id={card.id}
            onClick={handleClick}
        >
            <div className="card-drag-handle">☰</div>

            <div className="card-title">
                {card.number && `#${card.number} `}
                {truncate(card.title, 80)}
            </div>

            {card.body && (
                <div className="card-description">
                    {truncate(card.body, 100)}
                </div>
            )}

            <div className="card-metadata">
                {card.assignees.length > 0 && (
                    <div className="card-assignees">
                        {card.assignees.slice(0, 3).map(assignee => (
                            <div key={assignee.login} className="card-assignee">
                                {assignee.avatarUrl ? (
                                    <img
                                        src={assignee.avatarUrl}
                                        alt={assignee.login}
                                        title={assignee.login}
                                    />
                                ) : (
                                    <div className="assignee-initials" title={assignee.login}>
                                        {getInitials(assignee.login)}
                                    </div>
                                )}
                            </div>
                        ))}
                        {card.assignees.length > 3 && (
                            <div className="assignee-more">
                                +{card.assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}

                {card.state && (
                    <div className={`card-state card-state-${card.state.toLowerCase()}`}>
                        {card.state}
                    </div>
                )}

                {card.type && (
                    <div className="card-type">
                        {card.type === 'Issue' && '📝'}
                        {card.type === 'PullRequest' && '🔀'}
                        {card.type === 'DraftIssue' && '✏️'}
                    </div>
                )}
            </div>
        </div>
    );
};
