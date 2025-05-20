export const discoveryDocument = {
  ServerUrl: "https://transcendence.fr",
  discoveryDocumentRoute: "/api/.well-known/discovery",
  OAuthRoutes: {
    OAuthRedirectRoute: {
      description:
        "Internal: Used for getting OAuth Exchange code back from google identity service, returns jwt cookie",
      notes:
        "don't use the decoded jwt to infer user's info instead fetch the user info route.",
      route: "/api/OAuth/code",
      QueryParams: [{ name: "state" }, { name: "code" }, { name: "scope" }],
      method: "GET",
    },
    OAuthStateRoute: {
      description:
        "HTTP: Get a random state code to protect against CSRF attacks.",
      route: "/api/OAuth/state",
      method: "GET",
    },
  },
  StandardAuthRoutes: {
    CheckUserDisplayNameAvailableRoute: {
      description:
        "HTTP: check for display name availablity. returns 200 (available), 406 (not available), 400 (bad request)",
      route: "/api/user/namecheck",
      QueryParams: [{ name: "username", constraint: ">2 chars" }],
      method: "GET",
    },
    SignUpUserRoute: {
      description:
        "HTTP: create a new user using a username and password. If no picture is provided a default one will be assigned. returns jwt cookie or error message",
      notes:
        "don't use the decoded jwt to infer user's info instead fetch the user info route.",
      route: "/api/user/signup",
      multipart_params: [
        { name: "username", type: "text/plain", constraint: ">2 chars" },
        { name: "password", type: "text/plain", constraint: ">7 chars" },
        { name: "picture", type: "image/jpeg" },
      ],
      method: "POST",
    },
    SignInUserRoute: {
      description:
        "HTTP: sign in user using username and password. returns jwt cookie or 400",
      notes:
        "don't use the decoded jwt to infer user's info instead fetch the user info route.",
      route: "/api/user/signin",
      multipart_params: [
        { name: "username", type: "text/plain", constraint: ">2 chars" },
        { name: "password", type: "text/plain", constraint: ">7 chars" },
      ],
      method: "POST",
    },
  },
  LogOutRoute: {
    description: "HTTP: logout current user",
    route: "/api/logout",
    headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
    method: "POST"
  },
  RefreshTokenRoutes: {
    ListActiveConnection: {
      description: "HTTP: get a list of active connections",
      route: "/api/jwt/list",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET"
    },
    RemoveAccess: {
      description: "HTTP: remove refresh token",
      route: "/api/jwt/revoke",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      QueryParams: [{ name: "token_id" }],
      method: "POST"
    }
  },
  TwoFactorAuthRoutes: {
    Get2FAString: {
      description: "HTTP: get TOTP uri string",
      route: "/api/2FA/geturi",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    Enable2FA: {
      description: "HTTP: Enable TOTP codes",
      route: "/api/2FA/enable",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    Disable2FA: {
      description: "HTTP: Disable TOTP codes",
      route: "/api/2FA/disable",
      multipart_params: [
        { name: "code", type: "text/plain", constraint: "=6 digits" },
      ],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    VerifyCode: {
      description:
        "HTTP: Verify TOTP code to complete sign in and get JWT token",
      route: "/api/2FA/verify",
      QueryParams: [{ name: "state" }],
      multipart_params: [
        { name: "code", type: "text/plain", constraint: "=6 digits" },
      ],
      method: "POST",
    },
  },
  UserManagementRoutes: {
    FetchUserInfoRoute: {
      description: "HTTP: Get information about the user with uid.",
      route: "/api/user/info",
      QueryParams: [{ name: "uid" }, { name: "uname" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    UpdateUserInfoRoute: {
      description:
        "HTTP: update user information by providing one or more params as field.",
      route: "/api/user/info",
      multipart_params: [
        { name: "username", type: "text/plain", constraint: ">2 chars" },
        { name: "bio", type: "text/plain" },
        { name: "picture", type: "image/jpeg" },
      ],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    UpdateUserPassword: {
      description:
        "HTTP: update user password.",
      route: "/api/user/passwd",
      multipart_params: [
        { name: "old_password", note: 'can be left blank for new google user', type: "text/plain", constraint: ">7 chars | null" },
        { name: "new_password", type: "text/plain", constraint: ">7 chars" },
      ],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    RemoveUserProfileRoute: {
      description: "HTTP: remove user's profile picture.",
      route: "/api/user/remove_picture",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "DELETE",
    },
  },
  FriendsRoutes: {
    ListFriendsRoute: {
      description: "HTTP: Get current user friends list.",
      route: "/api/friends",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    ListFriendsRequestsRoute: {
      description: "HTTP: Get current user friends requests.",
      route: "/api/friends/requests",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    ListSentFriendsRequestsRoute: {
      description: "HTTP: Get current user sent friends requests.",
      route: "/api/friends/sent_requests",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    SendFriendRequestRoute: {
      description:
        "HTTP: send a request to the user with uid specified in query param.",
      route: "/api/friends/request",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    AcceptFriendRequestRoute: {
      description:
        "HTTP: accept a request specified by uid of the request in query param.",
      route: "/api/friends/accept",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    DenyFriendRequestRoute: {
      description:
        "HTTP: deny a request specified by uid of the request in query param.",
      route: "/api/friends/deny",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    RemoveFriendRoute: {
      description: "HTTP: remove friend specified by uid in query param.",
      route: "/api/friends/remove",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
  },
  Notifications: {
    NotificationTypesEnum: {
      description: "Enum: notification types.",
      types: [
        { NewFriendRequest: 1 },
        { FriendRemove: 2 },
        { FriendRequestAccepted: 3 },
        { FriendRequestDenied: 4 },
        { GameInvite: 5 },
        { Poke: 6 },
        { NewMessage: 7, note: 'from_uid in the response body represents the conversation uid where the user has the new message.' }
      ]
    },
    GetPushNotificationTicket: {
      description: "HTTP: get a notification ticket to use with wss.",
      route: "/api/notifications/ticket",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    PushNotification: {
      description: "WebSocket(wss): listen on notifications for ui update.",
      notes:
        "due to limitations of ws, awkward protocol header is used to inject auth token, luckily this is easy to pass using vanilla JS WebSocket (see tests/websocket).",
      route: "/api/notifications/push_notification",
      headers: [{ name: "Sec-WebSocket-Protocol", value: "{{Ticket}}" }],
      method: "GET",
    },
    ListUnread: {
      description: "HTTP: list unread notifications.",
      route: "/api/notifications/list_unread",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    ListAll: {
      description: "HTTP: list all notifications.",
      route: "/api/notifications/list_all",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    MarkAsRead: {
      description:
        "HTTP: mark a notification as read.",
      route: "/api/notifications/mark_as_read",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    Delete: {
      description:
        "HTTP: delete a notification.",
      route: "/api/notifications/delete",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    PokeFriend: {
      description: "HTTP: send a poke notification to a friend.",
      route: "/api/poke",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    GetUserActiveStatus: {
      description: "HTTP: Get a user active status. (200 for active 404 inactive)",
      route: "/api/user/status",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
  },
  LeaderboardRoutes: {
    ListAllRank: {
      description: "HTTP: get leaderboard rankes for all users.",
      route: "/api/leaderboard/list",
      QueryParams: [{ name: "page" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    ListUserRank: {
      description: "HTTP: get leaderboard ranke for user by uid.",
      route: "/api/leaderboard/rank",
      QueryParams: [{ name: "uid", hint:"leave blank for current user"}],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
  },
  MatchManagerRoutes: {
    ListMatchHistory: {
      description: "HTTP: list match history for a user (omit query param for current user).",
      route: "/api/match/history",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    MatchTypeEnum: {
      description: "Enum: available match types to pass as 'match_type' query param.",
      types: [
        { Single1v1: 1 },
        { Single2v2: 2 },
        { Tournament: 3 },
        { AI: 4 },
      ]
    },
    CreateNewMatch: {
      description: "HTTP: create new match with the specified type.",
      route: "/api/match/create",
      QueryParams: [{ name: "match_type" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    WinMatch: {
      description: "HTTP: win a match by id.",
      route: "/api/match/win",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      multipart_params: [
        { name: "match_uid", type: "text/plain" },
      ],
      method: "POST",
    },
    LoseMatch: {
      description: "HTTP: lose a match by id.",
      route: "/api/match/lose",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      multipart_params: [
        { name: "match_uid", type: "text/plain" },
      ],
      method: "POST",
    },
  },
  ChatManagerRoutes: {
    CreateConversation: {
      description: "HTTP: Create a new conversation.",
      route: "/api/chat/new",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      multipart_params: [
        { name: "name", description: "Name to give to the conversation", type: "text/plain", constraint: "1~32 chars" },
        { name: "to_uid", description: "user uid to add to conversation", type: "text/plain" },
        { name: "message", description: "message to send", type: "text/plain" },
      ],
      method: "POST",
    },
    RenameConversation: {
      description: "HTTP: Create a new conversation.",
      route: "/api/chat/rename",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      QueryParams: [{ name: "uid" }],
      multipart_params: [
        { name: "name", description: "New name to give to the conversation", type: "text/plain", constraint: "1~32 chars" },
      ],
      method: "POST",
    },
    SendMessageToConversation: {
      description: "HTTP: send a message to a conversation.",
      route: "/api/chat/send",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      QueryParams: [{ name: "uid", description: "conversation uid" }],
      multipart_params: [
        { name: "message", description: "message to send", type: "text/plain" },
      ],
      method: "POST",
    },
    BlockUser: {
      description: "HTTP: Block user by uid.",
      route: "/api/chat/block",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    UnBlockUser: {
      description: "HTTP: Unblock user by uid.",
      route: "/api/chat/unblock",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    },
    ListBlocked: {
      description: "HTTP: Get current user's block list.",
      route: "/api/chat/blocked",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    CheckBlock: {
      description: "HTTP: Check if the logged user is blocked by another user.",
      route: "/api/chat/check_blocked",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    ListConversations: {
      description: "HTTP: list conversations with their {data: ids and names and both users uids involving the user} and unread conversations_uids between them. return : [conversations_data:[{uid, name, users uids}], unread_uids:{[uid:string]}]",
      route: "/api/chat/list",
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    ReadConversation: {
      description: "HTTP: Get a conversation messages by uid and page if page == 0 conversation also marked as read.",
      route: "/api/chat/read",
      QueryParams: [{ name: "uid" }, { name: "page" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "GET",
    },
    MarkConversationAsRead: {
      description: "HTTP: Mark conversation as read.",
      route: "/api/chat/mark_read",
      QueryParams: [{ name: "uid" }],
      headers: [{ name: "Cookie", value: "jwt={{jwt_token}}" }],
      method: "POST",
    }
  },
};

export const discoveryDocumentSerialized = JSON.stringify(discoveryDocument);
