// filepath: /home/obenchkr/Desktop/pong-backend/front_end/app/src/components/navbar/friends-nav-menu.ts
import UsersIcon from "~/icons/users.svg?raw";

class FriendsNavMenu extends HTMLElement {
  constructor() {
    super();
  }

  // mirror the notification count API
  setFriendsCount(count: number) {
    const countEl = this.querySelector(
      "#friends-count"
    ) as HTMLSpanElement | null;
    if (countEl) {
      countEl.textContent = count.toString();
      countEl.style.display = count > 0 ? "flex" : "none";
    }
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="relative">
        <button id="friends-btn" class="cursor-pointer p-2 rounded-md hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent">
          ${UsersIcon}
          <span
            id="friends-count"
            class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium"
          >0</span>
        </button>
        <div
          id="friends-menu"
          class="hidden w-sm absolute right-0 top-full mt-2 bg-background border border-muted rounded-lg shadow-lg overflow-hidden"
        >
          <div class="px-4 py-2 border-b border-muted">
            <h4 class="text-sm font-semibold">Friend Requests</h4>
          </div>
          <ul class="divide-y divide-muted max-h-60 overflow-y-auto">
          <li class="flex items-center px-4 py-3 hover:bg-muted/50">
              <img
                src="/api/static/profile/default.jpg"
                alt="Avatar"
                class="w-8 h-8 rounded-full"
              />
              <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm font-medium">Jane Doe</p>
                <p class="text-xs text-muted-foreground">2 mutual friends</p>
              </div>
              <div class="flex space-x-2">
                <button class="btn btn-sm btn-primary">Accept</button>
                <button class="btn btn-sm btn-destructive">Decline</button>
              </div>
            </li>
          </ul>
          <div class="px-4 py-2 border-t border-muted text-center">
            <a href="#" class="text-sm font-medium text-primary hover:underline">
              View All Requests
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // show with slide‐down & hide with slide‐up
  toggle = () => {
    const menu = this.querySelector("#friends-menu") as HTMLDivElement | null;
    if (!menu) return;

    const hidden = menu.classList.contains("hidden");
    const animOpts: KeyframeAnimationOptions = {
      duration: 200,
      easing: "ease-in-out",
      fill: "forwards",
    };

    if (hidden) {
      menu.classList.remove("hidden");
      menu.animate(
        [
          { opacity: 0, transform: "translateY(-10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        animOpts
      );
    } else {
      this.close();
    }
  };

  close = () => {
    const menu = this.querySelector("#friends-menu") as HTMLDivElement | null;
    if (!menu) return;

    const animation = menu.animate(
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
    animation.onfinish = () => menu.classList.add("hidden");
  };

  setup() {
    const btn = this.querySelector("#friends-btn") as HTMLButtonElement | null;
    const menu = this.querySelector("#friends-menu") as HTMLDivElement | null;
    if (btn && menu) {
      btn.addEventListener("click", this.toggle);
      document.addEventListener("click", (e) => {
        const t = e.target as HTMLElement;
        if (
          !menu.classList.contains("hidden") &&
          !menu.contains(t) &&
          !btn.contains(t)
        ) {
          this.close();
        }
      });
    }

    // initialize badge
    this.setFriendsCount(1);
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define("friends-nav-menu", FriendsNavMenu);
