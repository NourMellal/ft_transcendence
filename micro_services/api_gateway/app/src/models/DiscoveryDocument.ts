export const discoverDocument = {
    ServerUrl: 'https://server.transcendence.fr',
    OAuthRoutes: {
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
        }
    },
    StandardAuthRoutes: {
        SignUpUserRoute:
        {
            description: 'Front: create a new user using a username and password. If no picture is provided a default one will be assigned. returns jwt cookie or error message',
            notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
            route: '/user/signup',
            multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'password', type: 'text/plain', constraint: '>7 chars' }, { name: 'picture', type: 'image/jpeg' }],
            method: 'POST'
        },
        SignInUserRoute:
        {
            description: 'Front: sign in user using username and password. returns jwt cookie or 401',
            notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
            route: '/user/signin',
            multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'password', type: 'text/plain', constraint: '>7 chars' }],
            method: 'POST'
        }
    },
    TwoFactorAuthRoutes: {
        Enable2FA:
        {
            description: 'Front: Enable TOTP codes',
            route: '/2FA/enable',
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'POST'
        },
        Disable2FA:
        {
            description: 'Front: Disable TOTP codes',
            route: '/2FA/disable',
            multipart_params: [{ name: 'code', type: 'text/plain', constraint: '=6 digits' }],
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'POST'
        },
        VerifyCode:
        {
            description: 'Front: Verify TOTP code to complete sign in and get JWT token',
            route: '/2FA/verify',
            QueryParams: [{ name: 'state' }],
            multipart_params: [{ name: 'code', type: 'text/plain', constraint: '=6 digits' }],
            method: 'POST'
        }
    },
    UserManagementRoutes: {
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
    },
    FriendsRoutes:{
        ListFriendsRoute:
        {
            description: 'Front: Get current user friends list.',
            route: '/friends',
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'GET'
        },
        ListFriendsRequestsRoute:
        {
            description: 'Front: Get current user friends requests.',
            route: '/friends/requests',
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'GET'
        },
        SendFriendRequestRoute:
        {
            description: 'Front: send a request to the user with uid specified in query param.',
            route: '/friends/request',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'POST'
        },
        AcceptFriendRequestRoute:
        {
            description: 'Front: accept a request specified by uid of the request in query param.',
            route: '/friends/accept',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'POST'
        },
        DenyFriendRequestRoute:
        {
            description: 'Front: deny a request specified by uid of the request in query param.',
            route: '/friends/deny',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'POST'
        },
        RemoveFriendRoute:
        {
            description: 'Front: remove friend specified by uid in query param.',
            route: '/friends/remove',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Cookie', value: 'jwt={{jwt_token}}' }],
            method: 'POST'
        }
    },
    MiscRoutes: {
        CheckUserDisplayNameAvailableRoute:
        {
            description: 'Front: check for display name availablity. returns 200 (available), 406 (not available), 400 (bad request)',
            route: '/user/namecheck',
            QueryParams: [{ name: 'username', constraint: '>2 chars' }],
            method: 'GET'
        }
    }
};

export const discoverDocumentSerialized = JSON.stringify(discoverDocument);