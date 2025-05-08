import MoonIcon from "~/icons/moon.svg?raw";
import SunIcon from "~/icons/sun.svg?raw";
import { html } from "~/lib/html";

class ThemeToggleButton extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const isDark = document.documentElement.classList.contains("dark");
    this.replaceChildren(html`
      <button class="btn-outlined btn-icon">
        ${isDark ? SunIcon : MoonIcon}
      </button>
    `);
  }

  toggle = () => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
    this.render();
    this.setup();
  };

  setup() {
    this.querySelector("button")?.addEventListener("click", this.toggle);
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define("theme-toggle-button", ThemeToggleButton);
