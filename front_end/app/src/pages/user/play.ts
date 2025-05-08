import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';

export default class PlayPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    if (!window._currentUser) {
      return navigateTo('/signin');
    }
    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container">
        <h1>Play Page</h1>
      </div>
    `);
  }

  setup() {
    //
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define('play-page', PlayPage);
