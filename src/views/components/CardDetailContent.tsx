import { h } from 'preact';
import { useState } from 'preact/hooks';
import { ProjectItem, Label, Assignee } from '../../api/types';
import { GitHubClient } from '../../api/github-client';

interface CardDetailContentProps {
    card: ProjectItem;
    githubClient: GitHubClient;
    onUpdate: (updatedCard: Partial<ProjectItem>) => void;
    onClose: () => void;
}

export const CardDetailContent = ({ card, githubClient, onUpdate, onClose }: CardDetailContentProps) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(card.title);
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [editedBody, setEditedBody] = useState(card.body || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveTitle = async () => {
        if (editedTitle === card.title || !editedTitle.trim()) {
            setIsEditingTitle(false);
            setEditedTitle(card.title);
            return;
        }

        setIsSaving(true);
        try {
            if (card.type === 'Issue') {
                await githubClient.updateIssue(card.id, editedTitle, undefined);
            } else if (card.type === 'PullRequest') {
                await githubClient.updatePullRequest(card.id, editedTitle, undefined);
            }
            onUpdate({ title: editedTitle });
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Failed to update title:', error);
            setEditedTitle(card.title);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBody = async () => {
        if (editedBody === (card.body || '')) {
            setIsEditingBody(false);
            return;
        }

        setIsSaving(true);
        try {
            if (card.type === 'Issue') {
                await githubClient.updateIssue(card.id, undefined, editedBody);
            } else if (card.type === 'PullRequest') {
                await githubClient.updatePullRequest(card.id, undefined, editedBody);
            }
            onUpdate({ body: editedBody });
            setIsEditingBody(false);
        } catch (error) {
            console.error('Failed to update description:', error);
            setEditedBody(card.body || '');
        } finally {
            setIsSaving(false);
        }
    };

    const renderBadges = () => {
        const badges = [];

        if (card.state) {
            badges.push(
                <span className={`state-badge state-${card.state.toLowerCase()}`}>
                    {card.state}
                </span>
            );
        }

        if (card.isDraft) {
            badges.push(<span className="state-badge state-draft">DRAFT</span>);
        }

        if (card.reviewDecision) {
            const reviewText = {
                'APPROVED': '✓ Approved',
                'CHANGES_REQUESTED': '✗ Changes Requested',
                'REVIEW_REQUIRED': '👁 Review Required'
            }[card.reviewDecision];
            badges.push(
                <span className={`state-badge state-review-${card.reviewDecision.toLowerCase()}`}>
                    {reviewText}
                </span>
            );
        }

        if (card.ciStatus) {
            const ciText = {
                'SUCCESS': '✓ Checks Passing',
                'PENDING': '● Checks Pending',
                'FAILURE': '✗ Checks Failing',
                'ERROR': '! Checks Error'
            }[card.ciStatus];
            badges.push(
                <span className={`state-badge state-ci-${card.ciStatus.toLowerCase()}`}>
                    {ciText}
                </span>
            );
        }

        return badges;
    };

    return (
        <div className="card-detail-container">
            <div className="card-detail-main">
                {/* Left column - Main content */}
                <div className="card-detail-left">
                    {/* Header with number and type */}
                    <div className="card-detail-header">
                        {card.number && <span className="card-detail-number">#{card.number}</span>}
                        <span className="card-detail-type">{card.type}</span>
                    </div>

                    {/* Editable Title */}
                    <div className="card-detail-title-section">
                        {isEditingTitle ? (
                            <div className="editable-field">
                                <input
                                    type="text"
                                    className="card-detail-title-input"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle((e.target as HTMLInputElement).value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') {
                                            setEditedTitle(card.title);
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <h1
                                className="card-detail-title"
                                onClick={() => setIsEditingTitle(true)}
                                title="Click to edit title"
                            >
                                {card.title}
                            </h1>
                        )}
                    </div>

                    {/* Editable Description */}
                    <div className="card-detail-body-section">
                        <h3>Description</h3>
                        {isEditingBody ? (
                            <div className="editable-field">
                                <textarea
                                    className="card-detail-body-input"
                                    value={editedBody}
                                    onChange={(e) => setEditedBody((e.target as HTMLTextAreaElement).value)}
                                    onBlur={handleSaveBody}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setEditedBody(card.body || '');
                                            setIsEditingBody(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    rows={10}
                                    autoFocus
                                />
                                <div className="editable-field-hint">
                                    Press Esc to cancel, click outside to save
                                </div>
                            </div>
                        ) : (
                            <div
                                className="card-detail-body"
                                onClick={() => setIsEditingBody(true)}
                                title="Click to edit description"
                            >
                                {card.body || <span className="empty-field">No description provided. Click to add one.</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column - Metadata */}
                <div className="card-detail-right">
                    {/* Status Badges */}
                    {renderBadges().length > 0 && (
                        <div className="card-detail-section">
                            <h3>Status</h3>
                            <div className="card-detail-badges">
                                {renderBadges()}
                            </div>
                        </div>
                    )}

                    {/* Repository */}
                    {card.repository && (
                        <div className="card-detail-section">
                            <h3>Repository</h3>
                            <a
                                href={`https://github.com/${card.repository.nameWithOwner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-link card-repository-link"
                            >
                                {card.repository.nameWithOwner}
                            </a>
                        </div>
                    )}

                    {/* Labels - Editable */}
                    <div className="card-detail-section">
                        <h3>Labels</h3>
                        {card.labels && card.labels.length > 0 ? (
                            <div className="label-list">
                                {card.labels.map(label => (
                                    <span
                                        key={label.name}
                                        className="label-badge"
                                        style={{ backgroundColor: `#${label.color}` }}
                                    >
                                        {label.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-field-small">No labels</div>
                        )}
                    </div>

                    {/* Assignees - Editable */}
                    <div className="card-detail-section">
                        <h3>Assignees</h3>
                        {card.assignees.length > 0 ? (
                            <div className="assignee-list">
                                {card.assignees.map(assignee => (
                                    <div key={assignee.login} className="assignee-item">
                                        {assignee.avatarUrl && (
                                            <img src={assignee.avatarUrl} alt={assignee.login} />
                                        )}
                                        <span>{assignee.login}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-field-small">No assignees</div>
                        )}
                    </div>

                    {/* Author */}
                    {card.author && (
                        <div className="card-detail-section">
                            <h3>Author</h3>
                            <div className="author-item">
                                {card.author.avatarUrl && (
                                    <img src={card.author.avatarUrl} alt={card.author.login} className="author-avatar" />
                                )}
                                <span>{card.author.login}</span>
                            </div>
                        </div>
                    )}

                    {/* Reviewers (for PRs) */}
                    {card.reviewers && card.reviewers.length > 0 && (
                        <div className="card-detail-section">
                            <h3>Reviewers</h3>
                            <div className="assignee-list">
                                {card.reviewers.map(reviewer => (
                                    <div key={reviewer.login} className="assignee-item">
                                        {reviewer.avatarUrl && (
                                            <img src={reviewer.avatarUrl} alt={reviewer.login} />
                                        )}
                                        <span>{reviewer.login}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Milestone */}
                    {card.milestone && (
                        <div className="card-detail-section">
                            <h3>Milestone</h3>
                            <div className="milestone-info">
                                🎯 {card.milestone.title}
                                {card.milestone.dueOn && (
                                    <div className="milestone-due">
                                        Due: {new Date(card.milestone.dueOn).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PR Changes */}
                    {card.type === 'PullRequest' && (card.additions !== undefined || card.deletions !== undefined) && (
                        <div className="card-detail-section">
                            <h3>Changes</h3>
                            <div className="pr-changes-text">
                                <span className="pr-additions">+{card.additions || 0}</span>
                                {' / '}
                                <span className="pr-deletions">-{card.deletions || 0}</span>
                            </div>
                        </div>
                    )}

                    {/* Engagement */}
                    {((card.commentCount && card.commentCount > 0) || (card.reactionCount && card.reactionCount > 0)) && (
                        <div className="card-detail-section">
                            <h3>Engagement</h3>
                            <div className="engagement-info">
                                {card.commentCount !== undefined && card.commentCount > 0 && (
                                    <div>💬 {card.commentCount} comments</div>
                                )}
                                {card.reactionCount !== undefined && card.reactionCount > 0 && (
                                    <div>👍 {card.reactionCount} reactions</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="card-detail-section">
                        <h3>Timeline</h3>
                        <div className="timestamps-list">
                            {card.createdAt && (
                                <div className="timestamp-item">
                                    <span className="timestamp-label">Created:</span>
                                    <span className="timestamp-value">{new Date(card.createdAt).toLocaleDateString()}</span>
                                </div>
                            )}
                            {card.updatedAt && (
                                <div className="timestamp-item">
                                    <span className="timestamp-label">Updated:</span>
                                    <span className="timestamp-value">{new Date(card.updatedAt).toLocaleDateString()}</span>
                                </div>
                            )}
                            {card.closedAt && (
                                <div className="timestamp-item">
                                    <span className="timestamp-label">Closed:</span>
                                    <span className="timestamp-value">{new Date(card.closedAt).toLocaleDateString()}</span>
                                </div>
                            )}
                            {card.mergedAt && (
                                <div className="timestamp-item">
                                    <span className="timestamp-label">Merged:</span>
                                    <span className="timestamp-value">{new Date(card.mergedAt).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GitHub Link */}
                    {card.url && (
                        <div className="card-detail-section">
                            <a
                                href={card.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-link github-link-button"
                            >
                                🔗 View on GitHub
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Close button */}
            <div className="modal-button-group">
                <button className="mod-cta" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};
