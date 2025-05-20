import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import '~/components/settings/settings-info';
import '~/components/settings/settings-2fa';
import '~/components/settings/settings-password';
import '~/components/settings/settings-devices';
import { userStore } from '~/app-state';

export default class SettingsPage extends HTMLElement {
  render = async () => {
    if (!userStore.get()) {
      return navigateTo('/signin');
    }
    this.replaceChildren(html`
      <div class="container mt-16">
        <profile-info></profile-info>
        <settings-password></settings-password>
        <settings-devices></settings-devices>
        <settings-2fa></settings-2fa>
      </div>
    `);
  };

  connectedCallback() {
    this.render();
  }
}

customElements.define('settings-page', SettingsPage);
