
/**
 * This file contains the schema validation types that
 * @fastify requires to enforce on request validation.
 * see: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/
 */


/**
 *  Used to validate that the headers contain a field named Cookie and of type string.
 *  usefull to automatically reject requests to authorized routes before calling the prehandler
 *  function that performs the authorization flow using jwt tokens. 
 */
export const AuthCookieValidation = {
    schema: {
        // Validate request headers
        headers: {
            type: "object",
            // propreties to validate in the request headers.
            properties: {
                Cookie: { type: "string" },
            },
            // specifying the required params that need to exist in the request header or the request rejected.
            required: ["Cookie"],
        },
    },
};

export const MatchHistoryOpts = {
    schema: {
        // Validate request query string
        querystring: {
            type: "object",
            properties: {
                // propreties to validate in the request query string.
                uid: { type: "string" },
                page: { type: "number" },
            },
            // specifying the required params that need to exist in the request query string or the request rejected.
            required: ["page"],
        },
        headers: AuthCookieValidation.schema.headers,
    },
};

export const OAuthCodeOpts = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                state: { type: "string" },
                code: { type: "string" },
                scope: { type: "string" },
            },
            required: ["state", "code", "scope"],
        },
    },
};

export const ReadConversationOpts = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                uid: { type: "string" },
                page: { type: "number" },
            },
            required: ["uid", "page"],
        },
        headers: AuthCookieValidation.schema.headers,
    },
};

export const RequireMatchType = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                match_type: { type: "number" },
            },
            required: ["match_type"],
        },
        headers: AuthCookieValidation.schema.headers,
    },
};

export const RequirePage = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                page: { type: "number" },
            },
            required: ["page"],
        },
        headers: AuthCookieValidation.schema.headers,
    },
};

export const RequireUsername = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                username: { type: "string" },
            },
            required: ["username"],
        },
    },
};

export const RequireState = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                state: { type: "string" },
            },
            required: ["state"],
        },
    },
};

export const RequireToken_id = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                token_id: { type: "string" },
            },
            required: ["token_id"],
        },
        headers: AuthCookieValidation.schema.headers,
    },
};

export const RequireUid = {
    schema: {
        querystring: {
            type: "object",
            properties: {
                uid: { type: "string" }
            },
            required: ["uid"],
        }
    },
};
