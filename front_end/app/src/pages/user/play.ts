import { navigateTo } from "~/components/app-router";

class PlayPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    if (!window._currentUser) {
      return navigateTo("/signin");
    }
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class='container'>
        <h1>Play Page</h1>
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

customElements.define("play-page", PlayPage);
