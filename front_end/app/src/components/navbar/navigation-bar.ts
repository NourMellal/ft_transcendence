import LockIcon from "~/icons/lock.svg?raw";
import MenuIcon from "~/icons/menu.svg?raw";
import RocketIcon from "~/icons/rocket.svg?raw";

class NavigationBar extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const pages = window._currentUser
      ? [
          {
            name: "Play",
            href: "/play",
          },
          {
            name: "Chat",
            href: "/chat",
          },
          {
            name: "LeaderBoard",
            href: "/leaderboard",
          },
        ]
      : [
          {
            name: "Home",
            href: "/",
          },
        ];
    this.innerHTML = /*html*/ `
      <div class='px-2 py-2 border-b mb-8'>
        <div class='container flex items-center'>
          <button id='open-menu-btn' class='me-4 md:hidden cursor-pointer'>
            ${MenuIcon}
            <span class='sr-only'>menu</span>
          </button>
          <h4 class='font-bold text-lg me-8 select-none'>ft_transcendence</h4>
          <div class='hidden md:flex gap-2 [&>a]:text-muted-foreground [&>a]:hover:text-foreground transition-colors [&>a]:p-2 [&>a]:py-4'>
            ${pages
              .map(
                (page) => /*html*/ `
                  <a class='cursor-pointer' href="${page.href}">
                    ${page.name}
                  </a>
                `
              )
              .join("")}
          </div>
          <div class='ms-auto flex gap-4 items-center justify-center'>
            ${
              window._currentUser
                ? /*html*/ `
                  <notification-nav-menu></notification-nav-menu>
                  <user-nav-menu></user-nav-menu>
                `
                : /*html*/ `
                  <a class='btn-ghost' href="/signin">
                    ${LockIcon}
                    <span>Sign-in</span>
                  </a>
                  <a class='btn' href="/signup">
                    ${RocketIcon}
                    <span>Sign-up</span>
                  </a>
                `
            }
          </div>
        </div>
      </div>
      <mobile-navigation pages='${JSON.stringify(pages)}'></mobile-navigation>
    `;
  }
  async connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    //
  }
}

customElements.define("navigation-bar", NavigationBar);
