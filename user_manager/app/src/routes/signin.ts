import { FastifyInstance } from 'fastify'
import { DatabaseSync } from 'node:sqlite';

async function routes(fastify: FastifyInstance, db: DatabaseSync) {
    fastify.get('/signin', async (request, reply) => {
        const randomValues = new Uint32Array(4);
        crypto.getRandomValues(randomValues);
        // Encode as UTF-8
        const utf8Encoder = new TextEncoder();
        const utf8Array = utf8Encoder.encode(
            String.fromCharCode.apply(null, Array.from(randomValues))
        );
        // Base64 encode the UTF-8 data
        var code = btoa(String.fromCharCode.apply(null, Array.from(utf8Array)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const query = db.prepare('INSERT INTO signin_states ( state ) VALUES( ? );');
        const res = query.run(code);
        if (res.changes !== 1)
            reply.code(500).send("try again");
        else
            reply.code(200).send(code);
    })
}

export default routes;