import UsersIcon from "~/icons/users.svg?raw";

interface FriendRequest {
  REQ_ID: string;
  from_uid: string;
  to_uid: string;
  username?: string;
  picture_url?: string;
}

class FriendsNavMenu extends HTMLElement {
  private friendRequests: FriendRequest[] = [];

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

  async fetchFriendRequests() {
    try {
      const response = await fetch("/api/friends/requests", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }
      this.friendRequests = await response.json();

      // Fetch user info for each request
      for (const request of this.friendRequests) {
        try {
          const userResponse = await fetch(
            `/api/user/info?uid=${request.from_uid}`,
            {
              credentials: "include",
            }
          );
          if (userResponse.ok) {
            const userInfo = await userResponse.json();
            request.username = userInfo.username;
            request.picture_url = userInfo.picture_url;
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }

      this.render();
      this.setFriendsCount(this.friendRequests.length);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  }

  async acceptFriendRequest(reqId: string) {
    try {
      const response = await fetch(`/api/friends/accept?uid=${reqId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }

      // Refresh the friend requests list
      await this.fetchFriendRequests();
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  }

  async denyFriendRequest(reqId: string) {
    try {
      const response = await fetch(`/api/friends/deny?uid=${reqId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to deny friend request");
      }

      // Refresh the friend requests list
      await this.fetchFriendRequests();
    } catch (error) {
      console.error("Error denying friend request:", error);
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
            ${
              this.friendRequests.length === 0
                ? /*html*/ `
                  <li class="px-4 py-3 text-center text-sm text-muted-foreground">
                    No pending friend requests
                  </li>
                `
                : this.friendRequests
                    .map(
                      (request) => /*html*/ `
                    <li class="flex items-center px-4 py-3 hover:bg-muted/50">
                      <img
                        src="/api/${
                          request.picture_url || "static/profile/default.jpg"
                        }"
                        alt="${request.username || "User"}"
                        class="w-8 h-8 rounded-full"
                      />
                      <div class="ml-3 flex-1 min-w-0">
                        <p class="text-sm font-medium">${
                          request.username || "Unknown User"
                        }</p>
                        <p class="text-xs text-muted-foreground">Sent you a friend request</p>
                      </div>
                      <div class="flex space-x-2">
                        <button
                          class="btn btn-sm btn-primary"
                          onclick="this.closest('friends-nav-menu').acceptFriendRequest('${
                            request.REQ_ID
                          }')"
                        >
                          Accept
                        </button>
                        <button
                          class="btn btn-sm btn-destructive"
                          onclick="this.closest('friends-nav-menu').denyFriendRequest('${
                            request.REQ_ID
                          }')"
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  `
                    )
                    .join("")
            }
          </ul>
          <div class="px-4 py-2 border-t border-muted text-center">
            <a href="/profile" class="text-sm font-medium text-primary hover:underline">
              View All Requests
            </a>
          </div>
        </div>
      </div>
    `;
  }

  setup() {
    const btn = this.querySelector("#friends-btn") as HTMLButtonElement | null;
    const menu = this.querySelector("#friends-menu") as HTMLDivElement | null;
    if (btn && menu) {
      // Remove existing event listeners to prevent duplicates
      btn.removeEventListener("click", this.toggle);
      document.removeEventListener("click", this.handleOutsideClick);

      // Add new event listeners
      btn.addEventListener("click", this.toggle);
      document.addEventListener("click", this.handleOutsideClick);
    }
  }

  private handleOutsideClick = (e: MouseEvent) => {
    const menu = this.querySelector("#friends-menu") as HTMLDivElement | null;
    const btn = this.querySelector("#friends-btn") as HTMLButtonElement | null;
    if (!menu || !btn) return;

    const target = e.target as HTMLElement;
    if (
      !menu.classList.contains("hidden") &&
      !menu.contains(target) &&
      !btn.contains(target)
    ) {
      this.close();
    }
  };

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

  connectedCallback() {
    this.render();
    this.setup();
  }

  // Add disconnectedCallback to clean up event listeners
  disconnectedCallback() {
    const btn = this.querySelector("#friends-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.removeEventListener("click", this.toggle);
    }
    document.removeEventListener("click", this.handleOutsideClick);
  }
}

customElements.define("friends-nav-menu", FriendsNavMenu);
