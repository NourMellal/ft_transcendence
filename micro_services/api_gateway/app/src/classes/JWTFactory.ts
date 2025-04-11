import crypto, { KeyObject } from "crypto"
import fs from "fs";
import { JWT } from "../types/AuthProvider";
import { GoogleDiscoveryDocument } from "../types/OAuth";
import { buffer } from "stream/consumers";

class JWTFactory {
    discoveryDocument: GoogleDiscoveryDocument;
    key: KeyObject;
    constructor(server_private_key_path: string, document: GoogleDiscoveryDocument) {
        const private_key = fs.readFileSync(server_private_key_path);
        this.key = crypto.createPrivateKey(private_key);
        this.discoveryDocument = document;
    }
    public CreateJWT(UID: string, name: string, picture?: string): JWT {
        const jwt: JWT = {
            aud: process.env.GOOGLE_CLIENT_ID || '',
            sub: UID,
            name: name,
            picture: picture,
            exp: (Date.now() / 1000) + 3600,
            iss: this.discoveryDocument.issuer,
            iat: Date.now() / 1000
        };
        return jwt;
    }
    public SignJWT(jwt: JWT): string {
        const header_encoded: string = JSON.stringify({
            alg: 'RS256',
            kid: process.env.SERVER_JWT_KID || '',
            typ: 'jwt'
        });
        const jwt_headers = Buffer.from(header_encoded).toString('base64url');
        const jwt_payload = Buffer.from(JSON.stringify(jwt)).toString('base64url');
        const Signature = crypto.sign('RSA-SHA256', Buffer.from(jwt_headers + '.' + jwt_payload), this.key);
        return jwt_headers + '.' + jwt_payload + '.' + Signature.toString('base64url');
    }
    public VerifyJWT(jwt_parts: string[]): JWT {
        var Verifier = crypto.createVerify('RSA-SHA256');
        var signature = Buffer.from(jwt_parts[2], 'base64');
        Verifier.update(jwt_parts[0] + '.' + jwt_parts[1]);
        if (Verifier.verify(this.key, signature) == false)
            throw `Error VerifyJWT(): invalid signature`;
        var jwt: JWT = JSON.parse(Buffer.from(jwt_parts[1], 'base64').toString());
        if (jwt.iss !== this.discoveryDocument.issuer)
            throw `Error VerifyJWT(): invalid JWT issuer`;
        if (jwt.aud !== process.env.GOOGLE_CLIENT_ID)
            throw `Error VerifyJWT(): invalid JWT audience`;
        if (jwt.exp <= Date.now() / 1000)
            throw `Error VerifyJWT(): expired JWT token`;
        return jwt;
    }
}

export default JWTFactory;