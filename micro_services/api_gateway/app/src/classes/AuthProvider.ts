import crypto from "crypto";
import { JWT, JWTHeaders, JWK_Array } from "../types/AuthProvider";
import { GoogleDiscoveryDocument } from "../types/OAuth";
import JWTFactory from "./JWTFactory";
import db from "./Databases";
import { refresh_token_table_name, RefreshTokenModel } from "../types/DbTables";
import { FastifyReply } from "fastify";
import Vault from "./VaultClient";

/**
 * OAuthProvider Provides authorization verification methods.
 */
class OAuthProvider {
  isReady: boolean = false;
  discoveryDocumentURL: string;
  discoveryDocument: GoogleDiscoveryDocument;
  JWT_KeysArray: JWK_Array;
  jwtFactory: JWTFactory;
  GoogleSignInStates: Map<string, number>;

  constructor(DiscoveryDocumentUrl: string) {
    this.GoogleSignInStates = new Map<string, number>();
    this.discoveryDocumentURL = DiscoveryDocumentUrl;
    this.discoveryDocument = {} as GoogleDiscoveryDocument;
    this.JWT_KeysArray = {} as JWK_Array;
    this.jwtFactory = {} as JWTFactory;
  }

  /**
   * Initializes the instance by fetching the google's discovery document
   * then the public key array and setting up the server's custom jwt factory.
   */
  public async init() {
    try {
      // Getting google's discovery document:
      let res = await fetch(this.discoveryDocumentURL);
      if (!res.ok)
        throw `Can't get OAuth discovery document at ${this.discoveryDocumentURL}`;
      this.discoveryDocument = (await res.json()) as GoogleDiscoveryDocument;
      // Initialize the our server's custom JWT factory object:
      this.jwtFactory = new JWTFactory(
        process.env.SERVER_PRIVATE_KEY_PATH as string,
        this.discoveryDocument
      );
      // Getting google's jwt public keys array:
      res = await fetch(this.discoveryDocument.jwks_uri);
      if (!res.ok)
        throw `Can't get OAuth jwk certificate at ${this.discoveryDocument.jwks_uri}`;
      this.JWT_KeysArray = (await res.json()) as JWK_Array;
      // Generating KeyObjects for each key:
      for (let i = 0; i < this.JWT_KeysArray.keys.length; i++) {
        const element = this.JWT_KeysArray.keys[i];
        element.pkey = crypto.createPublicKey({ key: element, format: "jwk" });
      }
      this.isReady = true;
      console.log("OAuthProvider class is now ready!");
    } catch (error) {
      console.log(`fatal error: ${error}`);
      process.exit(1);
    }
  }

  /**
   * @deprecated used to validate jwt token using the request's Authorization header.
   * switched to using cookies to benefit from `Secure; HttpOnly`
   * which prevents Javascript on the browser from accessing the
   * jwt token. results in better security.
   * @param AuthorizationHeader raw value of the request's Authorization header.
   *  */
  public ValidateJWT_AuthorizationHeader(AuthorizationHeader: string): JWT {
    if (!this.isReady)
      throw `Error ValidateJWT_AuthorizationHeader(): OAuthProvider class is not ready!`;
    const header_part = AuthorizationHeader.split(" ");
    if (header_part.length !== 2 || header_part[0] !== "Bearer")
      throw `Error ValidateJWT_AuthorizationHeader(): bad Authorization header!`;
    return this.ValidateJWT_Token(header_part[1]);
  }

  /**
   * Parses and validates the raw cookie value string.
   * Extracts the jwt token and verifies it's validity.
   * @param RawCookie raw request's cookie header value.
   * @returns the valid parsed JWT payload or the refresh_token string if the JWT is invalid.
   */
  public ValidateJWT_Cookie(RawCookie: string): JWT | string {
    if (!this.isReady)
      throw `ValidateJWT_Cookie(): OAuthProvider class is not ready!`;
    // Spliting the raw value into individual cookies.
    // the raw value splitted by '; ' due to the way the browser sends
    // the cookie header ie: 'jwt={{value}}; refresh_token={{value}}'
    const cookies = RawCookie.split("; ");
    let jwt_token: string | null = null;
    let refresh_token: string | null = null;
    // extracting the `jwt` & `refresh_token` values
    for (let i = 0; i < cookies.length; i++) {
      // spliting the individual cookie by '=' to get the value
      // of the cookie.
      const cookie_part = cookies[i].split("=");
      if (cookie_part[0] === "jwt") {
        if (cookie_part.length !== 2)
          throw `ValidateJWT_Cookie(): bad jwt cookie!`;
        jwt_token = cookie_part[1];
      }
      if (cookie_part[0] === "refresh_token") {
        if (cookie_part.length !== 2)
          throw `ValidateJWT_Cookie(): bad jwt refresh_token cookie!`;
        refresh_token = cookie_part[1];
      }
    }
    if (!jwt_token && !refresh_token)
      throw `ValidateJWT_Cookie(): bad cookies: no jwt_token or refresh_token provided!`;
    if (jwt_token) {
      try {
        const jwt = this.ValidateJWT_Token(jwt_token);
        if (jwt && jwt.exp > Date.now() / 1000)
          return jwt; // JWT is valid
        console.log(`ValidateJWT_Cookie(): expired JWT`);
      } catch (error) {
        console.log(`ValidateJWT_Cookie(): ${error}`);
      }
    }
    if (refresh_token)
      return refresh_token;
    throw `ValidateJWT_Cookie(): no refresh_token provided to generate a new jwt_token!`;
  }

