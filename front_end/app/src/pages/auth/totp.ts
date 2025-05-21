import { fetchWithAuth } from '~/api/auth';
import { setupUser } from '~/api/user';
import { navigateTo } from '~/components/app-router';
import { showToast } from '~/components/toast';
import { html } from '~/lib/html';

export default class TotpVerify extends HTMLElement {
  render() {
    this.replaceChildren(html`
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div
          id="card"
          class="opacity-0 relative border bg-background text-foreground rounded-lg p-6 max-w-sm w-full shadow-lg space-y-4 md:max-w-md"
        >
          <h1 class="text-lg font-semibold">Two-Factor Authentication</h1>
          <p class="text-muted-foreground text-sm">
            Enter the 6-digit code from your authenticator app.
          </p>
          <form id="totp-form" class="space-y-4">
            <div class="space-y-2">
              <label for="totp-code" class="label">Authentication Code</label>
              <input
                autocomplete="off"
                id="totp-code"
                name="code"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                placeholder="123456"
                class="input"
                required
              />
            </div>
            <div class="flex gap-2">
              <button id="cancel-btn" type="button" class="btn btn-destructive w-full">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary w-full">Verify</button>
            </div>
          </form>
        </div>
      </div>
    `);
    this.setup();
  }

  setup() {
    const cardElement = this.querySelector<HTMLDivElement>('#card')!;
    const cancelBtn = this.querySelector<HTMLButtonElement>('#cancel-btn')!;
    const form = this.querySelector<HTMLFormElement>('#totp-form')!;

    cardElement.animate(
      [
        { opacity: 0, transform: 'scale(0.95)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards',
      }
    );
    form.querySelector('input')!.focus();

    cancelBtn.addEventListener('click', () => {
      window.history.back();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const target = e.target as HTMLFormElement;
      const url = new URL(window.location.href);
      const res = await fetchWithAuth(`/api/2FA/verify?state=${url.searchParams.get('state')}`, {
        method: 'POST',
        body: new FormData(target),
        cache: 'no-store',
      });

      if (res.ok) {
        await setupUser();
        showToast({
          message: `Welcome back!`,
          type: 'success',
        });
        return navigateTo('/profile');
      }

      const message = await res.text();
      if (res.status === 401) {
        showToast({
          message: message,
          type: 'error',
        });
        return;
      }
      showToast({
        message: `Unexpected error occured!`,
        type: 'error',
      });
    });
  }

  connectedCallback() {
    this.render();
  }
}

if (!customElements.get('totp-verify-page')) {
  customElements.define('totp-verify-page', TotpVerify);
}
