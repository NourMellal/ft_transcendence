import MoonIcon from "~/icons/moon.svg?raw";
import SunIcon from "~/icons/sun.svg?raw";

class ThemeToggleButton extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const isDark = document.documentElement.classList.contains("dark");
    this.innerHTML = /*html*/ `
      <button class='cursor-pointer p-2.5 rounded-full hover:bg-muted'>
        ${isDark ? SunIcon : MoonIcon}
      </button>
    `;
  }

  toggle = () => {
    document.documentElement.classList.toggle("dark");
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
