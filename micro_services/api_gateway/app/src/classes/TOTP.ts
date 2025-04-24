import crypto from "crypto";

export type TOTPStatesModel = {
  totp_key: string;
  jwt_token: string;
  created: number;
};

class TOTP {
  states: Map<string, TOTPStatesModel>;
  constructor() {
    this.states = new Map<string, TOTPStatesModel>();
  }
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
