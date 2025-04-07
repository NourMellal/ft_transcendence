import JWT from '../types/AuthProvider'

declare module 'fastify' {
    export interface FastifyRequest {
        jwt: JWT;
    }
}