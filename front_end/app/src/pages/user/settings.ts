class SettingsPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class='container'>
        <h1>Settings Page</h1>
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

  disconnectedCallback() {
    console.log("settings page disconnectedCallback");
  }
}

customElements.define("settings-page", SettingsPage);
