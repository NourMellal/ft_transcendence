import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import '~/components/settings/settings-info';
import '~/components/settings/settings-2fa';
import '~/components/settings/settings-password';
import '~/components/settings/settings-devices';
import { userState } from '~/app-state';

export default class SettingsPage extends HTMLElement {
  render = async () => {
    if (!userState.get()) {
      return navigateTo('/signin');
    }
    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
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
