export const discoverDocument = {
    ServerUrl: 'https://server.transcendence.fr',
    OAuthRedirectRoute:
    {
        description: 'Internal: Used for getting OAuth Exchange code back from google identity service',
        route: '/OAuth/code',
        params: ['state', 'code', 'scope']
    },
    OAuthStateCodeRoute:
    {
        description: 'Front: Get a random state code to protect against CSRF attacks. Also to provide a redirect url to get the user back to the original page he was in before login, otherwise the user will remain on the server url after successfully google login. To do so set the variable ?ref= in the query string to the original page url',
        route: '/OAuth/state',
        params: ['ref']
    },
    FetchUserInfoRoute:
    {
        description: 'Front: Get information about the user with uid.',
        route: '/user/info',
        params: ['uid']
    }
};

export const discoverDocumentSerialized = JSON.stringify(discoverDocument);