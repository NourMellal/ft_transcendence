export const discoverDocument = {
    ServerUrl: 'https://server.transcendence.fr',
    OAuthRedirectRoute:
    {
        description: 'Internal: Used for getting OAuth Exchange code back from google identity service',
        route: '/OAuth/code',
        params: ['state', 'code', 'scope'],
        headers: [],
        method: 'GET'
    },
    OAuthStateRoute:
    {
        description: 'Front: Get a random state code to protect against CSRF attacks.',
        route: '/OAuth/state',
        headers: [],
        method: 'GET'
    },
    FetchUserInfoRoute:
    {
        description: 'Front: Get information about the user with uid.',
        route: '/user/info',
        params: ['uid'],
        headers: ['Authorization'],
        method: 'GET'
    },
    UpdateUserInfoRoute:
    {
        description: 'Front: update user information by providing one or more params as field.',
        route: '/user/info',
        params: [{ name: 'name', type: 'text/plain' }, { name: 'bio', type: 'text/plain' }, { name: 'picture', type: 'image/jpeg' }],
        headers: ['Authorization'],
        method: 'POST'
    },
    CheckUserDisplayNameAvailableRoute:
    {
        description: 'Front: check for display name availablity.',
        route: '/user/name',
        params: ['name'],
        headers: ['Authorization'],
        method: 'GET'
    }
    ,
    RemoveUserProfileRoute:
    {
        description: 'Front: remove user\'s profile picture.',
        route: '/user/remove_picture',
        params: [],
        headers: ['Authorization'],
        method: 'DELETE'
    }
};

export const discoverDocumentSerialized = JSON.stringify(discoverDocument);