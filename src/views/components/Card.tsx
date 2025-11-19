import { h } from 'preact';
import { ProjectItem } from '../../api/types';
import { truncate, getInitials, formatRelativeTime } from '../../utils/formatting';
import { CardDisplaySettings } from '../../settings';

interface CardProps {
    card: ProjectItem;
    onClick: (card: ProjectItem) => void;
    settings: CardDisplaySettings;
}

export const Card = ({ card, onClick, settings }: CardProps) => {
    const handleClick = () => {
        onClick(card);
    };

    const getReviewDecisionBadge = () => {
        switch (card.reviewDecision) {
            case 'APPROVED':
                return <span className="pr-review-badge pr-review-approved" title="Approved">✓</span>;
            case 'CHANGES_REQUESTED':
                return <span className="pr-review-badge pr-review-changes" title="Changes Requested">✗</span>;
            case 'REVIEW_REQUIRED':
                return <span className="pr-review-badge pr-review-required" title="Review Required">👁</span>;
            default:
                return null;
        }
    };

    const getCIStatusBadge = () => {
        if (!card.ciStatus) return null;

        const statusConfig: Record<string, { emoji: string; title: string; className: string }> = {
            SUCCESS: { emoji: '✓', title: 'Checks passing', className: 'ci-success' },
            PENDING: { emoji: '●', title: 'Checks pending', className: 'ci-pending' },
            FAILURE: { emoji: '✗', title: 'Checks failing', className: 'ci-failure' },
            ERROR: { emoji: '!', title: 'Checks error', className: 'ci-error' }
        };

        const config = statusConfig[card.ciStatus];
        if (!config) return null;

        return (
            <span className={`ci-status-badge ${config.className}`} title={config.title}>
                {config.emoji}
            </span>
        );
    };

    const isUnavailable = card.title === '[Unavailable]';

    return (
        <div
            className={`kanban-card ${isUnavailable ? 'kanban-card-unavailable' : ''}`}
            data-card-id={card.id}
            onClick={handleClick}
        >
            {/* Header with title and PR badges */}
            <div className="card-header">
                <div className="card-title">
                    {card.number && `#${card.number} `}
                    {truncate(card.title, settings.titleLength)}
                </div>
                <div className="card-header-badges">
                    {isUnavailable && (
                        <span className="card-unavailable-badge" title="Check token permissions">⚠️ UNAVAILABLE</span>
                    )}
                    {card.isDraft && (
                        <span className="pr-draft-badge" title="Draft PR">DRAFT</span>
                    )}
                    {card.type === 'PullRequest' && getReviewDecisionBadge()}
                    {card.type === 'PullRequest' && getCIStatusBadge()}
                </div>
            </div>

            {/* Repository */}
            {settings.showRepository && card.repository && (
                <div className="card-repository" title={`Repository: ${card.repository.nameWithOwner}`}>
                    {card.repository.nameWithOwner}
                </div>
            )}

            {/* Labels */}
            {settings.showLabels && card.labels && card.labels.length > 0 && (
                <div className="card-labels">
                    {card.labels.slice(0, settings.maxLabels).map(label => (
                        <span
                            key={label.name}
                            className="card-label"
                            style={{ backgroundColor: `#${label.color}` }}
                            title={label.name}
                        >
                            {label.name}
                        </span>
                    ))}
                    {card.labels.length > settings.maxLabels && (
                        <span className="card-label-more" title={`+${card.labels.length - settings.maxLabels} more labels`}>
                            +{card.labels.length - settings.maxLabels}
                        </span>
                    )}
                </div>
            )}

            {/* Description */}
            {settings.showDescription && card.body && (
                <div className="card-description">
                    {truncate(card.body, settings.descriptionLength)}
                </div>
            )}

            {/* Milestone */}
            {settings.showMilestone && card.milestone && (
                <div className="card-milestone" title={`Milestone: ${card.milestone.title}`}>
                    🎯 {card.milestone.title}
                </div>
            )}

            {/* PR Changes */}
            {settings.showPRChanges && card.type === 'PullRequest' && (card.additions !== undefined || card.deletions !== undefined) && (
                <div className="card-pr-changes">
                    {card.additions !== undefined && (
                        <span className="pr-additions" title={`${card.additions} additions`}>
                            +{card.additions}
                        </span>
                    )}
                    {card.deletions !== undefined && (
                        <span className="pr-deletions" title={`${card.deletions} deletions`}>
                            -{card.deletions}
                        </span>
                    )}
                </div>
            )}

            {/* Metadata row */}
            <div className="card-metadata">
                {/* Author */}
                {settings.showAuthor && card.author && (
                    <div className="card-author" title={`Created by ${card.author.login}`}>
                        {card.author.avatarUrl ? (
                            <img
                                src={card.author.avatarUrl}
                                alt={card.author.login}
                            />
                        ) : (
                            <div className="author-initials">
                                {getInitials(card.author.login)}
                            </div>
                        )}
                    </div>
                )}

                {/* Assignees */}
                {settings.showAssignees && card.assignees.length > 0 && (
                    <div className="card-assignees">
                        {card.assignees.slice(0, settings.maxAssignees).map(assignee => (
                            <div key={assignee.login} className="card-assignee">
                                {assignee.avatarUrl ? (
                                    <img
                                        src={assignee.avatarUrl}
                                        alt={assignee.login}
                                        title={`Assigned to ${assignee.login}`}
                                    />
                                ) : (
                                    <div className="assignee-initials" title={assignee.login}>
                                        {getInitials(assignee.login)}
                                    </div>
                                )}
                            </div>
                        ))}
                        {card.assignees.length > settings.maxAssignees && (
                            <div className="assignee-more">
                                +{card.assignees.length - settings.maxAssignees}
                            </div>
                        )}
                    </div>
                )}

                {/* Engagement metrics */}
                {(settings.showCommentCount || settings.showReactionCount) && (
                    <div className="card-engagement">
                        {settings.showCommentCount && card.commentCount !== undefined && card.commentCount > 0 && (
                            <span className="engagement-item" title={`${card.commentCount} comments`}>
                                💬 {card.commentCount}
                            </span>
                        )}
                        {settings.showReactionCount && card.reactionCount !== undefined && card.reactionCount > 0 && (
                            <span className="engagement-item" title={`${card.reactionCount} reactions`}>
                                👍 {card.reactionCount}
                            </span>
                        )}
                    </div>
                )}

                {/* Timestamp */}
                {settings.showUpdatedTime && card.updatedAt && (
                    <div className="card-timestamp" title={new Date(card.updatedAt).toLocaleString()}>
                        {formatRelativeTime(card.updatedAt)}
                    </div>
                )}

                {/* State badge */}
                {settings.showState && card.state && (
                    <div className={`card-state card-state-${card.state.toLowerCase()}`}>
                        {card.state}
                    </div>
                )}
            </div>
        </div>
    );
};
