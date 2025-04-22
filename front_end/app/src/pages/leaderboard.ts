class LeaderboardPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class='container'>
        <h1>Leaderboard</h1>
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

customElements.define("leaderboard-page", LeaderboardPage);
