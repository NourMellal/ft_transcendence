export const discoverDocument = {
    ServerUrl: 'https://server.transcendence.fr',
    OAuthRoutes: {
        OAuthRedirectRoute:
        {
            description: 'Internal: Used for getting OAuth Exchange code back from google identity service, returns jwt cookie',
            notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
            route: '/api/OAuth/code',
            QueryParams: [{ name: 'state' }, { name: 'code' }, { name: 'scope' }],
            method: 'GET'
        },
        OAuthStateRoute:
        {
            description: 'HTTP: Get a random state code to protect against CSRF attacks.',
            route: '/api/OAuth/state',
            method: 'GET'
        }
    },
    StandardAuthRoutes: {
        CheckUserDisplayNameAvailableRoute:
        {
            description: 'HTTP: check for display name availablity. returns 200 (available), 406 (not available), 400 (bad request)',
            route: '/api/user/namecheck',
            QueryParams: [{ name: 'username', constraint: '>2 chars' }],
            method: 'GET'
        },
        SignUpUserRoute:
        {
            description: 'HTTP: create a new user using a username and password. If no picture is provided a default one will be assigned. returns jwt cookie or error message',
            notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
            route: '/api/user/signup',
            multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'password', type: 'text/plain', constraint: '>7 chars' }, { name: 'picture', type: 'image/jpeg' }],
            method: 'POST'
        },
        SignInUserRoute:
        {
            description: 'HTTP: sign in user using username and password. returns jwt cookie or 401',
            notes: 'don\'t use the decoded jwt to infer user\'s info instead fetch the user info route.',
            route: '/api/user/signin',
            multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'password', type: 'text/plain', constraint: '>7 chars' }],
            method: 'POST'
        }
    },
    TwoFactorAuthRoutes: {
        Enable2FA:
        {
            description: 'HTTP: Enable TOTP codes',
            route: '/api/2FA/enable',
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        Disable2FA:
        {
            description: 'HTTP: Disable TOTP codes',
            route: '/api/2FA/disable',
            multipart_params: [{ name: 'code', type: 'text/plain', constraint: '=6 digits' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        VerifyCode:
        {
            description: 'HTTP: Verify TOTP code to complete sign in and get JWT token',
            route: '/api/2FA/verify',
            QueryParams: [{ name: 'state' }],
            multipart_params: [{ name: 'code', type: 'text/plain', constraint: '=6 digits' }],
            method: 'POST'
        }
    },
    UserManagementRoutes: {
        FetchUserInfoRoute:
        {
            description: 'HTTP: Get information about the user with uid.',
            route: '/api/user/info',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'GET'
        },
        UpdateUserInfoRoute:
        {
            description: 'HTTP: update user information by providing one or more params as field.',
            route: '/api/user/info',
            multipart_params: [{ name: 'username', type: 'text/plain', constraint: '>2 chars' }, { name: 'bio', type: 'text/plain' }, { name: 'picture', type: 'image/jpeg' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        RemoveUserProfileRoute:
        {
            description: 'HTTP: remove user\'s profile picture.',
            route: '/api/user/remove_picture',
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'DELETE'
        }
    },
    FriendsRoutes: {
        ListFriendsRoute:
        {
            description: 'HTTP: Get current user friends list.',
            route: '/api/friends',
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'GET'
        },
        ListFriendsRequestsRoute:
        {
            description: 'HTTP: Get current user friends requests.',
            route: '/api/friends/requests',
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'GET'
        },
        SendFriendRequestRoute:
        {
            description: 'HTTP: send a request to the user with uid specified in query param.',
            route: '/api/friends/request',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        AcceptFriendRequestRoute:
        {
            description: 'HTTP: accept a request specified by uid of the request in query param.',
            route: '/api/friends/accept',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        DenyFriendRequestRoute:
        {
            description: 'HTTP: deny a request specified by uid of the request in query param.',
            route: '/api/friends/deny',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        RemoveFriendRoute:
        {
            description: 'HTTP: remove friend specified by uid in query param.',
            route: '/api/friends/remove',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        }
    },
    Notifications: {
        PushNotification:
        {
            description: 'WebSocket(wss): listen on notifications for ui update.',
            notes: 'due to limitations of ws, awkward protocol header is used to inject auth token, luckily this is easy to pass using vanilla JS WebSocket (see tests/websocket).',
            route: '/api/notifications/push_notification',
            headers: [{ name: 'Sec-WebSocket-Protocol', value: '{{jwt_token}}' }],
            method: 'GET'
        },
        ListUnread:
        {
            description: 'HTTP: list unread notifications.',
            route: '/api/notifications/list_unread',
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'GET'
        },
        ListAll:
        {
            description: 'HTTP: list all notifications.',
            route: '/api/notifications/list_all',
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'GET'
        },
        MarkAsRead:
        {
            description: 'HTTP: mark one or multiple notifications as read separated by \';\'.',
            route: '/api/notifications/mark_as_read',
            QueryParams: [{ name: 'uids' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        Delete:
        {
            description: 'HTTP: delete one or multiple notifications separated by \';\'.',
            route: '/api/notifications/delete',
            QueryParams: [{ name: 'uids' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        },
        PokeFriend:
        {
            description: 'HTTP: send a poke notification to a friend.',
            route: '/api/poke',
            QueryParams: [{ name: 'uid' }],
            headers: [{ name: 'Authorization', value: 'Bearer {{jwt_token}}' }],
            method: 'POST'
        }
    }
};

export const discoverDocumentSerialized = JSON.stringify(discoverDocument);