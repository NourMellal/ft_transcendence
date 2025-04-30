import BellIcon from "~/icons/bell.svg?raw";

class NotificationNavMenu extends HTMLElement {
  constructor() {
    super();
  }

  setNotificationCount(count: number) {
    const notificationCount = this.querySelector(
      "#notification-count"
    ) as HTMLSpanElement | null;

    if (notificationCount) {
      notificationCount.textContent = count.toString();
      notificationCount.style.display = count > 0 ? "flex" : "none";
    }
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="relative">
      <button id="notification-btn" class="cursor-pointer p-2 rounded-md hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent">
        ${BellIcon}
        <span
          id="notification-count"
          class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium"
        >0</span>
      </button>
      <div
        id="notification-menu"
        class="hidden fixed sm:absolute right-0 mt-2 w-[280px] sm:w-[320px] max-w-[90vw] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md z-40"
      >
        <div class="flex justify-end px-2 pt-2">
        <button class="text-sm text-muted-foreground hover:underline focus:outline-none">
          Mark all as read
        </button>
        </div>
        <div class="divide-y divide-border">
        <a
          href="#"
          class="flex flex-col gap-1 px-4 py-3 hover:bg-accent/10 focus:bg-accent/10 outline-none"
        >
          <h4 class="text-sm font-semibold">Notification Title</h4>
          <p class="text-sm text-muted-foreground">Lorem ipsum dolor sit amet.</p>
        </a>
        <a
          href="#"
          class="flex flex-col gap-1 px-4 py-3 hover:bg-accent/10 focus:bg-accent/10 outline-none"
        >
          <h4 class="text-sm font-semibold">Notification Title</h4>
          <p class="text-sm text-muted-foreground">Lorem ipsum dolor sit amet.</p>
        </a>
        <a
          href="#"
          class="flex flex-col gap-1 px-4 py-3 hover:bg-accent/10 focus:bg-accent/10 outline-none"
        >
          <h4 class="text-sm font-semibold">Notification Title</h4>
          <p class="text-sm text-muted-foreground">Lorem ipsum dolor sit amet.</p>
        </a>
        </div>
      </div>
      </div>
    `;
  }

  toggle = () => {
    const notificationMenu = this.querySelector(
      "#notification-menu"
    ) as HTMLDivElement | null;

    if (!notificationMenu) return;

    const isHidden = notificationMenu.classList.contains("hidden");
    const animationOpts: KeyframeAnimationOptions = {
      duration: 200,
      easing: "ease-in-out",
      fill: "forwards",
    };

    if (isHidden) {
      notificationMenu.classList.remove("hidden");

      notificationMenu.animate(
        [
          { opacity: 0, transform: "translateY(-10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        animationOpts
      );
    } else {
      this.close();
    }
  };

  close = () => {
    const notificationMenu = this.querySelector(
      "#notification-menu"
    ) as HTMLDivElement | null;

    if (!notificationMenu) return;

    const animation = notificationMenu.animate(
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

    animation.onfinish = () => notificationMenu.classList.add("hidden");
  };

  setup() {
    const notificationBtn = this.querySelector(
      "#notification-btn"
    ) as HTMLButtonElement | null;

    const notificationMenu = this.querySelector(
      "#notification-menu"
    ) as HTMLDivElement | null;

    if (notificationBtn && notificationMenu) {
      notificationBtn.addEventListener("click", this.toggle);
      document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (
          !notificationMenu.classList.contains("hidden") &&
          !notificationMenu.contains(target) &&
          !notificationBtn.contains(target)
        ) {
          this.close();
        }
      });
    }
  }

  connectedCallback() {
    this.render();
    this.setup();
    this.setNotificationCount(3);
  }
}

customElements.define("notification-nav-menu", NotificationNavMenu);
