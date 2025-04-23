import MoonIcon from "~/icons/moon.svg?raw";
import SunIcon from "~/icons/sun.svg?raw";

class ThemeToggleButton extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const isDark = document.documentElement.classList.contains("dark");
    this.innerHTML = /*html*/ `
      <button class='btn ghost'>
        ${
          isDark
            ? /*html*/ `
          <span class='flex items-center gap-2'>
            ${SunIcon}
            Light
          </span>
        `
            : /*html*/ `
          <span class='flex items-center gap-2'>
            ${MoonIcon}
            Dark
          </span>
        `
        }
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
