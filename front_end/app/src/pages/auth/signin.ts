import GoogleIcon from "~/icons/google.svg?raw";
import LockIcon from "~/icons/lock.svg?raw";
import { navigateTo } from "~/components/app-router";
import { getUser } from "../../api/user";

class SigninPage extends HTMLElement {
  constructor() {
    super();
    const token = new URL(window.location.href).searchParams.get("token");
    if (token) {
      (async () => {
        localStorage.setItem("uid", token);
        window._currentUser = await getUser();
        navigateTo("/profile");
      })();
    }
  }

  handleSumbit = async (e: SubmitEvent) => {
    const form = (e.target as HTMLElement).closest("form");
    const error = this.querySelector("#error") as HTMLDivElement;

    if (form) {
      e.preventDefault();
      const fieldset = form.closest("fieldset");
      const formData = new FormData(form);

      error.innerHTML = "";

      if (fieldset) fieldset.disabled = true;

      const res = await fetch("/api/user/signin", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        if (fieldset) fieldset.disabled = false;
        error.innerHTML = /*html*/ `<p class='mb-2'>${await res.text()}</p>`;
        return;
      }
      const data = await res.json();

      localStorage.setItem("uid", data.token as string);
      window._currentUser = await getUser();
      navigateTo("/profile");
    }
  };

  getAuthState = async () => {
    const res = await fetch("/api/OAuth/state");
    if (!res.ok) throw Error("Unexpected error occured!");

    return res.text();
  };

  handleSignin = async () => {
    try {
      const state = await this.getAuthState();

      const params = {
        state,
        client_id:
          "752517493811-3uehg85g0ienmif5frk1c0lpiq15rkqm.apps.googleusercontent.com",
        redirect_uri: "https://server.transcendence.fr/OAuth/code",
        scope:
          "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        include_granted_scopes: "true",
        response_type: "code",
        access_type: "offline",
      };

      const queryString = new URLSearchParams(params).toString();

      const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;

      window.open(url, "_blank");
    } catch (err) {
      if (err instanceof Error) alert(err.message);
      else console.error("Unexpected Error: ", err);
    }
  };

  async render() {
    if (window._currentUser) {
      return navigateTo("/profile");
    }
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <fieldset class="max-w-md mx-auto my-4 flex flex-col gap-4 mt-16">
          <div class="p-6 md:rounded-md border">
            <div id='error' class='text-red-500 text-sm'></div>
            <form class="space-y-6 [&_label]:block [&_label]:mb-4">
              <div>
                <label for="user-name">username</label>
                <input
                  class='input'
                  type="text"
                  id="user-name"
                  name="username"
                  placeholder="msitni"
                  autocomplete="off"
                  required
                />
              </div>
              <div>
                <label for="user-password">password</label>
                <input
                  class='input'
                  type="password"
                  id="user-password"
                  name="password"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
              <button class='btn w-full' type="submit">
                ${LockIcon}
                <span>Submit</span>
              </button>
            </form>
            <div class="shrink-0 bg-border h-[1px] w-full my-4"></div>
            <button id='google-auth-btn' class='btn w-full' type="button">
              ${GoogleIcon}
              <span>Sign-in with Google</span>
            </button>
          </div>
        </fieldset>
    `;
    this.setup();
  }

  setup() {
    const signinForm = this.querySelector("form");
    const googleAuthBtn = this.querySelector("#google-auth-btn") as
      | HTMLButtonElement
      | undefined;
    const userInput = this.querySelector("#user-name") as
      | HTMLInputElement
      | undefined;

    signinForm?.addEventListener("submit", this.handleSumbit);
    googleAuthBtn?.addEventListener("click", this.handleSignin);
    userInput?.focus();
  }

  connectedCallback() {
    this.innerHTML = "<app-loader></app-loader>";
    this.render();
  }
}

customElements.define("signin-page", SigninPage);
