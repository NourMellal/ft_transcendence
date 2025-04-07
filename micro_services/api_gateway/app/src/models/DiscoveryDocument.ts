export const discoverDocument = {
    ServerUrl: 'https://server.transcendence.fr',
    OAuthRedirectRoute:
    {
        description: 'Internal: Used for getting OAuth Exchange code back from google identity service',
        route: '/OAuth/code',
        params: ['state', 'code', 'scope']
    },
    OAuthStateRoute:
    {
        description: 'Front: Get a random state code to protect against CSRF attacks.',
        route: '/OAuth/state',
    },
    FetchUserInfoRoute:
    {
        description: 'Front: Get information about the user with uid.',
        route: '/user/info',
        params: ['uid']
    }
};

export const discoverDocumentSerialized = JSON.stringify(discoverDocument);