import { navigateTo } from "~/components/app-router";

class SettingsPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    if (!window._currentUser) {
      return navigateTo("/signin");
    }
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class="container pb-8">
        <profile-info></profile-info>
        <settings-password></settings-password>
        <settings-2fa></settings-2fa>
      </div>
    `;
  }

  setup() {
    //
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define("settings-page", SettingsPage);
