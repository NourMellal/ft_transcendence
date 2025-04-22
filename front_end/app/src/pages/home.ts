class HomePage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
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
