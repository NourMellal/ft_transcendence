import UsersIcon from "~/icons/users.svg?raw";
import { showToast } from "~/components/toast";
import { fetchWithAuth } from "~/api/auth";

interface FriendRequest {
  REQ_ID: string;
  from_uid: string;
  to_uid: string;
  username?: string;
  picture_url?: string;
}

class FriendsNavMenu extends HTMLElement {
  private friendRequests: FriendRequest[] = [];
  private friendsBtn: HTMLButtonElement | null = null;
  private friendsMenu: HTMLDivElement | null = null;

  constructor() {
    super();
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
          class="hidden fixed sm:absolute right-0 w-[280px] sm:w-[320px] max-w-[90vw] bg-background border border-muted rounded-lg shadow-lg overflow-hidden z-40"
        >
        </div>
      </div>
    `;
    this.friendsBtn = this.querySelector("#friends-btn");
    this.friendsMenu = this.querySelector("#friends-menu");
  }

  private setFriendsCount(count: number) {
    const countEl = this.querySelector(
      "#friends-count"
    ) as HTMLSpanElement | null;
    if (countEl) {
      countEl.textContent = count.toString();

      countEl.classList.toggle("hidden", count === 0);
    }
  }

  async fetchFriendRequests() {
    try {
      const response = await fetchWithAuth("/api/friends/requests", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch friend requests: ${response.status}`);
      }
      const requests: FriendRequest[] = await response.json();
      this.friendRequests = requests;

      await Promise.allSettled(
        this.friendRequests.map(async (request) => {
          try {
            const userResponse = await fetchWithAuth(
              `/api/user/info?uid=${request.from_uid}`,
              {
                credentials: "include",
                cache: "no-store",
              }
            );
            if (userResponse.ok) {
              const userInfo = await userResponse.json();
              request.username = userInfo.username;
              request.picture_url = userInfo.picture_url;
            } else {
              showToast({
                type: "error",
                message: `Failed to fetch user info for ${request.from_uid}`,
              });
            }
          } catch (error) {
            showToast({
              type: "error",
              message: `Failed to fetch user info for ${request.from_uid}`,
            });
          }
        })
      );

      this.render();
    } catch (error) {
      console.error("Failed to load friend requests:", error);
      this.friendRequests = [];
      this.render();
    }
  }

  async acceptFriendRequest(reqId: string) {
    try {
      const response = await fetchWithAuth(`/api/friends/accept?uid=${reqId}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to accept friend request: ${response.status}`);
      }
      showToast({ type: "success", message: "Friend request accepted!" });
      await this.fetchFriendRequests();
    } catch (error) {
      console.error("Failed to accept request:", error);
      showToast({
        type: "error",
        message: "Failed to accept request",
      });
    }
  }

  async denyFriendRequest(reqId: string) {
    try {
      const response = await fetchWithAuth(`/api/friends/deny?uid=${reqId}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to deny friend request: ${response.status}`);
      }
      showToast({ type: "info", message: "Friend request declined." });
      await this.fetchFriendRequests();
    } catch (error) {
      console.error("Failed to deny request:", error);
      showToast({
        type: "error",
        message: "Failed to deny request",
      });
    }
  }

  private render() {
    if (!this.friendsMenu) return;

    this.friendsMenu.innerHTML = /*html*/ `
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
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <div class="ml-3 flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                    ${request.username || "Unknown User"}
                    </p>
                  </div>
                  <div class="flex space-x-2 ml-2">
                    <button
                      class="btn btn-xs btn-primary"
                      data-action="accept"
                      data-req-id="${request.REQ_ID}"
                    >
                      Accept
                    </button>
                    <button
                      class="btn btn-xs btn-destructive"
                      data-action="deny"
                      data-req-id="${request.REQ_ID}"
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
    `;
    this.setFriendsCount(this.friendRequests.length);
    this.setupActionButtonsListeners();
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (
      this.friendsMenu &&
      !this.friendsMenu.classList.contains("hidden") &&
      !this.contains(e.target as Node)
    ) {
      this.close();
    }
  };

  private setup() {
    if (this.friendsBtn) {
      this.friendsBtn.addEventListener("click", this.toggle);
    }
    document.addEventListener("click", this.handleOutsideClick);
    this.fetchFriendRequests();
  }

  private setupActionButtonsListeners() {
    this.querySelectorAll("button[data-req-id]").forEach((button) => {
      button.removeEventListener("click", this.handleFriendRequestAction);
      button.addEventListener("click", this.handleFriendRequestAction);
    });
  }

  private handleFriendRequestAction = async (event: Event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const action = button.dataset.action;
    const reqId = button.dataset.reqId;

    button.disabled = true;

    if (reqId) {
      if (action === "accept") {
        await this.acceptFriendRequest(reqId);
      } else if (action === "deny") {
        await this.denyFriendRequest(reqId);
      }
    }
  };

  private toggle = () => {
    if (!this.friendsMenu) return;
    const hidden = this.friendsMenu.classList.contains("hidden");
    const animOpts: KeyframeAnimationOptions = {
      duration: 200,
      easing: "ease-in-out",
      fill: "forwards",
    };

    if (hidden) {
      this.friendsMenu.classList.remove("hidden");
      this.friendsMenu.animate(
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

  private close = () => {
    if (!this.friendsMenu || this.friendsMenu.classList.contains("hidden"))
      return;

    const animation = this.friendsMenu.animate(
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
    animation.onfinish = () => {
      if (this.friendsMenu) {
        this.friendsMenu.classList.add("hidden");
      }
    };
  };

  connectedCallback() {
    this.friendsBtn = this.querySelector("#friends-btn");
    this.friendsMenu = this.querySelector("#friends-menu");
    this.setup();
  }

  disconnectedCallback() {
    if (this.friendsBtn) {
      this.friendsBtn.removeEventListener("click", this.toggle);
    }
    document.removeEventListener("click", this.handleOutsideClick);

    this.querySelectorAll("button[data-req-id]").forEach((button) => {
      button.removeEventListener("click", this.handleFriendRequestAction);
    });
  }
}

customElements.define("friends-nav-menu", FriendsNavMenu);
