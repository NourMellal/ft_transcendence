import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';
import { userStore } from '~/app-state';

import '~/components/navbar/navigation-bar';

export default class PlayPage extends HTMLElement {
  render() {
    if (!userStore.get()) {
      return navigateTo('/signin');
    }

    this.replaceChildren(html`
      <iframe
        class="absolute inset-0 w-screen h-screen z-50"
        src="https://transcendence.fr/api/static/game/"
        frameborder="0"
      ></iframe>
    `);
    this.setup();
  }

  setup() {}

  connectedCallback() {
    this.render();
  }
}

customElements.define('play-page', PlayPage);
