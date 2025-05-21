import { html } from '~/lib/html';

export default class NotFound extends HTMLElement {
  render() {
    this.replaceChildren(html`
      <div
        class="-mb-8 md:-mt-20 -mt-16 flex flex-col items-center justify-center min-h-screen space-y-4"
      >
        <h1 class="text-4xl font-bold tracking-tight">404 Not Found</h1>
        <p class="text-muted-foreground text-center">The page you're looking for doesn't exist.</p>
        <a href="/" class="btn-primary"> Go back home </a>
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

if (!customElements.get('not-found')) {
  customElements.define('not-found', NotFound);
}
