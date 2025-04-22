class NotFound extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h1 class="text-4xl font-bold tracking-tight">404 Not Found</h1>
        <p class="text-muted-foreground text-center">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          class="btn"
        >
          Go back home
        </a>
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

customElements.define("not-found", NotFound);
