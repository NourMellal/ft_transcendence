import crypto from 'crypto'

export type JWT = {
    iss: string,
    aud: string,
    sub: string,
    exp: number,
    iat: number,
    email?: string,
    given_name?: string,
    picture?: string
}

type JWTHeaders = {
    alg: string,
    kid: string,
    typ: string
}

type JWTKeyCert = {
    keys: [{
        pkey: crypto.KeyObject,
        kid: string,
        n: string,
        e: string,
        alg: string
    }]
}

type DiscoveryDocument = {
    issuer: string,
    authorization_endpoint: string,
    token_endpoint: string,
    jwks_uri: string
}

class OAuthProvider {
    isReady: boolean = false;
    discoveryDocumentURL: string;
    discoveryDocument: DiscoveryDocument;
    JWTKeyCertificate: JWTKeyCert;

    constructor(DiscoveryDocumentUrl: string) {
        this.discoveryDocumentURL = DiscoveryDocumentUrl;
        this.discoveryDocument = {} as DiscoveryDocument;
        this.JWTKeyCertificate = {} as JWTKeyCert;
    }
    public async init() {
        try {
            var res = await fetch(this.discoveryDocumentURL);
            if (!res.ok)
                throw `Can't get OAuth discovery document at ${this.discoveryDocumentURL}`;
            this.discoveryDocument = await res.json() as DiscoveryDocument;
            res = await fetch(this.discoveryDocument.jwks_uri);
            if (!res.ok)
                throw `Can't get OAuth jwk certificate at ${this.discoveryDocument.jwks_uri}`;
            this.JWTKeyCertificate = await res.json() as JWTKeyCert;
            for (let i = 0; i < this.JWTKeyCertificate.keys.length; i++) {
                const element = this.JWTKeyCertificate.keys[i];
                element.pkey = crypto.createPublicKey({ key: element, format: 'jwk' });
            }
            this.isReady = true;
            console.log('OAuthProvider class is now ready!')
        } catch (error) {
            console.log(`fatal error: ${error}`);
            process.exit(1);
        }
    }
    public ValidateJWT(encoded: string): JWT {
        if (!this.isReady)
            throw `Error ValidateJWT(): OAuthProvider class is not ready!`;
        var jwt_parts = encoded.split('.');
        if (jwt_parts.length != 3)
            throw `Error ValidateJWT(): JWT token string is invalid!`;
        var header: JWTHeaders = JSON.parse(Buffer.from(jwt_parts[0], 'base64').toString());
        if (header.alg != 'RS256')
            throw `Error ValidateJWT(): algorithm '${header.alg}' is not supported!`;
        var key = this.JWTKeyCertificate.keys.find((value) => { return value.kid === header.kid });
        if (!key)
            throw `Error ValidateJWT(): invalid key_id: '${header.kid}'`;
        var Verifier = crypto.createVerify('RSA-SHA256');
        var signature = Buffer.from(jwt_parts[2], 'base64');
        Verifier.update(jwt_parts[0] + '.' + jwt_parts[1]);
        if (Verifier.verify(key.pkey, signature) == false)
            throw `Error ValidateJWT(): invalid signature`;
        var jwt: JWT = JSON.parse(Buffer.from(jwt_parts[1], 'base64').toString());
        if (jwt.iss !== this.discoveryDocument.issuer)
            throw `Error ValidateJWT(): invalid JWT issuer`;
        if (jwt.aud !== process.env.GOOGLE_CLIENT_ID)
            throw `Error ValidateJWT(): invalid JWT audience`;
        if (jwt.exp <= Date.now() / 1000)
            throw `Error ValidateJWT(): expired JWT token`;
        return jwt;
    }
}

const AuthProvider = new OAuthProvider(process.env.GOOGLE_DISCOVERY_DOCUMENT_URL || 'https://accounts.google.com/.well-known/openid-configuration');

export default AuthProvider;
