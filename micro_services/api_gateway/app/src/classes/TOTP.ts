import crypto from "crypto";

/**
 * this object used to temporarly hold the jwt_token
 * for Users who activated Two factor authentication
 * to complete the 2FA flow when signing in.
 */
export type TOTPStatesModel = {
  totp_key: string;
  jwt_token: string;
  UID: string;
  created: number;
};

/**
 * TOTP class provides functionality for generating totp codes
 * and holds a map of `TOTPStatesModel` used to temporarly store
 * the values of jwt token returned to the end user when they
 * successfuly complete the 2FA flow.
 */
export class TOTP {
  states: Map<string, TOTPStatesModel>;
  constructor() {
    this.states = new Map<string, TOTPStatesModel>();
  }

  /**
   * This function generates totp code using a key
   * @param keyString The key used to generate the totp code
   * @returns the current totp code.
   * @see https://datatracker.ietf.org/doc/html/rfc6238
   */
  generateTOTP(keyString: string): string {
    const codeDigitsCount = 6;
    const timeStamp = Math.floor(Date.now() / (1000 * 30));
    var step = timeStamp.toString(16).toUpperCase();
    while (step.length < 16) step = "0" + step;
    const msg = Buffer.from(step, "hex");
    const key = Buffer.from(keyString);
    const Hmac = crypto.createHmac("sha256", key);
    Hmac.update(msg);
    const hash = Hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    const otp = binary % 10 ** codeDigitsCount;
    var result = otp.toString();
    while (result.length < codeDigitsCount) {
      result = "0" + result;
    }
    return result;
  }
}

const Totp = new TOTP();

export default Totp;
