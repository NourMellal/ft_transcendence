import { FastifyInstance } from 'fastify'
import { FetchUserInfo } from '../controllers/User';
import { discoverDocument } from '../models/DiscoveryDocument';
import { isRequestAuthorizedHook } from './OAuth';

const UserInfoOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                uid: { type: 'string' },
            },
            required: ['uid']
        },
        headers: {
            type: 'object',
            properties: {
                'Authorization': { type: 'string' }
            },
            required: ['Authorization']
        }
    }
};

async function UserRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', isRequestAuthorizedHook);
    fastify.get(discoverDocument.FetchUserInfoRoute.route, UserInfoOpts, FetchUserInfo);
}

export default UserRoutes;