  /**
   * Verifies the jwt_token against the server's own key or the google's key.
   * @param token raw jwt_token to verify validity
   * @returns the parsed JWT object containing the claims.
   */
  public ValidateJWT_Token(token: string): JWT {
    if (!this.isReady)
      throw `Error ValidateJWT_Token(): OAuthProvider class is not ready!`;
    // spliting the token by '.' into it's three parts:
    // jwt_parts[0]: Jwt Header         : base64 string encodes a json string.
    // jwt_parts[1]: Jwt Claims Payload : base64 string encodes a json string.
    // jwt_parts[2]: Jwt Signature      : base64 string represent the signature.
    let jwt_parts = token.split(".");
    if (jwt_parts.length !== 3)
      throw `Error ValidateJWT_Token(): JWT token string is invalid!`;
    // Decoding the headers:
    let header: JWTHeaders = JSON.parse(
      Buffer.from(jwt_parts[0], "base64").toString()
    );
    // Checking algorithm used:
    if (header.alg !== "RS256")
      throw `Error ValidateJWT_Token(): algorithm '${header.alg}' is not supported!`;
    // redirect signature verification to the jwtFactory class
    // if the jwt_token is signed with the server's own private key
    // identified by the `process.env.SERVER_JWT_KID` key id:
    if (header.kid === process.env.SERVER_JWT_KID)
      return this.jwtFactory.VerifyJWT(jwt_parts);
    // Searching for the appropriate key used to sign the token
    // from the well known google's keys retrieved from
    // google's discovery document:
    let key = this.JWT_KeysArray.keys.find((value) => {
      return value.kid === header.kid;
    });
    if (!key)
      throw `Error ValidateJWT_Token(): invalid key_id: '${header.kid}'`;
    // Verifying the token signature using the public key
    // with the provided signature (jwt_parts[2]):
    let Verifier = crypto.createVerify("RSA-SHA256");
    let signature = Buffer.from(jwt_parts[2], "base64");
    Verifier.update(jwt_parts[0] + "." + jwt_parts[1]);
    if (Verifier.verify(key.pkey, signature) === false)
      throw `Error ValidateJWT_Token(): invalid signature`;
    let jwt: JWT = JSON.parse(Buffer.from(jwt_parts[1], "base64").toString());
    // Ensuring correct audience and issuer ids:
    if (jwt.iss !== this.discoveryDocument.issuer)
      throw `Error ValidateJWT_Token(): invalid JWT issuer`;
    if (jwt.aud !== Vault.envs.GOOGLE_CLIENT_ID)
      throw `Error ValidateJWT_Token(): invalid JWT audience`;
    return jwt;
  }

  /**
   * Verifies the refresh_token validity and generates a signed jwt_token
   * valid for one hour using the server's own key then it set the token
   * in the user cookie.
   * @param refresh_token raw jwt_token to verify validity.
   * @param reply FastifyReply object used to send the cookie to the user.
   * @returns JWT object containing the claims.
   */
  public RefreshJwtToken(refresh_token: string, reply: FastifyReply): JWT {
    if (!this.isReady)
      throw `Error RefreshJwtToken(): OAuthProvider class is not ready!`;
    // Check token is valid:
    const query = db.persistent.prepare(
      `SELECT * FROM '${refresh_token_table_name}' WHERE token = ? ;`
    );
    const res = query.all(refresh_token) as RefreshTokenModel[];
    if (res.length === 0) throw `Error RefreshToken(): bad refresh_token!`;
    // Generating and signing the jwt token:
    const jwt = JWTFactory.CreateJWT(res[0].UID);
    const token = AuthProvider.jwtFactory.SignJWT(jwt);
    const expiresDate = new Date(jwt.exp * 1000).toUTCString();
    // Setting the jwt cookie to the new token:
    reply.raw.setHeader(
      "set-cookie", `jwt=${token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`
    );
    return jwt;
  }
}

const AuthProvider = new OAuthProvider(
  process.env.GOOGLE_DISCOVERY_DOCUMENT_URL as string
);

export default AuthProvider;
