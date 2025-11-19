import { h, Fragment } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { ProjectItem, Label, Assignee, Comment } from '../../api/types';
import { GitHubClient } from '../../api/github-client';
import { ResizeHandle } from './ResizeHandle';
import { LoadingSpinner } from './LoadingSpinner';
import { useToasts } from './Toast';
import { ModalDisplaySettings } from '../../settings';

interface CardDetailContentProps {
    card: ProjectItem;
    githubClient: GitHubClient;
    onUpdate: (updatedCard: Partial<ProjectItem>) => void;
    onClose: () => void;
    settings: ModalDisplaySettings;
}

export const CardDetailContent = ({ card, githubClient, onUpdate, onClose, settings }: CardDetailContentProps) => {
    const { success, error: showError, info: _info } = useToasts();

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(card.title);
    const [isEditingBody, setIsEditingBody] = useState(false);
    const [editedBody, setEditedBody] = useState(card.body || '');
    const [isSaving, setIsSaving] = useState(false);

    // Resizable layout state
    const [sidebarWidth, setSidebarWidth] = useState(400);

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);

    // Labels editing state
    const [isEditingLabels, setIsEditingLabels] = useState(false);
    const [editedLabels, setEditedLabels] = useState<Label[]>(card.labels || []);
    const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
    const [isLoadingLabels, setIsLoadingLabels] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#0969da');
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);
    const [labelSearchQuery, setLabelSearchQuery] = useState('');

    // Assignees editing state
    const [isEditingAssignees, setIsEditingAssignees] = useState(false);
    const [editedAssignees, setEditedAssignees] = useState<Assignee[]>(card.assignees || []);
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

    // Refs for resize containers
    const mainContainerRef = useRef<HTMLDivElement>(null);

    const loadComments = useCallback(async () => {
        if (!card.repository || !card.number || card.type === 'DraftIssue') return;

        setIsLoadingComments(true);
        try {
            const commentsData = await githubClient.getComments(
                card.repository.owner,
                card.repository.name,
                card.number,
                card.type as 'Issue' | 'PullRequest'
            );
            setComments(commentsData);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoadingComments(false);
        }
    }, [card.repository, card.number, card.type, githubClient]);

    // Load comments when modal opens (only if comments section is enabled)
    useEffect(() => {
        if (settings.showComments && card.repository && card.number && card.type !== 'DraftIssue') {
            loadComments();
        }
    }, [settings.showComments, card.repository, card.number, card.type, loadComments]);

    const handleSaveTitle = async () => {
        console.log('[CardDetail] handleSaveTitle called', {
            editedTitle,
            currentTitle: card.title,
            contentId: card.contentId,
            cardType: card.type
        });

        if (editedTitle === card.title || !editedTitle.trim()) {
            console.log('[CardDetail] No changes or empty title, skipping save');
            setIsEditingTitle(false);
            setEditedTitle(card.title);
            return;
        }

        if (!card.contentId) {
            console.error('[CardDetail] No content ID available for this card');
            showError('Cannot edit this card: No content ID available. This may be an unavailable item.');
            setIsEditingTitle(false);
            return;
        }

        setIsSaving(true);
        try {
            console.log('[CardDetail] Calling GitHub API to update title', {
                contentId: card.contentId,
                newTitle: editedTitle,
                type: card.type
            });

            if (card.type === 'Issue') {
                await githubClient.updateIssue(card.contentId, editedTitle, undefined);
            } else if (card.type === 'PullRequest') {
                await githubClient.updatePullRequest(card.contentId, editedTitle, undefined);
            }

            console.log('[CardDetail] Title update successful');
            onUpdate({ title: editedTitle });
            setIsEditingTitle(false);
            success('Title updated successfully');
        } catch (error) {
            console.error('[CardDetail] Failed to update title:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showError(`Failed to update title: ${errorMessage}. This may be due to insufficient token permissions.`);
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

        if (!card.contentId) {
            console.error('No content ID available for this card');
            setIsEditingBody(false);
            return;
        }

        setIsSaving(true);
        try {
            if (card.type === 'Issue') {
                await githubClient.updateIssue(card.contentId, undefined, editedBody);
            } else if (card.type === 'PullRequest') {
                await githubClient.updatePullRequest(card.contentId, undefined, editedBody);
            }
            onUpdate({ body: editedBody });
            setIsEditingBody(false);
            success('Description updated successfully');
        } catch (error) {
            console.error('Failed to update description:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showError(`Failed to update description: ${errorMessage}. This may be due to insufficient token permissions.`);
            setEditedBody(card.body || '');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !card.contentId) return;

        setIsAddingComment(true);
        try {
            const comment = await githubClient.addComment(card.contentId, newComment);
            setComments([...comments, comment]);
            setNewComment('');
            success('Comment added successfully');
        } catch (error) {
            console.error('Failed to add comment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showError(`Failed to add comment: ${errorMessage}`);
        } finally {
            setIsAddingComment(false);
        }
    };

    const loadAvailableLabels = async () => {
        if (!card.repository || isLoadingLabels || availableLabels.length > 0) return;

        setIsLoadingLabels(true);
        try {
            const labels = await githubClient.getRepositoryLabels(
                card.repository.owner,
                card.repository.name
            );
            setAvailableLabels(labels);
        } catch (error) {
            console.error('Failed to load labels:', error);
        } finally {
            setIsLoadingLabels(false);
        }
    };

    const handleToggleLabel = async (label: Label) => {
        if (!card.contentId) return;

        const hasLabel = editedLabels.some(l => l.name === label.name);

        if (hasLabel) {
            // Remove label locally
            const newLabels = editedLabels.filter(l => l.name !== label.name);
            setEditedLabels(newLabels);

            // Sync to GitHub
            try {
                await githubClient.removeLabels(card.contentId, [label.id]);
                onUpdate({ labels: newLabels });
                success('Label removed successfully');
            } catch (error) {
                console.error('Failed to remove label:', error);
                showError(`Failed to remove label: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // Revert on error
                setEditedLabels(editedLabels);
            }
        } else {
            // Add label locally
            const newLabels = [...editedLabels, label];
            setEditedLabels(newLabels);

            // Sync to GitHub
            try {
                await githubClient.addLabels(card.contentId, [label.id]);
                onUpdate({ labels: newLabels });
                success('Label added successfully');
            } catch (error) {
                console.error('Failed to add label:', error);
                showError(`Failed to add label: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // Revert on error
                setEditedLabels(editedLabels);
            }
        }
    };

    const handleCreateLabel = async () => {
        if (!newLabelName.trim() || !card.contentId || !card.repository) return;

        // Check if label already exists
        if (editedLabels.some(l => l.name.toLowerCase() === newLabelName.trim().toLowerCase())) {
            showError('A label with this name already exists');
            return;
        }

        setIsCreatingLabel(true);
        try {
            // Use selected color (remove # if present)
            const color = newLabelColor.replace('#', '');

            // First create the label in the repository
            const createdLabel = await githubClient.createLabel(
                card.repository.id,
                newLabelName.trim(),
                color
            );

            // Then add the label to the issue/PR
            await githubClient.addLabels(card.contentId, [createdLabel.id]);

            // Update local state with the created label
            const newLabel: Label = {
                id: createdLabel.id,
                name: createdLabel.name,
                color: createdLabel.color
            };
            const newLabels = [...editedLabels, newLabel];
            setEditedLabels(newLabels);
            onUpdate({ labels: newLabels });

            // Add to available labels
            setAvailableLabels([...availableLabels, newLabel]);

            setNewLabelName('');
            setNewLabelColor('#0969da');
            success('Label created and added successfully');
        } catch (error) {
            console.error('Failed to create label:', error);
            showError(`Failed to create label: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCreatingLabel(false);
        }
    };

    const searchUsers = (query: string) => {
        // Clear previous debounce
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        if (!query.trim()) {
            setAvailableUsers([]);
            setIsSearchingUsers(false);
            return;
        }

        setIsSearchingUsers(true);

        // Debounce search by 300ms
        const timeout = setTimeout(async () => {
            try {
                const users = await githubClient.searchUsers(query);
                setAvailableUsers(users);
            } catch (error) {
                console.error('Failed to search users:', error);
                setAvailableUsers([]);
            } finally {
                setIsSearchingUsers(false);
            }
        }, 300);

        setSearchDebounce(timeout);
    };

    const handleToggleAssignee = async (user: any) => {
        if (!card.contentId) return;

        const isAssigned = editedAssignees.some(a => a.login === user.login);

        if (isAssigned) {
            // Remove assignee locally
            const newAssignees = editedAssignees.filter(a => a.login !== user.login);
            setEditedAssignees(newAssignees);

            // Sync to GitHub
            try {
                await githubClient.removeAssignees(card.contentId, [user.id]);
                onUpdate({ assignees: newAssignees });
                success('Assignee removed successfully');
            } catch (error) {
                console.error('Failed to remove assignee:', error);
                showError(`Failed to remove assignee: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // Revert on error
                setEditedAssignees(editedAssignees);
            }
        } else {
            // Add assignee locally
            const newAssignee: Assignee = { id: user.id, login: user.login, avatarUrl: user.avatarUrl };
            const newAssignees = [...editedAssignees, newAssignee];
            setEditedAssignees(newAssignees);

            // Sync to GitHub
            try {
                await githubClient.addAssignees(card.contentId, [user.id]);
                onUpdate({ assignees: newAssignees });
                success('Assignee added successfully');
            } catch (error) {
                console.error('Failed to add assignee:', error);
                showError(`Failed to add assignee: ${error instanceof Error ? error.message : 'Unknown error'}`);
                // Revert on error
                setEditedAssignees(editedAssignees);
            }
        }

        setAssigneeSearch('');
        setAvailableUsers([]);
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

    // Filter available labels based on search query
    const filteredAvailableLabels = availableLabels.filter(
        label => !editedLabels.some(l => l.name === label.name) &&
            label.name.toLowerCase().includes(labelSearchQuery.toLowerCase())
    );

    // Predefined color palette for labels
    const labelColors = [
        '#0969da', '#1a7f37', '#8250df', '#bf3989', '#fb8500',
        '#d73a49', '#6f42c1', '#0366d6', '#28a745', '#ffd33d'
    ];

    return (
        <div className="card-detail-container">
            <div
                className="card-detail-main"
                ref={mainContainerRef}
                style={{
                    gridTemplateColumns: `1fr ${sidebarWidth}px`
                }}
            >
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
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            handleSaveBody();
                                        } else if (e.key === 'Escape') {
                                            setEditedBody(card.body || '');
                                            setIsEditingBody(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    rows={10}
                                    autoFocus
                                />
                                <div className="editable-field-hint">
                                    {isSaving ? <LoadingSpinner size="small" /> : 'Ctrl+Enter or click outside to save, Esc to cancel'}
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

                    {/* Collapsible Comments Section */}
                    {settings.showComments && (
                        <div className={`card-detail-comments-section ${isCommentsExpanded ? 'expanded' : 'collapsed'}`}>
                            <div
                                className="comments-header-bar"
                                onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                            >
                                <h3>Comments ({comments.length})</h3>
                                <button className="comments-toggle-button" title={isCommentsExpanded ? 'Collapse comments' : 'Expand comments'}>
                                    {isCommentsExpanded ? '▼' : '▶'}
                                </button>
                            </div>

                            {isCommentsExpanded && (
                            <div className="comments-expanded-content">
                                {/* Scrollable comments list */}
                                <div className="comments-list">
                                    {isLoadingComments ? (
                                        <div className="comments-loading">
                                            <LoadingSpinner size="medium" />
                                            <span>Loading comments...</span>
                                        </div>
                                    ) : comments.length > 0 ? (
                                        <Fragment>
                                            {comments.map(comment => (
                                                <div key={comment.id} className="comment-item">
                                                    <div className="comment-header">
                                                        {comment.author?.avatarUrl && (
                                                            <img src={comment.author.avatarUrl} alt={comment.author.login} className="comment-avatar" />
                                                        )}
                                                        <div className="comment-meta">
                                                            <span className="comment-author">{comment.author?.login || 'Unknown'}</span>
                                                            <span className="comment-date">
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="comment-body">{comment.body}</div>
                                                </div>
                                            ))}
                                        </Fragment>
                                    ) : (
                                        <div className="empty-field-small">No comments yet. Be the first to comment!</div>
                                    )}
                                </div>

                                {/* Fixed Add Comment Form at bottom */}
                                <div className="add-comment-form">
                                    <textarea
                                        className="comment-input"
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment((e.target as HTMLTextAreaElement).value)}
                                        rows={3}
                                        disabled={isAddingComment}
                                    />
                                    <button
                                        className="comment-submit-button"
                                        onClick={handleAddComment}
                                        disabled={isAddingComment || !newComment.trim()}
                                    >
                                        {isAddingComment ? <LoadingSpinner size="small" /> : 'Add Comment'}
                                    </button>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right column - Metadata with resizable width */}
                <div className="card-detail-right" style={{ position: 'relative' }}>
                    <ResizeHandle
                        direction="horizontal"
                        position="left"
                        onResize={(delta) => {
                            setSidebarWidth(Math.max(300, Math.min(600, sidebarWidth - delta.x)));
                        }}
                    />
                    {/* Status Badges */}
                    {settings.showStatusBadges && renderBadges().length > 0 && (
                        <div className="card-detail-section">
                            <h3>Status</h3>
                            <div className="card-detail-badges">
                                {renderBadges()}
                            </div>
                        </div>
                    )}

                    {/* Repository */}
                    {settings.showRepository && card.repository && (
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

                    {/* Labels - Editable with reorganized UI */}
                    {settings.showLabels && (
                        <div className="card-detail-section">
                        <div className="section-header-with-edit">
                            <h3>Labels</h3>
                            <button
                                className="edit-button"
                                onClick={() => {
                                    if (!isEditingLabels) {
                                        setEditedLabels(card.labels || []);
                                        loadAvailableLabels();
                                    }
                                    setIsEditingLabels(!isEditingLabels);
                                }}
                            >
                                {isEditingLabels ? 'Done' : 'Edit'}
                            </button>
                        </div>

                        {isEditingLabels && (
                            <div className="label-selector">
                                {/* Search available labels */}
                                {availableLabels.length > 5 && (
                                    <input
                                        type="text"
                                        className="label-search-input"
                                        placeholder="Search labels..."
                                        value={labelSearchQuery}
                                        onChange={(e) => setLabelSearchQuery((e.target as HTMLInputElement).value)}
                                    />
                                )}

                                {/* Available labels - shown first */}
                                {isLoadingLabels ? (
                                    <div className="label-loading">
                                        <LoadingSpinner size="small" />
                                        <span>Loading labels...</span>
                                    </div>
                                ) : filteredAvailableLabels.length > 0 ? (
                                    <div className="available-labels">
                                        <label className="label-section-title">Available Labels:</label>
                                        {filteredAvailableLabels.map(label => (
                                            <button
                                                key={label.name}
                                                className="label-option"
                                                style={{ backgroundColor: `#${label.color}` }}
                                                onClick={() => handleToggleLabel(label)}
                                                title={`Add ${label.name}`}
                                            >
                                                + {label.name}
                                            </button>
                                        ))}
                                    </div>
                                ) : availableLabels.length > 0 ? (
                                    <div className="empty-field-small">All labels applied or filtered out</div>
                                ) : null}

                                {/* Create new label - styled as a blank label */}
                                <div className="create-label-section">
                                    <label className="label-section-title">Create New Label:</label>
                                    <div className="create-label-form-styled">
                                        <div
                                            className="label-badge-input"
                                            style={{ backgroundColor: newLabelColor }}
                                        >
                                            <input
                                                type="text"
                                                className="label-name-input-styled"
                                                placeholder="Label name..."
                                                value={newLabelName}
                                                onChange={(e) => setNewLabelName((e.target as HTMLInputElement).value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newLabelName.trim()) {
                                                        handleCreateLabel();
                                                    }
                                                }}
                                                disabled={isCreatingLabel}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="label-color-picker-container">
                                            <input
                                                type="color"
                                                className="label-color-picker"
                                                value={newLabelColor}
                                                onChange={(e) => setNewLabelColor((e.target as HTMLInputElement).value)}
                                                title="Choose label color"
                                            />
                                            <div className="label-color-presets">
                                                {labelColors.map(color => (
                                                    <button
                                                        key={color}
                                                        className="label-color-preset"
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => setNewLabelColor(color)}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            className="create-label-button-styled"
                                            onClick={handleCreateLabel}
                                            disabled={isCreatingLabel || !newLabelName.trim()}
                                        >
                                            {isCreatingLabel ? <LoadingSpinner size="small" /> : '+ Create & Add'}
                                        </button>
                                    </div>
                                </div>

                                {/* Applied labels - shown last */}
                                {editedLabels.length > 0 && (
                                    <div className="applied-labels-section">
                                        <label className="label-section-title">Applied Labels:</label>
                                        <div className="label-list">
                                            {editedLabels.map(label => (
                                                <span
                                                    key={label.name}
                                                    className="label-badge"
                                                    style={{ backgroundColor: `#${label.color}` }}
                                                >
                                                    {label.name}
                                                    <button
                                                        className="label-remove"
                                                        onClick={() => handleToggleLabel(label)}
                                                        title="Remove label"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* View mode - just show applied labels */}
                        {!isEditingLabels && (
                            editedLabels.length > 0 ? (
                                <div className="label-list">
                                    {editedLabels.map(label => (
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
                            )
                        )}
                        </div>
                    )}

                    {/* Assignees - Editable */}
                    {settings.showAssignees && (
                        <div className="card-detail-section">
                        <div className="section-header-with-edit">
                            <h3>Assignees</h3>
                            <button
                                className="edit-button"
                                onClick={() => {
                                    if (!isEditingAssignees) {
                                        setEditedAssignees(card.assignees || []); // Sync local state when entering edit mode
                                    }
                                    setIsEditingAssignees(!isEditingAssignees);
                                }}
                            >
                                {isEditingAssignees ? 'Done' : 'Edit'}
                            </button>
                        </div>

                        {editedAssignees.length > 0 && (
                            <div className="assignee-list">
                                {editedAssignees.map(assignee => (
                                    <div key={assignee.login} className="assignee-item">
                                        {assignee.avatarUrl && (
                                            <img src={assignee.avatarUrl} alt={assignee.login} />
                                        )}
                                        <span>{assignee.login}</span>
                                        {isEditingAssignees && (
                                            <button
                                                className="assignee-remove"
                                                onClick={() => handleToggleAssignee(assignee)}
                                                title="Remove assignee"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {isEditingAssignees && (
                            <div className="assignee-selector">
                                <input
                                    type="text"
                                    className="assignee-search"
                                    placeholder="Search users..."
                                    value={assigneeSearch}
                                    onChange={(e) => {
                                        const value = (e.target as HTMLInputElement).value;
                                        setAssigneeSearch(value);
                                        searchUsers(value);
                                    }}
                                />
                                {isSearchingUsers && (
                                    <div className="empty-field-small">Searching...</div>
                                )}
                                {availableUsers.length > 0 && (
                                    <div className="user-results">
                                        {availableUsers.map(user => (
                                            <button
                                                key={user.id}
                                                className="user-option"
                                                onClick={() => handleToggleAssignee(user)}
                                                disabled={editedAssignees.some(a => a.login === user.login)}
                                            >
                                                {user.avatarUrl && (
                                                    <img src={user.avatarUrl} alt={user.login} className="user-avatar" />
                                                )}
                                                <span>{user.login}</span>
                                                {user.name && <span className="user-name">({user.name})</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!isEditingAssignees && editedAssignees.length === 0 && (
                            <div className="empty-field-small">No assignees</div>
                        )}
                        </div>
                    )}

                    {/* Author */}
                    {settings.showAuthor && card.author && (
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
                    {settings.showReviewers && card.reviewers && card.reviewers.length > 0 && (
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
                    {settings.showMilestone && card.milestone && (
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
                    {settings.showPRChanges && card.type === 'PullRequest' && (card.additions !== undefined || card.deletions !== undefined) && (
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
                    {settings.showEngagement && ((card.commentCount && card.commentCount > 0) || (card.reactionCount && card.reactionCount > 0)) && (
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
                    {settings.showTimeline && (
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
                    )}

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
