import crypto from "crypto";
import { JWT, JWTHeaders, JWTKeyCert } from "../types/AuthProvider";
import { GoogleDiscoveryDocument } from "../types/OAuth";
import JWTFactory from "./JWTFactory";

class OAuthProvider {
  isReady: boolean = false;
  discoveryDocumentURL: string;
  discoveryDocument: GoogleDiscoveryDocument;
  JWTKeyCertificate: JWTKeyCert;
  jwtFactory: JWTFactory;

  constructor(DiscoveryDocumentUrl: string) {
    this.discoveryDocumentURL = DiscoveryDocumentUrl;
    this.discoveryDocument = {} as GoogleDiscoveryDocument;
    this.JWTKeyCertificate = {} as JWTKeyCert;
    this.jwtFactory = {} as JWTFactory;
  }
  public async init() {
    try {
      var res = await fetch(this.discoveryDocumentURL);
      if (!res.ok)
        throw `Can't get OAuth discovery document at ${this.discoveryDocumentURL}`;
      this.discoveryDocument = (await res.json()) as GoogleDiscoveryDocument;
      res = await fetch(this.discoveryDocument.jwks_uri);
      if (!res.ok)
        throw `Can't get OAuth jwk certificate at ${this.discoveryDocument.jwks_uri}`;
      this.JWTKeyCertificate = (await res.json()) as JWTKeyCert;
      this.jwtFactory = new JWTFactory(
        process.env.SERVER_PRIVATE_KEY_PATH || "",
        this.discoveryDocument
      );
      for (let i = 0; i < this.JWTKeyCertificate.keys.length; i++) {
        const element = this.JWTKeyCertificate.keys[i];
        element.pkey = crypto.createPublicKey({ key: element, format: "jwk" });
      }
      this.isReady = true;
      console.log("OAuthProvider class is now ready!");
    } catch (error) {
      console.log(`fatal error: ${error}`);
      process.exit(1);
    }
  }
  public ValidateJWT_Cookie(cookie: string): JWT {
    if (!this.isReady)
      throw `Error ValidateJWT_Cookie(): OAuthProvider class is not ready!`;
    const cookie_part = cookie.split("=");
    if (cookie_part.length !== 2 || cookie_part[0] !== "jwt")
      throw `Error ValidateJWT_Cookie(): bad header!`;
    return this.ValidateJWT_Token(cookie_part[1]);
  }
  public ValidateJWT_AuthHeader(header: string): JWT {
    if (!this.isReady)
      throw `Error ValidateJWT_Header(): OAuthProvider class is not ready!`;
    const header_part = header.split(" ");
    if (header_part.length !== 2 || header_part[0] !== "Bearer")
      throw `Error ValidateJWT_Header(): bad header!`;
    return this.ValidateJWT_Token(header_part[1]);
  }
  public ValidateJWT_Token(encoded: string): JWT {
    if (!this.isReady)
      throw `Error ValidateJWT_Token(): OAuthProvider class is not ready!`;
    var jwt_parts = encoded.split(".");
    if (jwt_parts.length !== 3)
      throw `Error ValidateJWT_Token(): JWT token string is invalid!`;
    var header: JWTHeaders = JSON.parse(
      Buffer.from(jwt_parts[0], "base64").toString()
    );
    if (header.alg !== "RS256")
      throw `Error ValidateJWT_Token(): algorithm '${header.alg}' is not supported!`;
    if (header.kid === process.env.SERVER_JWT_KID)
      return this.jwtFactory.VerifyJWT(jwt_parts);
    var key = this.JWTKeyCertificate.keys.find((value) => {
      return value.kid === header.kid;
    });
    if (!key)
      throw `Error ValidateJWT_Token(): invalid key_id: '${header.kid}'`;
    var Verifier = crypto.createVerify("RSA-SHA256");
    var signature = Buffer.from(jwt_parts[2], "base64");
    Verifier.update(jwt_parts[0] + "." + jwt_parts[1]);
    if (Verifier.verify(key.pkey, signature) === false)
      throw `Error ValidateJWT_Token(): invalid signature`;
    var jwt: JWT = JSON.parse(Buffer.from(jwt_parts[1], "base64").toString());
    if (jwt.iss !== this.discoveryDocument.issuer)
      throw `Error ValidateJWT_Token(): invalid JWT issuer`;
    if (jwt.aud !== process.env.GOOGLE_CLIENT_ID)
      throw `Error ValidateJWT_Token(): invalid JWT audience`;
    if (jwt.exp <= Date.now() / 1000)
      throw `Error ValidateJWT_Token(): expired JWT token`;
    return jwt;
  }
}

const AuthProvider = new OAuthProvider(
  process.env.GOOGLE_DISCOVERY_DOCUMENT_URL ||
    "https://accounts.google.com/.well-known/openid-configuration"
);

export default AuthProvider;
