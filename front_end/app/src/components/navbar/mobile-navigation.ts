import { XIcon } from '~/icons';
import { html } from '~/lib/html';

class MobileNavigation extends HTMLElement {
  static observedAttributes = ['pages'];

  render() {
    const pagesAttr = this.getAttribute('pages');
    if (!pagesAttr) return;

    const pages = JSON.parse(pagesAttr) as {
      name: string;
      href: string;
    }[];

    this.replaceChildren(html`
      <div
        class="z-40 hidden md:hidden absolute inset-0 bg-background/80 backdrop-blur-md p-4"
        id="mobile-menu"
      >
        <div class="border-b flex items-center justify-between pb-4 mb-4">
          <h4 class="font-bold text-lg me-8 select-none">ft_transcendence</h4>
          <button class="cursor-pointer" id="close-menu-btn">${XIcon}</button>
        </div>
        <div class="flex flex-col gap-2">
          ${pages.map(
            (page) => html`
              <a
                class="focus:bg-muted py-2 px-4 -mx-4 transition-colors"
                href="${page.href}"
              >
                ${page.name}
              </a>
            `
          )}
        </div>
      </div>
    `);
  }

  toggle = () => {
    const mobileMenuElement = this.querySelector(
      '#mobile-menu'
    ) as HTMLDivElement | null;

    if (!mobileMenuElement) return;

    const isHidden = mobileMenuElement.classList.contains('hidden');
    const animationOpts: KeyframeAnimationOptions = {
      duration: 200,
      easing: 'ease-in-out',
      fill: 'forwards',
    };

    if (isHidden) {
      mobileMenuElement.classList.remove('hidden');

      mobileMenuElement.animate(
        [
          { opacity: 0, transform: 'translateX(-100%)' },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        animationOpts
      );
    } else {
      const anim = mobileMenuElement.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-100%)' },
        ],
        animationOpts
      );

      anim.onfinish = () => {
        mobileMenuElement.classList.add('hidden');
      };
    }
  };

  setup() {
    this.querySelector('#close-menu-btn')?.addEventListener(
      'click',
      this.toggle
    );

    document
      .querySelector('navigation-bar #open-menu-btn')
      ?.addEventListener('click', this.toggle);
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define('mobile-navigation', MobileNavigation);
