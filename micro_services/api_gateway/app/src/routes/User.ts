import { FastifyInstance } from 'fastify'
import { FetchUserInfo } from '../controllers/User';
import { discoverDocument } from '../models/DiscoveryDocument';

const UserInfoOpts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                uid: { type: 'string' },
            }
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
    fastify.get(discoverDocument.FetchUserInfoRoute.route, UserInfoOpts, FetchUserInfo);
}

export default UserRoutes;