import '~/components/navbar/friends-nav-menu';
import '~/components/navbar/mobile-navigation';
import '~/components/navbar/notification-nav-menu';
import '~/components/navbar/theme-toggle-button';
import '~/components/navbar/user-nav-menu';

import { html } from '~/lib/html';
import { userStore } from '~/app-state';

import { LockIcon, MenuIcon, RocketIcon } from '~/icons';
import { navigateTo } from '../app-router';

const UserLinks = [
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
];

const GuestLinks = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'LeaderBoard',
    href: '/leaderboard',
  },
];

class NavigationBar extends HTMLElement {
  cleanupCallbacks = new Array<Function>();

  render() {
    const pages = userStore.get() ? UserLinks : GuestLinks;
    const mobileNav = document.createElement('mobile-navigation');
    mobileNav.setAttribute('pages', JSON.stringify(pages));

    this.replaceChildren(html`
      <div class="fixed top-0 inset-x-0 z-40 px-2 py-2 border-b bg-background/80 backdrop-blur-md">
        <div class="container flex items-center">
          <button id="open-menu-btn" class="me-4 md:hidden cursor-pointer">
            ${MenuIcon}
            <span class="sr-only">menu</span>
          </button>
          <a href="/" class="hidden md:block font-bold text-lg me-8"> ft_transcendence </a>
          <div
            class="hidden md:flex gap-2 [&>a]:text-muted-foreground [&>a]:hover:text-foreground transition-colors [&>a]:p-2 [&>a]:py-4"
          >
            ${pages.map(
              (page) => html` <a class="cursor-pointer" href="${page.href}"> ${page.name} </a> `
            )}
          </div>
          <div class="ms-auto flex gap-4 items-center justify-center">
            <theme-toggle-button></theme-toggle-button>
            ${userStore.get()
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

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(userStore.subscribe(() => this.render()));
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href) {
        const origin = window.location.origin;
        if (anchor.href.startsWith(origin)) {
          e.preventDefault();
          if (anchor.href !== window.location.href) {
            navigateTo(anchor.href.replace(origin, ''));
          }
        }
      }
    });
  }

  disconnectedCallback() {
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
    this.cleanupCallbacks = [];
  }
}

customElements.define('navigation-bar', NavigationBar);
