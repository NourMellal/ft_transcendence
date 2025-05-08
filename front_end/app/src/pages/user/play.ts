import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { user } from '~/app-state';

export default class PlayPage extends HTMLElement {
  render() {
    if (!user.get()) {
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
