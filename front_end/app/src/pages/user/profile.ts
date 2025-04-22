import { navigateTo } from "~/components/app-router";

class ProfilePage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    if (!window._currentUser) {
      navigateTo("/signin");
    }

    const userData = JSON.stringify(window._currentUser, null, 4);

    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <pre class='container'>${userData}</pre>
    `;
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define("profile-page", ProfilePage);
