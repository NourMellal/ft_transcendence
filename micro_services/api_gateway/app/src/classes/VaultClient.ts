import https from "https";

type VaultEnvs = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

type VaultEnvsResponse = {
  data: VaultEnvs;
};

type VaultLoginResponse = {
  auth: {
    client_token: string;
  };
};

/**
 * VaultClient class used to login to the vault server and retrieve
 * the google credential used in oidc flow to autheticate google
 * users.
 */
class VaultClient {
  vault_url: string;
  envs: VaultEnvs;
  constructor() {
    this.vault_url = process.env.VAULT_URL as string;
    this.envs = {} as VaultEnvs;
  }
  async RetrieveEnvs() {
    try {
      const Agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const pwd_payload = { password: process.env.VAULT_API_GATEWAY_PASS };
      const login_req = await fetch(
        `${process.env.VAULT_URL}/v1/auth/userpass/login/${process.env.VAULT_API_GATEWAY_USER}`,
        { method: "POST", body: JSON.stringify(pwd_payload) }
      );
      if (!login_req.ok) throw "Can't login";
      const token = ((await login_req.json()) as VaultLoginResponse).auth
        .client_token;
      const envs_req = await fetch(
        `${process.env.VAULT_URL}/v1/kv/api_gateway`,
        { headers: { "X-Vault-Token": token } }
      );
      if (!envs_req.ok) throw "Can't retreive credentials";
      this.envs = ((await envs_req.json()) as VaultEnvsResponse).data;
      console.info("Credentials retreived from vault!");
    } catch (error) {
      console.log(`[FATAL ERROR] VaultClient.RetrieveEnvs():`, error);
      process.exit(1);
    }
  }
}
const Vault: VaultClient = new VaultClient();
export default Vault;
