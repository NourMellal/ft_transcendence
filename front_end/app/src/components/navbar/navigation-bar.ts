import LockIcon from '~/icons/lock.svg?raw';
import MenuIcon from '~/icons/menu.svg?raw';
import RocketIcon from '~/icons/rocket.svg?raw';
import { html } from '~/lib/html';
import '~/components/navbar/friends-nav-menu';
import '~/components/navbar/mobile-navigation';
import '~/components/navbar/notification-nav-menu';
import '~/components/navbar/theme-toggle-button';
import '~/components/navbar/user-nav-menu';

class NavigationBar extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const pages = window._currentUser
      ? [
          {
            name: 'Play',
            href: '/play',
          },
          {
            name: 'Chat',
            href: '/chat',
          },
          {
            name: 'LeaderBoard',
            href: '/leaderboard',
          },
        ]
      : [
          {
            name: 'Home',
            href: '/',
          },
          {
            name: 'LeaderBoard',
            href: '/leaderboard',
          },
        ];

    const mobileNav = document.createElement('mobile-navigation');
    mobileNav.setAttribute('pages', JSON.stringify(pages));

    this.replaceChildren(html`
      <div
        class="fixed top-0 inset-x-0 z-40 px-2 py-2 border-b bg-background/20 backdrop-blur-sm"
      >
        <div class="container flex items-center">
          <button id="open-menu-btn" class="me-4 md:hidden cursor-pointer">
            ${MenuIcon}
            <span class="sr-only">menu</span>
          </button>
          <a href="/" class="hidden md:block font-bold text-lg me-8">
            ft_transcendence
          </a>
          <div
            class="hidden md:flex gap-2 [&>a]:text-muted-foreground [&>a]:hover:text-foreground transition-colors [&>a]:p-2 [&>a]:py-4"
          >
            ${pages.map(
              (page) => html`
                <a class="cursor-pointer" href="${page.href}"> ${page.name} </a>
              `
            )}
          </div>
          <div class="ms-auto flex gap-4 items-center justify-center">
            <theme-toggle-button></theme-toggle-button>
            ${window._currentUser
              ? html`
                  <friends-nav-menu></friends-nav-menu>
                  <notification-nav-menu></notification-nav-menu>
                  <user-nav-menu></user-nav-menu>
                `
              : html`
                  <a class="btn btn-outlined" href="/signin">
                    ${LockIcon}
                    <span>Sign-in</span>
                  </a>
                  <a class="btn btn-primary" href="/signup">
                    ${RocketIcon}
                    <span>Sign-up</span>
                  </a>
                `}
          </div>
        </div>
      </div>
      ${mobileNav}
    `);
  }
  async connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    //
  }
}

customElements.define('navigation-bar', NavigationBar);
