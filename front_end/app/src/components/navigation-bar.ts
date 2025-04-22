import LockIcon from "~/icons/lock.svg?raw";
import MenuIcon from "~/icons/menu.svg?raw";
import XIcon from "~/icons/x.svg?raw";
import UserIcon from "~/icons/user.svg?raw";
import CogIcon from "~/icons/cog.svg?raw";
import LogoutIcon from "~/icons/logout.svg?raw";
import RocketIcon from "~/icons/rocket.svg?raw";
import { navigateTo } from "./app-router";

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
          <div class='hidden md:flex gap-2 [&>a]:text-muted-foreground [&>a]:hover:text-foreground transition-colors [&>a]:p-2 [&>a]:py-3'>
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
          <div class='ms-auto space-x-2'>
            ${
              window._currentUser
                ? /*html*/ `
                  <div class='relative'>
                    <button id='user-menu-btn' class='cursor-pointer focus-within:ring-ring'>
                      <img src='/api/${window._currentUser.picture_url}' class='h-10 w-10 ring ring-offset-2 ring-ring rounded-full' alt='${window._currentUser.username}' />
                    </button>
                    <div id='user-menu' class='hidden w-48 absolute right-0 top-full bg-background border border-muted rounded-md shadow-lg mt-2 p-2 [&>a]:p-1 [&>button]:p-1'>
                      <a class='flex gap-2 [&>svg]:h-4 [&>svg]:w-4 text-sm text-muted-foreground hover:text-foreground transition-colors' href='/profile'>
                        ${UserIcon}
                        <span>Profile</span>
                      </a>
                      <a class='flex gap-2 [&>svg]:h-4 [&>svg]:w-4 text-sm text-muted-foreground hover:text-foreground transition-colors' href='/settings'>
                        ${CogIcon}
                        <span>Settings</span>
                      </a>
                      <button type='button' id='logout-btn' class='flex gap-2 [&>svg]:h-4 [&>svg]:w-4 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer'>
                        ${LogoutIcon}
                        <span>Signout</span>
                      </button>
                    </div>
                  </div>
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
      <div class='hidden md:hidden absolute inset-0 bg-background/80 backdrop-blur-md p-4' id='mobile-menu'>
        <div class='border-b flex items-center justify-between pb-4 mb-4'>
          <h4 class='font-bold text-lg me-8 select-none'>ft_transcendence</h4>
          <button class='cursor-pointer' id='close-menu-btn'>${XIcon}</button>
        </div>
        <div class='flex flex-col gap-2'>
          ${pages
            .map(
              (page) => /*html*/ `
                <a class='focus:bg-muted py-2 px-4 -mx-4 transition-colors' href="${page.href}">
                  ${page.name}
                </a>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  handleLogout = () => {
    localStorage.removeItem("uid");
    window._currentUser = null;
    navigateTo("/signin");
  };

  closeUserMenu = (event: MouseEvent) => {
    const userMenu = this.querySelector("#user-menu") as HTMLDivElement | null;
    const userMenuBtn = this.querySelector(
      "#user-menu-btn"
    ) as HTMLButtonElement | null;

    if (userMenu && userMenuBtn) {
      const target = event.target as HTMLElement;

      const shouldClose =
        userMenu.contains(target.closest("a")) ||
        (!userMenu.contains(target) &&
          !userMenuBtn.contains(target) &&
          userMenu.classList.contains("hidden") === false);

      if (shouldClose) {
        const animation = userMenu.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-10px)" },
          ],
          {
            duration: 200,
            easing: "ease-in-out",
            fill: "forwards",
          }
        );

        animation.onfinish = () => userMenu.classList.add("hidden");
      }
    }
  };

  toggleUserMenu = () => {
    const userMenu = this.querySelector("#user-menu") as HTMLDivElement | null;

    if (!userMenu) return;

    const isClosed = userMenu.classList.contains("hidden");
    let animation: Animation;

    if (isClosed) {
      animation = userMenu.animate(
        [
          { opacity: 0, transform: "translateY(-10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 200,
          easing: "ease-in-out",
          fill: "forwards",
        }
      );
      userMenu.classList.remove("hidden");
    } else {
      animation = userMenu.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-10px)" },
        ],
        {
          duration: 200,
          easing: "ease-in-out",
          fill: "forwards",
        }
      );
      animation.onfinish = () => userMenu.classList.add("hidden");
    }
  };

  toggleMobileMenu = () => {
    const mobileMenuElement = this.querySelector(
      "#mobile-menu"
    ) as HTMLDivElement | null;

    if (!mobileMenuElement) return;

    const isHidden = mobileMenuElement.classList.contains("hidden");
    const animationOpts: KeyframeAnimationOptions = {
      duration: 200,
      easing: "ease-in-out",
      fill: "forwards",
    };

    if (isHidden) {
      mobileMenuElement.classList.remove("hidden");

      mobileMenuElement.animate(
        [
          { opacity: 0, transform: "translateX(-100%)" },
          { opacity: 1, transform: "translateX(0)" },
        ],
        animationOpts
      );
    } else {
      const anim = mobileMenuElement.animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: "translateX(-100%)" },
        ],
        animationOpts
      );

      anim.onfinish = () => {
        mobileMenuElement.classList.add("hidden");
      };
    }
  };

  setup() {
    // user menu
    this.querySelector("#user-menu-btn")?.addEventListener(
      "click",
      this.toggleUserMenu
    );

    document.addEventListener("click", this.closeUserMenu);

    // mobile menu
    this.querySelector("#close-menu-btn")?.addEventListener(
      "click",
      this.toggleMobileMenu
    );

    this.querySelector("#open-menu-btn")?.addEventListener(
      "click",
      this.toggleMobileMenu
    );

    // logout btn
    this.querySelector("#logout-btn")?.addEventListener(
      "click",
      this.handleLogout
    );
  }

  async connectedCallback() {
    this.render();
    this.setup();
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.closeUserMenu);
  }
}

customElements.define("navigation-bar", NavigationBar);
