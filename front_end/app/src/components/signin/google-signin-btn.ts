import { GoogleIcon } from '~/icons';
import { html } from '~/lib/html';
import { showToast } from '../toast';

export class GoogleSignInButton extends HTMLElement {
  render() {
    this.replaceChildren(html`
      <button id="google-auth-btn" class="btn btn-primary w-full" type="button">
        ${GoogleIcon}
        <span>Sign-in with Google</span>
      </button>
    `);
    this.querySelector('button')?.addEventListener('click', this.handleSignin);
  }

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
        client_id:
          '752517493811-3uehg85g0ienmif5frk1c0lpiq15rkqm.apps.googleusercontent.com',
        redirect_uri: 'https://transcendence.fr/api/OAuth/code',
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
      if (err instanceof Error) {
        showToast({
          type: 'error',
          message: err.message,
        });
      } else {
        showToast({
          type: 'error',
          message: 'Unexpected error occured!',
        });
      }
    }
  };

  connectedCallback() {
    this.render();
  }
}

if (!customElements.get('google-signin-btn')) {
  customElements.define('google-signin-btn', GoogleSignInButton);
}
