import { KeyObject } from "crypto";

/**
 * the parsed payload part of the JWT which contains the claims to verify
 * in order to grant authorization to the entity holding the JWT token.
 * 
 * @property sub Subject: used as the uid of the user for it's uniqueness.
 * @property aud Audience: the uid of the application targeted by the claims.
 * @property iss Issuer: the uid of the issuer of the token this should be either google or the ft_transcendence server uid.
 * @property exp Expires: the expiration time after the token will not be valid (unix seconds).
 * @property iat IssueAt: The unix seconds whe the token created.
 */
export type JWT = {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
  email?: string;
  name?: string;
  picture?: string;
};

/**
 * the parsed header part of the JWT.
 * 
 * @property alg Algorithm: used as the uid of the user for it's uniqueness.
 * @property kid KeyId: the expiration time after the token will not be valid (unix seconds).
 */
export type JWTHeaders = {
  alg: string;
  kid: string;
  typ: string;
};


/**
 * Public keys array used for signature verification of the jwt payload.
 * 
 * @property kid key id.
 * @property e exponent.
 * @property n modulus.
 * @property alg algorithm used.
 * @property pkey a `NodeJs` public key object constructed from `n`, `e` and `alg` used for signature verification.
 */
export type JWK_Array = {
  keys: [
    {
      pkey: KeyObject;
      kid: string;
      n: string;
      e: string;
      alg: string;
    }
  ];
};