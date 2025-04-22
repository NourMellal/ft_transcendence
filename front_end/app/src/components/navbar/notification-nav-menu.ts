import BellIcon from "~/icons/bell.svg?raw";

class NotificationNavMenu extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class='relative'>
        <button id='notification-btn' class='cursor-pointer p-2.5 rounded-full hover:bg-muted'>
          ${BellIcon}
        </button>
        <div id='notification-menu' class='hidden w-sm absolute right-0 top-full bg-background border border-muted rounded-md shadow-lg mt-2 p-1 [&>a]:p-1 [&>button]:p-1'>
          <div class='block text-sm p-2.5 rounded-md hover:bg-muted cursor-pointer'>
            <h5 class='font-semibold mb-1'>Notification Title</h5>
            <p class='text-muted-foreground'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
          <div class='block text-sm p-2.5 rounded-md hover:bg-muted cursor-pointer'>
            <h5 class='font-semibold mb-1'>Notification Title</h5>
            <p class='text-muted-foreground'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
          <div class='block text-sm p-2.5 rounded-md hover:bg-muted cursor-pointer'>
            <h5 class='font-semibold mb-1'>Notification Title</h5>
            <p class='text-muted-foreground'>
              Lorem ipsum dolor sit amet.
            </p>
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
  }
}

customElements.define("notification-nav-menu", NotificationNavMenu);
