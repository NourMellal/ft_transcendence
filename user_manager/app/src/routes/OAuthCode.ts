import { FastifyRequest, FastifyInstance } from 'fastify'
import { DatabaseSync } from 'node:sqlite';

type SignInStatesModel = {
    state: 'string'
}


type QueryStringType = {
    state: { type: 'string' },
    code: { type: 'string' },
    scope: { type: 'string' }
}

const opts = {
    schema: {
        querystring: {
            type: 'object',
            properties: {
                state: { type: 'string' },
                code: { type: 'string' },
                scope: { type: 'string' }
            },
            required: ['state', 'code', 'scope']
        }
    }
};

async function routes(fastify: FastifyInstance, db: DatabaseSync) {
    fastify.get('/Auth/code', opts, async (request: FastifyRequest<{ Querystring: QueryStringType }>, reply) => {
        const { state, code, scope } = request.query;
        const getquery = db.prepare('SELECT * FROM signin_states WHERE state = ? ;');
        const getResult: SignInStatesModel = getquery.get(state) as SignInStatesModel;
        if (getResult) {
            const runquery = db.prepare('DELETE FROM signin_states WHERE state = ?;');
            const runResult = runquery.run(state);
            if (runResult.changes === 1) {
                reply.code(200).send(`code: ${state} OK!`);
                return;
            }
        }
        reply.code(500).send(`code: ${state} ERROR!`);
    })
}

export default routes;