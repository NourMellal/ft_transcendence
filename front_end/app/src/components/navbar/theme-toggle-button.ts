import { SunIcon, MoonIcon } from '~/icons';
import { html } from '~/lib/html';

class ThemeToggleButton extends HTMLElement {
  render() {
    const isDark = document.documentElement.classList.contains('dark');
    this.replaceChildren(html`
      <button class="btn-outlined btn-icon">
        ${isDark ? SunIcon : MoonIcon}
      </button>
    `);
    this.setup();
  }

  toggle = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.render();
  };

  setup() {
    this.querySelector('button')?.addEventListener('click', this.toggle);
  }

  connectedCallback() {
    this.render();
  }
}

if (!customElements.get('theme-toggle-button')) {
  customElements.define('theme-toggle-button', ThemeToggleButton);
}
