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
        class="w-screen h-[calc(100vh-73px)]"
        src="https://transcendence.fr/api/game/"
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

if (!customElements.get('play-page')) {
  customElements.define('play-page', PlayPage);
}
