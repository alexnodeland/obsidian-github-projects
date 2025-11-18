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
    `,

    // Issue and Pull Request mutations
    UPDATE_ISSUE: `
        mutation UpdateIssue($input: UpdateIssueInput!) {
            updateIssue(input: $input) {
                issue {
                    id
                    title
                    body
                    state
                }
            }
        }
    `,

    UPDATE_PULL_REQUEST: `
        mutation UpdatePullRequest($input: UpdatePullRequestInput!) {
            updatePullRequest(input: $input) {
                pullRequest {
                    id
                    title
                    body
                    state
                }
            }
        }
    `,

    ADD_LABELS: `
        mutation AddLabels($input: AddLabelsToLabelableInput!) {
            addLabelsToLabelable(input: $input) {
                labelable {
                    ... on Issue {
                        id
                        labels(first: 10) {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                    ... on PullRequest {
                        id
                        labels(first: 10) {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                }
            }
        }
    `,

    REMOVE_LABELS: `
        mutation RemoveLabels($input: RemoveLabelsFromLabelableInput!) {
            removeLabelsFromLabelable(input: $input) {
                labelable {
                    ... on Issue {
                        id
                        labels(first: 10) {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                    ... on PullRequest {
                        id
                        labels(first: 10) {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                }
            }
        }
    `,

    ADD_ASSIGNEES: `
        mutation AddAssignees($input: AddAssigneesToAssignableInput!) {
            addAssigneesToAssignable(input: $input) {
                assignable {
                    ... on Issue {
                        id
                        assignees(first: 5) {
                            nodes {
                                id
                                login
                                avatarUrl
                            }
                        }
                    }
                    ... on PullRequest {
                        id
                        assignees(first: 5) {
                            nodes {
                                id
                                login
                                avatarUrl
                            }
                        }
                    }
                }
            }
        }
    `,

    REMOVE_ASSIGNEES: `
        mutation RemoveAssignees($input: RemoveAssigneesFromAssignableInput!) {
            removeAssigneesFromAssignable(input: $input) {
                assignable {
                    ... on Issue {
                        id
                        assignees(first: 5) {
                            nodes {
                                id
                                login
                                avatarUrl
                            }
                        }
                    }
                    ... on PullRequest {
                        id
                        assignees(first: 5) {
                            nodes {
                                id
                                login
                                avatarUrl
                            }
                        }
                    }
                }
            }
        }
    `,

    CLOSE_ISSUE: `
        mutation CloseIssue($input: CloseIssueInput!) {
            closeIssue(input: $input) {
                issue {
                    id
                    state
                    closedAt
                }
            }
        }
    `,

    REOPEN_ISSUE: `
        mutation ReopenIssue($input: ReopenIssueInput!) {
            reopenIssue(input: $input) {
                issue {
                    id
                    state
                }
            }
        }
    `,

    CLOSE_PULL_REQUEST: `
        mutation ClosePullRequest($input: ClosePullRequestInput!) {
            closePullRequest(input: $input) {
                pullRequest {
                    id
                    state
                    closedAt
                }
            }
        }
    `,

    REOPEN_PULL_REQUEST: `
        mutation ReopenPullRequest($input: ReopenPullRequestInput!) {
            reopenPullRequest(input: $input) {
                pullRequest {
                    id
                    state
                }
            }
        }
    `,

    // Helper queries
    GET_REPOSITORY_LABELS: `
        query GetRepositoryLabels($owner: String!, $repo: String!) {
            repository(owner: $owner, name: $repo) {
                labels(first: 100) {
                    nodes {
                        id
                        name
                        color
                    }
                }
            }
        }
    `,

    CREATE_LABEL: `
        mutation CreateLabel($input: CreateLabelInput!) {
            createLabel(input: $input) {
                label {
                    id
                    name
                    color
                }
            }
        }
    `,

    SEARCH_USERS: `
        query SearchUsers($query: String!) {
            search(query: $query, type: USER, first: 10) {
                nodes {
                    ... on User {
                        id
                        login
                        avatarUrl
                        name
                    }
                }
            }
        }
    `,

    GET_ISSUE_COMMENTS: `
        query GetIssueComments($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
                issue(number: $number) {
                    comments(first: 100, orderBy: {field: UPDATED_AT, direction: ASC}) {
                        nodes {
                            id
                            body
                            createdAt
                            updatedAt
                            author {
                                login
                                avatarUrl
                            }
                        }
                    }
                }
            }
        }
    `,

    GET_PR_COMMENTS: `
        query GetPRComments($owner: String!, $repo: String!, $number: Int!) {
            repository(owner: $owner, name: $repo) {
                pullRequest(number: $number) {
                    comments(first: 100, orderBy: {field: UPDATED_AT, direction: ASC}) {
                        nodes {
                            id
                            body
                            createdAt
                            updatedAt
                            author {
                                login
                                avatarUrl
                            }
                        }
                    }
                }
            }
        }
    `,

    ADD_COMMENT: `
        mutation AddComment($input: AddCommentInput!) {
            addComment(input: $input) {
                commentEdge {
                    node {
                        id
                        body
                        createdAt
                        updatedAt
                        author {
                            login
                            avatarUrl
                        }
                    }
                }
            }
        }
    `
};
