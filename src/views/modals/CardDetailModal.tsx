import { App, Modal } from 'obsidian';
import { render, h } from 'preact';
import { ProjectItem } from '../../api/types';
import { GitHubClient } from '../../api/github-client';
import { CardDetailContent } from '../components/CardDetailContent';

/**
 * Modal for viewing and editing card details
 */
export class CardDetailModal extends Modal {
    private card: ProjectItem;
    private githubClient: GitHubClient;
    private onCardUpdate?: (updatedCard: Partial<ProjectItem>) => void;

    constructor(app: App, card: ProjectItem, githubClient: GitHubClient, onCardUpdate?: (updatedCard: Partial<ProjectItem>) => void) {
        super(app);
        this.card = card;
        this.githubClient = githubClient;
        this.onCardUpdate = onCardUpdate;
    }

    onOpen() {
        const { contentEl, titleEl } = this;

        // Set modal title
        titleEl.setText(this.card.title);

        // Add modal class for styling
        this.modalEl.addClass('card-detail-modal');

        // Render Preact component
        render(
            h(CardDetailContent, {
                card: this.card,
                githubClient: this.githubClient,
                onUpdate: (updatedCard: Partial<ProjectItem>) => {
                    // Update local card object
                    Object.assign(this.card, updatedCard);

                    // Update modal title if title changed
                    if (updatedCard.title) {
                        titleEl.setText(updatedCard.title);
                    }

                    // Notify parent
                    if (this.onCardUpdate) {
                        this.onCardUpdate(updatedCard);
                    }
                },
                onClose: () => this.close()
            }),
            contentEl
        );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
