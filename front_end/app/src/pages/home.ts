import { navigateTo } from "~/components/app-router";

class HomePage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    if (window._currentUser) {
      return navigateTo("/profile");
    }
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
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

customElements.define("home-page", HomePage);
