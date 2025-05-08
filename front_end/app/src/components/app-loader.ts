import { LoadingIcon } from '~/icons';
import { html } from '~/lib/html';

class AppLoader extends HTMLElement {
  render() {
    this.replaceChildren(html`
      <div
        class="z-50 fixed inset-0 bg-background flex items-center justify-center"
      >
        <div class="flex flex-col gap-2">
          ${LoadingIcon}
          <p>Loading...</p>
        </div>
      </div>
    `);
    this.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: 'ease-in-out',
      fill: 'forwards',
    });
  }

  connectedCallback() {
    this.render();
  }

  remove() {
    const animation = this.firstElementChild?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );

    if (animation) {
      animation.onfinish = () => {
        super.remove();
      };
    }
  }
}

customElements.define('app-loader', AppLoader);
