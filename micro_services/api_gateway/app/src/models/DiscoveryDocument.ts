export const discoverDocument = {
    ServerUrl: 'https://server.transcendence.fr',
    OAuthRedirectRoute:
    {
        description: 'Internal: Used for getting OAuth Exchange code back from google identity service, returns jwt cookie',
        notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
        route: '/OAuth/code',
        QueryParams: [{ name: 'state' }, { name: 'code' }, { name: 'scope' }],
        method: 'GET'
    },
    OAuthStateRoute:
    {
        description: 'Front: Get a random state code to protect against CSRF attacks.',
        route: '/OAuth/state',
        method: 'GET'
    },
    CheckUserDisplayNameAvailableRoute:
    {
        description: 'Front: check for display name availablity. returns 200 (available), 406 (not available), 400 (bad request)',
        route: '/user/namecheck',
        QueryParams: [{ name: 'username', constraint: '>2 chars' }],
        method: 'GET'
    },
    StandardSignUpUserRoute:
    {
        description: 'Front: create a new user using a username and password. If no picture is provided a default one will be assigned. returns jwt cookie or error message',
        notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
        route: '/user/signup',
        multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'password', type: 'text/plain', constraint: '>7 chars' }, { name: 'picture', type: 'image/jpeg' }],
        method: 'POST'
    },
    StandardSignInUserRoute:
    {
        description: 'Front: sign in user using username and password. returns jwt cookie or 401',
        notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
        route: '/user/signin',
        multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'password', type: 'text/plain', constraint: '>7 chars' }],
        method: 'POST'
    },
    FetchUserInfoRoute:
    {
        description: 'Front: Get information about the user with uid.',
        route: '/user/info',
        QueryParams: [{ name: 'uid' }],
        headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
        method: 'GET'
    },
    UpdateUserInfoRoute:
    {
        description: 'Front: update user information by providing one or more params as field.',
        route: '/user/info',
        multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'bio', type: 'text/plain' }, { name: 'picture', type: 'image/jpeg' }],
        headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
        method: 'POST'
    },
    RemoveUserProfileRoute:
    {
        description: 'Front: remove user\'s profile picture.',
        route: '/user/remove_picture',
        headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
        method: 'DELETE'
    }
};

export const discoverDocumentSerialized = JSON.stringify(discoverDocument);