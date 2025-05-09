import { navigateTo } from '~/components/app-router';
import { showToast } from '~/components/toast';
import { handleEffect } from '~/utils';
import { setupUser } from '~/api/user';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { user } from '~/app-state';
import { LockIcon, GoogleIcon } from '~/icons';

export default class SigninPage extends HTMLElement {
  handleSumbit = (e: SubmitEvent) => {
    const form = (e.target as HTMLElement).closest('form');
    e.preventDefault();

    if (form) {
      handleEffect(document.body, async () => {
        const formData = new FormData(form);

        const res = await fetch('/api/user/signin', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          redirect: 'follow',
          cache: 'no-store',
        });

        if (!res.ok) {
          form.querySelector<HTMLInputElement>('[name="password"]')!.value = '';
          showToast({ type: 'error', message: await res.text() });
          return;
        }

        if (res.redirected) {
          const url = new URL(res.url);
          return navigateTo(url.pathname + url.search);
        }

        await setupUser();

        showToast({
          type: 'success',
          message: `Welcome back!`,
        });
        navigateTo('/profile');
      });
    }
  };

  getAuthState = async () => {
    const res = await fetch('/api/OAuth/state', {
      cache: 'no-store',
      method: 'GET',
    });
    if (!res.ok) throw Error('Unexpected error occured!');

    return res.text();
  };

  handleSignin = async () => {
    try {
      const state = await this.getAuthState();

      const params = {
        state,
        client_id: '752517493811-3uehg85g0ienmif5frk1c0lpiq15rkqm.apps.googleusercontent.com',
        redirect_uri: 'https://transcendence.fr/api/OAuth/code', // <Error 400: redirect_uri_mismatch>: Rely on discovery doc to fetch and set all routes so i don't have to fix them manually. this one should be something like: discoverDocument.ServerUrl + discoverDocument.OAuthRoutes.OAuthRedirectRoute.route
        scope:
          'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        include_granted_scopes: 'true',
        response_type: 'code',
        access_type: 'offline',
      };

      const queryString = new URLSearchParams(params).toString();

      const url = `https://accounts.google.com/o/oauth2/v2/auth?${queryString}`;

      window.open(url, '_self');
    } catch (err) {
      if (err instanceof Error) showToast({ type: 'error', message: err.message });
      else showToast({ type: 'error', message: 'Unexpected error occured!' });
    }
  };

  async render() {
    if (user.get()) return navigateTo('/profile');

    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <fieldset class="max-w-md mx-auto my-4 flex flex-col gap-4 mt-16">
        <div class="p-6 md:rounded-md border">
          <form class="space-y-6 [&_label]:block [&_label]:mb-4">
            <div>
              <label for="user-name">username</label>
              <input
                class="input"
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
                class="input"
                type="password"
                id="user-password"
                name="password"
                placeholder="••••••••••••••••"
                required
              />
            </div>
            <button class="btn btn-primary w-full" type="submit">
              ${LockIcon}
              <span>Submit</span>
            </button>
          </form>
          <div class="shrink-0 bg-border h-[1px] w-full my-4"></div>
          <button id="google-auth-btn" class="btn btn-primary w-full" type="button">
            ${GoogleIcon}
            <span>Sign-in with Google</span>
          </button>
        </div>
      </fieldset>
    `);
    this.setup();
  }

  setup() {
    const signinForm = this.querySelector('form');
    const googleAuthBtn = this.querySelector('#google-auth-btn') as HTMLButtonElement | undefined;
    const userInput = this.querySelector('#user-name') as HTMLInputElement | undefined;

    signinForm?.addEventListener('submit', this.handleSumbit);
    googleAuthBtn?.addEventListener('click', this.handleSignin);
    userInput?.focus();
  }

  connectedCallback() {
    this.innerHTML = '<app-loader></app-loader>';
    this.render();
  }
}

customElements.define('signin-page', SigninPage);
