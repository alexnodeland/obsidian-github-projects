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

        // State
        if (this.card.state) {
            const stateBadge = contentEl.createDiv({ cls: 'card-detail-state' });
            stateBadge.createEl('span', {
                text: this.card.state,
                cls: `state-badge state-${this.card.state.toLowerCase()}`
            });
        }

        // Description/Body
        if (this.card.body) {
            const bodySection = contentEl.createDiv({ cls: 'card-detail-section' });
            bodySection.createEl('h3', { text: 'Description' });
            bodySection.createEl('p', { text: this.card.body, cls: 'card-detail-body' });
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

        // Field values
        if (this.card.fieldValues.size > 0) {
            const fieldsSection = contentEl.createDiv({ cls: 'card-detail-section' });
            fieldsSection.createEl('h3', { text: 'Fields' });
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
                text: 'View on GitHub',
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
