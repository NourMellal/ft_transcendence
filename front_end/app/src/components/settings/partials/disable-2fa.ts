import { fetchWithAuth } from '~/api/auth';
import { setupUser } from '~/api/user';
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
              class="input w-full tracking-widest"
              placeholder="123456"
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
    const form = this.querySelector('#disable-2fa-form') as HTMLFormElement;

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
        await setupUser();
      } else {
        showToast({
          type: 'error',
          message: await res.text(),
        });
        (target.querySelector("input[name='code']") as HTMLInputElement).value =
          '';
      }
    });
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define('disable-2fa', Disable2FA);
