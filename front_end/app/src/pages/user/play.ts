import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { userState } from '~/app-state';

export default class PlayPage extends HTMLElement {
  render() {
    if (!userState.get()) {
      return navigateTo('/signin');
    }
    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container">
        <h1>Play Page</h1>
      </div>
    `);
    this.setup();
  }

  setup() {
    //
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define('play-page', PlayPage);
