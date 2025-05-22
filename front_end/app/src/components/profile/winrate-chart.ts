import { html } from '~/lib/html';

class ProfileWinrateChart extends HTMLElement {
  connectedCallback() {
    this.replaceChildren(html`
      <div>
        <h1>Pie Chart</h1>
      </div>
    `);
  }
}

if (!customElements.get('profile-winrate-chart')) {
  customElements.define('profile-winrate-chart', ProfileWinrateChart);
}
