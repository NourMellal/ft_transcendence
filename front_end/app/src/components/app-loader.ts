import LoadingIcon from "~/icons/loading.svg?raw";

class AppLoader extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.innerHTML = /*html*/ `
      <div class="fixed inset-0 bg-background flex items-center justify-center">
        <div class='flex flex-col gap-2'>
          ${LoadingIcon}
          <p>Loading...</p>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.render();
    this.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 300,
      easing: "ease-in-out",
      fill: "forwards",
    });
  }

  remove() {
    const animation = this.firstElementChild?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 300,
        easing: "ease-in-out",
        fill: "forwards",
      }
    );

    if (animation) {
      animation.onfinish = () => {
        super.remove();
      };
    }
  }
}

customElements.define("app-loader", AppLoader);
