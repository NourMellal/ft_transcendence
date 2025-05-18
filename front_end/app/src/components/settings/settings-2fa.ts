import { html } from '~/lib/html';
import '~/components/settings/partials/disable-2fa';
import '~/components/settings/partials/enable-2fa';
import { userStore } from '~/app-state';
import { User } from '~/api/user';
class Settings2FA extends HTMLElement {
  cleanupCallbacks = new Array<Function>();

  render() {
    const currentUser = userStore.get();

    if (!currentUser) return;

    this.replaceChildren(html`
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div class="md:col-span-1">
          <h2 class="text-xl font-semibold mb-1">Security</h2>
          <p class="text-sm text-muted-foreground">Manage your account security settings.</p>
        </div>
        <div class="md:col-span-2">
          <div class="card border rounded-lg shadow-sm">
            <div class="card-header p-6 border-b">
              <h3 class="text-lg font-medium">Two-Factor Authentication</h3>
            </div>
            <div id="totp-container" class="card-content p-6 space-y-4">
              <p class="text-sm text-muted-foreground mb-4">
                Add an additional layer of security to your account during login.
              </p>
            </div>
          </div>
        </div>
      </div>
    `);
    this.setup(currentUser);
  }

  setup(currentUser: User) {
    const container = this.querySelector<HTMLDivElement>('#totp-container')!;

    if (currentUser.totp_enabled) {
      container.appendChild(document.createElement('disable-2fa'));
    } else {
      container.appendChild(document.createElement('enable-2fa'));
    }
  }

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(userStore.subscribe(() => this.render()));
  }

  disconnectedCallback() {
    this.cleanupCallbacks.forEach((callback) => callback());
    this.cleanupCallbacks = [];
  }
}

customElements.define('settings-2fa', Settings2FA);
