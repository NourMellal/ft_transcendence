import { FastifyInstance } from 'fastify'
import { discoverDocument } from '../../models/DiscoveryDocument';
import { isRequestAuthorizedHook } from '../OAuth';
import { AcceptFriendRequest, DenyFriendRequest, ListFriends, ListRequests, RemoveFriend, SendFriendRequest } from '../../controllers/microservices/friends_manager';

const AuthHeaderValidation = {
    schema: {
        headers: {
            type: 'object',
            properties: {
                'Cookie': { type: 'string' }
            },
            required: ['Cookie']
        }
    }
}

const FriendRequestOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                uid: { type: 'string' },
            },
            required: ['uid']
        },
        headers: AuthHeaderValidation.schema.headers
    }
};

async function FriendsManagerRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', isRequestAuthorizedHook);
    fastify.get(discoverDocument.FriendsRoutes.ListFriendsRoute.route, AuthHeaderValidation, ListFriends);
    fastify.get(discoverDocument.FriendsRoutes.ListFriendsRequestsRoute.route, AuthHeaderValidation, ListRequests);
    fastify.post(discoverDocument.FriendsRoutes.SendFriendRequestRoute.route, FriendRequestOpts, SendFriendRequest);
    fastify.post(discoverDocument.FriendsRoutes.AcceptFriendRequestRoute.route, FriendRequestOpts, AcceptFriendRequest);
    fastify.post(discoverDocument.FriendsRoutes.DenyFriendRequestRoute.route, FriendRequestOpts, DenyFriendRequest);
    fastify.post(discoverDocument.FriendsRoutes.RemoveFriendRoute.route, FriendRequestOpts, RemoveFriend);
}

export default FriendsManagerRoutes;