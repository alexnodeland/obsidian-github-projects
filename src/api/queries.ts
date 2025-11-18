// GraphQL queries for GitHub Projects V2

export const QUERIES = {
    GET_VIEWER: `
        query {
            viewer {
                login
                name
                avatarUrl
            }
        }
    `,

    GET_PROJECT: `
        query($org: String!, $number: Int!) {
            organization(login: $org) {
                projectV2(number: $number) {
                    id
                    title
                    url
                    number
                    fields(first: 20) {
                        nodes {
                            ... on ProjectV2Field {
                                id
                                name
                            }
                            ... on ProjectV2SingleSelectField {
                                id
                                name
                                options {
                                    id
                                    name
                                }
                            }
                            ... on ProjectV2IterationField {
                                id
                                name
                                configuration {
                                    iterations {
                                        id
                                        startDate
                                        title
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `,

    GET_PROJECT_ITEMS: `
        query($projectId: ID!, $cursor: String) {
            node(id: $projectId) {
                ... on ProjectV2 {
                    items(first: 100, after: $cursor) {
                        nodes {
                            id
                            type
                            fieldValues(first: 20) {
                                nodes {
                                    ... on ProjectV2ItemFieldTextValue {
                                        text
                                        field {
                                            ... on ProjectV2FieldCommon {
                                                name
                                            }
                                        }
                                    }
                                    ... on ProjectV2ItemFieldNumberValue {
                                        number
                                        field {
                                            ... on ProjectV2FieldCommon {
                                                name
                                            }
                                        }
                                    }
                                    ... on ProjectV2ItemFieldDateValue {
                                        date
                                        field {
                                            ... on ProjectV2FieldCommon {
                                                name
                                            }
                                        }
                                    }
                                    ... on ProjectV2ItemFieldSingleSelectValue {
                                        name
                                        optionId
                                        field {
                                            ... on ProjectV2FieldCommon {
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                            content {
                                ... on Issue {
                                    title
                                    number
                                    url
                                    state
                                    body
                                    assignees(first: 5) {
                                        nodes {
                                            login
                                            avatarUrl
                                        }
                                    }
                                }
                                ... on PullRequest {
                                    title
                                    number
                                    url
                                    state
                                    body
                                    assignees(first: 5) {
                                        nodes {
                                            login
                                            avatarUrl
                                        }
                                    }
                                }
                                ... on DraftIssue {
                                    title
                                    body
                                }
                            }
                        }
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            }
        }
    `,

    GET_RATE_LIMIT: `
        query {
            rateLimit {
                limit
                remaining
                used
                resetAt
                cost
            }
        }
    `
};
