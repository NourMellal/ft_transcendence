import { setupUser } from '~/api/user';
import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import '~/components/settings/settings-info';
import '~/components/settings/settings-2fa';
import '~/components/settings/settings-password';
import { user } from '~/app-state';

export default class SettingsPage extends HTMLElement {
  currentUser = user.get();

  render = async () => {
    await setupUser();
    if (!this.currentUser) {
      return navigateTo('/signin');
    }
    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container mt-16">
        <profile-info></profile-info>
        <settings-password></settings-password>
        <settings-2fa></settings-2fa>
      </div>
    `);
  };

  setup() {
    //
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define('settings-page', SettingsPage);
