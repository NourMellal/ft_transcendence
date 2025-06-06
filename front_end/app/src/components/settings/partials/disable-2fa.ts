import { fetchWithAuth } from '~/api/auth';
import { fetchUserInfo } from '~/api/user';
import { userStore } from '~/app-state';
import { showToast } from '~/components/toast';
import { html } from '~/lib/html';

class Disable2FA extends HTMLElement {
  render() {
    this.replaceChildren(html`
      <div id="totp-disable-area" class="pt-4 space-y-4">
        <p class="text-sm">
          Enter the 6-digit code from your authenticator app to disable 2FA:
        </p>
        <form id="disable-2fa-form" class="flex gap-2 items-start">
          <div class="flex-grow">
            <input
              autocomplete="off"
              name="code"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              class="input w-full tracking-wider"
              placeholder="XXXXXX"
            />
            <p
              id="totp-disable-error"
              class="text-xs text-destructive mt-1"
            ></p>
          </div>
          <button id="disable-2fa-btn" class="btn btn-destructive">
            Confirm Disable
          </button>
        </form>
      </div>
    `);
    this.setup();
  }

  setup() {
    const form = this.querySelector<HTMLFormElement>('#disable-2fa-form')!;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const target = e.target as HTMLFormElement;
      const res = await fetchWithAuth('/api/2FA/disable', {
        method: 'POST',
        credentials: 'include',
        body: new FormData(target),
        cache: 'no-store',
      });

      if (res.ok) {
        showToast({
          type: 'success',
          message: '2FA disabled successfully.',
        });
        userStore.set(await fetchUserInfo());
      } else {
        showToast({
          type: 'error',
          message: await res.text(),
        });
        target.querySelector<HTMLInputElement>("input[name='code']")!.value =
          '';
      }
    });
  }

  connectedCallback() {
    this.render();
  }
}

if (!customElements.get('disable-2fa')) {
  customElements.define('disable-2fa', Disable2FA);
}
