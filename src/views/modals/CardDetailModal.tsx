import { App, Modal } from 'obsidian';
import { ProjectItem } from '../../api/types';

/**
 * Modal for viewing card details
 */
export class CardDetailModal extends Modal {
    constructor(app: App, private card: ProjectItem) {
        super(app);
    }

    onOpen() {
        const { contentEl, titleEl } = this;

        titleEl.setText(this.card.title);

        // Card number and type
        if (this.card.number) {
            const header = contentEl.createDiv({ cls: 'card-detail-header' });
            header.createEl('span', {
                text: `#${this.card.number}`,
                cls: 'card-detail-number'
            });
            header.createEl('span', {
                text: this.card.type,
                cls: 'card-detail-type'
            });
        }

        // State and badges row
        const badgeRow = contentEl.createDiv({ cls: 'card-detail-badges' });

        if (this.card.state) {
            badgeRow.createEl('span', {
                text: this.card.state,
                cls: `state-badge state-${this.card.state.toLowerCase()}`
            });
        }

        if (this.card.isDraft) {
            badgeRow.createEl('span', {
                text: 'DRAFT',
                cls: 'state-badge state-draft'
            });
        }

        if (this.card.reviewDecision) {
            const reviewText = {
                'APPROVED': '✓ Approved',
                'CHANGES_REQUESTED': '✗ Changes Requested',
                'REVIEW_REQUIRED': '👁 Review Required'
            }[this.card.reviewDecision];

            badgeRow.createEl('span', {
                text: reviewText,
                cls: `state-badge state-review-${this.card.reviewDecision.toLowerCase()}`
            });
        }

        if (this.card.ciStatus) {
            const ciText = {
                'SUCCESS': '✓ Checks Passing',
                'PENDING': '● Checks Pending',
                'FAILURE': '✗ Checks Failing',
                'ERROR': '! Checks Error'
            }[this.card.ciStatus];

            badgeRow.createEl('span', {
                text: ciText,
                cls: `state-badge state-ci-${this.card.ciStatus.toLowerCase()}`
            });
        }

        // Repository
        if (this.card.repository) {
            const repoSection = contentEl.createDiv({ cls: 'card-detail-section' });
            repoSection.createEl('h3', { text: 'Repository' });
            const repoUrl = `https://github.com/${this.card.repository.nameWithOwner}`;
            const repoLink = repoSection.createEl('a', {
                text: this.card.repository.nameWithOwner,
                href: repoUrl,
                cls: 'external-link card-repository-link'
            });
            repoLink.setAttr('target', '_blank');
        }

        // Labels
        if (this.card.labels && this.card.labels.length > 0) {
            const labelSection = contentEl.createDiv({ cls: 'card-detail-section' });
            labelSection.createEl('h3', { text: 'Labels' });
            const labelList = labelSection.createDiv({ cls: 'label-list' });

            this.card.labels.forEach(label => {
                const labelEl = labelList.createEl('span', {
                    text: label.name,
                    cls: 'label-badge'
                });
                labelEl.style.backgroundColor = `#${label.color}`;
            });
        }

        // Milestone
        if (this.card.milestone) {
            const milestoneSection = contentEl.createDiv({ cls: 'card-detail-section' });
            milestoneSection.createEl('h3', { text: 'Milestone' });
            const milestoneText = this.card.milestone.dueOn
                ? `🎯 ${this.card.milestone.title} (Due: ${new Date(this.card.milestone.dueOn).toLocaleDateString()})`
                : `🎯 ${this.card.milestone.title}`;
            milestoneSection.createEl('p', { text: milestoneText });
        }

        // Description/Body
        if (this.card.body) {
            const bodySection = contentEl.createDiv({ cls: 'card-detail-section' });
            bodySection.createEl('h3', { text: 'Description' });
            bodySection.createEl('p', { text: this.card.body, cls: 'card-detail-body' });
        }

        // Author
        if (this.card.author) {
            const authorSection = contentEl.createDiv({ cls: 'card-detail-section' });
            authorSection.createEl('h3', { text: 'Author' });
            const authorItem = authorSection.createDiv({ cls: 'author-item' });
            if (this.card.author.avatarUrl) {
                authorItem.createEl('img', {
                    attr: { src: this.card.author.avatarUrl, alt: this.card.author.login },
                    cls: 'author-avatar'
                });
            }
            authorItem.createEl('span', { text: this.card.author.login });
        }

        // Assignees
        if (this.card.assignees.length > 0) {
            const assigneeSection = contentEl.createDiv({ cls: 'card-detail-section' });
            assigneeSection.createEl('h3', { text: 'Assignees' });
            const assigneeList = assigneeSection.createDiv({ cls: 'assignee-list' });

            this.card.assignees.forEach(assignee => {
                const assigneeItem = assigneeList.createDiv({ cls: 'assignee-item' });
                if (assignee.avatarUrl) {
                    assigneeItem.createEl('img', {
                        attr: { src: assignee.avatarUrl, alt: assignee.login }
                    });
                }
                assigneeItem.createEl('span', { text: assignee.login });
            });
        }

        // Reviewers (for PRs)
        if (this.card.reviewers && this.card.reviewers.length > 0) {
            const reviewerSection = contentEl.createDiv({ cls: 'card-detail-section' });
            reviewerSection.createEl('h3', { text: 'Reviewers' });
            const reviewerList = reviewerSection.createDiv({ cls: 'assignee-list' });

            this.card.reviewers.forEach(reviewer => {
                const reviewerItem = reviewerList.createDiv({ cls: 'assignee-item' });
                if (reviewer.avatarUrl) {
                    reviewerItem.createEl('img', {
                        attr: { src: reviewer.avatarUrl, alt: reviewer.login }
                    });
                }
                reviewerItem.createEl('span', { text: reviewer.login });
            });
        }

        // PR Changes
        if (this.card.type === 'PullRequest' && (this.card.additions !== undefined || this.card.deletions !== undefined)) {
            const changesSection = contentEl.createDiv({ cls: 'card-detail-section' });
            changesSection.createEl('h3', { text: 'Changes' });
            const changesText = `+${this.card.additions || 0} additions, -${this.card.deletions || 0} deletions`;
            changesSection.createEl('p', { text: changesText, cls: 'pr-changes-text' });
        }

        // Engagement
        const hasEngagement = (this.card.commentCount && this.card.commentCount > 0) ||
                             (this.card.reactionCount && this.card.reactionCount > 0);

        if (hasEngagement) {
            const engagementSection = contentEl.createDiv({ cls: 'card-detail-section' });
            engagementSection.createEl('h3', { text: 'Engagement' });
            const engagementText = [];

            if (this.card.commentCount && this.card.commentCount > 0) {
                engagementText.push(`💬 ${this.card.commentCount} comments`);
            }
            if (this.card.reactionCount && this.card.reactionCount > 0) {
                engagementText.push(`👍 ${this.card.reactionCount} reactions`);
            }

            engagementSection.createEl('p', { text: engagementText.join(' • ') });
        }

        // Timestamps
        const timestamps = contentEl.createDiv({ cls: 'card-detail-section card-detail-timestamps' });
        timestamps.createEl('h3', { text: 'Timeline' });

        if (this.card.createdAt) {
            const created = timestamps.createDiv({ cls: 'timestamp-item' });
            created.createEl('span', { text: 'Created:', cls: 'timestamp-label' });
            created.createEl('span', { text: new Date(this.card.createdAt).toLocaleString() });
        }

        if (this.card.updatedAt) {
            const updated = timestamps.createDiv({ cls: 'timestamp-item' });
            updated.createEl('span', { text: 'Updated:', cls: 'timestamp-label' });
            updated.createEl('span', { text: new Date(this.card.updatedAt).toLocaleString() });
        }

        if (this.card.closedAt) {
            const closed = timestamps.createDiv({ cls: 'timestamp-item' });
            closed.createEl('span', { text: 'Closed:', cls: 'timestamp-label' });
            closed.createEl('span', { text: new Date(this.card.closedAt).toLocaleString() });
        }

        if (this.card.mergedAt) {
            const merged = timestamps.createDiv({ cls: 'timestamp-item' });
            merged.createEl('span', { text: 'Merged:', cls: 'timestamp-label' });
            merged.createEl('span', { text: new Date(this.card.mergedAt).toLocaleString() });
        }

        // Field values
        if (this.card.fieldValues.size > 0) {
            const fieldsSection = contentEl.createDiv({ cls: 'card-detail-section' });
            fieldsSection.createEl('h3', { text: 'Project Fields' });
            const fieldsList = fieldsSection.createDiv({ cls: 'fields-list' });

            this.card.fieldValues.forEach((fieldValue, fieldName) => {
                if (fieldValue.value !== null) {
                    const fieldItem = fieldsList.createDiv({ cls: 'field-item' });
                    fieldItem.createEl('span', {
                        text: fieldName + ':',
                        cls: 'field-name'
                    });
                    fieldItem.createEl('span', {
                        text: String(fieldValue.value),
                        cls: 'field-value'
                    });
                }
            });
        }

        // URL link
        if (this.card.url) {
            const linkSection = contentEl.createDiv({ cls: 'card-detail-section' });
            const link = linkSection.createEl('a', {
                text: '🔗 View on GitHub',
                href: this.card.url,
                cls: 'external-link'
            });
            link.setAttr('target', '_blank');
        }

        // Close button
        const buttonGroup = contentEl.createDiv({ cls: 'modal-button-group' });
        const closeBtn = buttonGroup.createEl('button', {
            text: 'Close',
            cls: 'mod-cta'
        });
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
