// GraphQL mutations for GitHub Projects V2

export const MUTATIONS = {
    UPDATE_SINGLE_SELECT_FIELD: `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: {
                    singleSelectOptionId: $optionId
                }
            }) {
                projectV2Item {
                    id
                }
            }
        }
    `,

    UPDATE_TEXT_FIELD: `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $text: String!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: {
                    text: $text
                }
            }) {
                projectV2Item {
                    id
                }
            }
        }
    `,

    UPDATE_NUMBER_FIELD: `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $number: Float!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: {
                    number: $number
                }
            }) {
                projectV2Item {
                    id
                }
            }
        }
    `,

    UPDATE_DATE_FIELD: `
        mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $date: Date!) {
            updateProjectV2ItemFieldValue(input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: {
                    date: $date
                }
            }) {
                projectV2Item {
                    id
                }
            }
        }
    `,

    ADD_ITEM_BY_ID: `
        mutation($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemById(input: {
                projectId: $projectId
                contentId: $contentId
            }) {
                item {
                    id
                }
            }
        }
    `,

    ADD_DRAFT_ISSUE: `
        mutation($projectId: ID!, $title: String!, $body: String) {
            addProjectV2DraftIssue(input: {
                projectId: $projectId
                title: $title
                body: $body
            }) {
                projectItem {
                    id
                }
            }
        }
    `,

    ARCHIVE_ITEM: `
        mutation($projectId: ID!, $itemId: ID!) {
            archiveProjectV2Item(input: {
                projectId: $projectId
                itemId: $itemId
            }) {
                item {
                    id
                }
            }
        }
    `,

    DELETE_ITEM: `
        mutation($projectId: ID!, $itemId: ID!) {
            deleteProjectV2Item(input: {
                projectId: $projectId
                itemId: $itemId
            }) {
                deletedItemId
            }
        }
    `
};
