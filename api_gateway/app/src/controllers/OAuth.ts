import { FastifyRequest, FastifyReply } from 'fastify'
import db from '../classes/Databases'
import Auth, { JWT } from '../classes/AuthProvider'
import { SignInStatesModel } from '../models/SignInStates'
import { OAuthCodeQueryString, OAuthCodeExchangeResponse } from '../types/OAuth'

async function OAuthExchangeCode(query: OAuthCodeQueryString): Promise<JWT | unknown> {
    const reqOpt: RequestInit = {
        method: 'POST',
        headers: {
            'host': 'oauth2.googleapis.com',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            'code': query.code,
            'client_id': process.env.GOOGLE_CLIENT_ID || '',
            'client_secret': process.env.GOOGLE_CLIENT_SECRET || '',
            'redirect_uri': process.env.GOOGLE_REDIRECT_URL || '',
            'grant_type': 'authorization_code'
        })
    };
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', reqOpt);
        if (!response.ok)
            throw 'Response from google auth provider is not ok.';
        var responsejson = await response.json() as OAuthCodeExchangeResponse;
        return Auth.ValidateJWT(responsejson.id_token);
    } catch (error) {
        console.log('Error in OAuthExchangeCode(): ' + error);
        return undefined;
    }
}

export const AuthenticateUser = async (request: FastifyRequest<{ Querystring: OAuthCodeQueryString }>, reply: FastifyReply) => {
    const { state } = request.query;
    const getquery = db.transient.prepare('SELECT * FROM signin_states WHERE state = ? ;');
    const getResult = getquery.get(state) as SignInStatesModel;
    if (getResult) {
        const runquery = db.transient.prepare('DELETE FROM signin_states WHERE state = ?;');
        const runResult = runquery.run(state);
        if (runResult.changes === 1) {
            var jwt = await OAuthExchangeCode(request.query);
            if (jwt !== undefined)
                return reply.code(200).send(`JWT: OK!\n${JSON.stringify(jwt)}`);
            else
                return reply.code(500).send(`ERROR: Invalid credentials.`);
        }
        console.log(`ERROR: AuthenticateUser(): did not remove state_code=${state} from the db.`);
    }
    return reply.code(500).send(`ERROR: Invalid state code.`);
}

export const GetOAuthCode = async (request: FastifyRequest, reply: FastifyReply) => {
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
    const created = Date.now() / 1000;
    const query = db.transient.prepare('INSERT INTO signin_states ( state , created ) VALUES( ? , ? );');
    const res = query.run(code, created);
    if (res.changes !== 1)
        reply.code(500).send("try again");
    else
        reply.code(200).send(code);
}
