import { navigateTo } from "~/components/app-router";
import { User } from "~/api/user";
import { showToast } from "~/components/toast";
import { fetchWithAuth } from "~/api/auth";

class ProfilePage extends HTMLElement {
  constructor() {
    super();
  }

  async render() {
    if (!window._currentUser) {
      navigateTo("/signin");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const uid = urlParams.get("uid");
    let user: User;
    let isOwnProfile = false;
    let isFriend = false;
    let hasPendingRequest = false;
    let isRequestFromUser = false;
    let pendingRequestId: string | null = null;
    let hasSentRequest = false;

    try {
      if (uid) {
        const res = await fetchWithAuth(`/api/user/info?uid=${uid}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          navigateTo("/profile");
          return;
        }
        user = await res.json();
        isOwnProfile = user.UID === window._currentUser.UID;

        const friendsRes = await fetchWithAuth("/api/friends", {
          credentials: "include",
          cache: "no-store",
        });
        if (friendsRes.ok) {
          const friends = await friendsRes.json();
          isFriend = friends.includes(user.UID);
        }

        const requestsRes = await fetchWithAuth("/api/friends/requests", {
          credentials: "include",
          cache: "no-store",
        });
        if (requestsRes.ok) {
          const requests = await requestsRes.json();
          const pendingRequest = requests.find(
            (request: any) =>
              (request.from_uid === user.UID &&
                request.to_uid === window._currentUser?.UID) ||
              (request.from_uid === window._currentUser?.UID &&
                request.to_uid === user.UID)
          );
          hasPendingRequest = !!pendingRequest;
          isRequestFromUser = pendingRequest?.from_uid === user.UID;
          pendingRequestId = pendingRequest?.REQ_ID || null;
        }

        const sentRequestsRes = await fetchWithAuth(
          "/api/friends/sent_requests",
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (sentRequestsRes.ok) {
          const sentRequests = await sentRequestsRes.json();
          const sentRequest = sentRequests.find(
            (request: any) => request.to_uid === user.UID
          );
          hasSentRequest = !!sentRequest;
          if (sentRequest) {
            pendingRequestId = sentRequest.REQ_ID;
          }
        }
      } else {
        user = window._currentUser;
        isOwnProfile = true;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      navigateTo("/profile");
      return;
    }

    const stats = [
      { label: "Games Played", value: "42" },
      { label: "Win Rate", value: "65%" },
      { label: "Rank", value: "#12" },
    ];

    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class="container space-y-8 mt-16">
        <!-- Profile Header -->
        <div class="flex flex-col items-center space-y-4">
          <div class="relative">
            <img
              src="/api/${user.picture_url}"
              alt="${user.username}"
              class="w-32 h-32 rounded-full ring ring-ring ring-offset-2 ring-offset-background object-cover"
            />
            ${
              isOwnProfile
                ? /*html*/ `
              <a href="/settings" class="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                  <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"></path>
                </svg>
              </a>
            `
                : ""
            }
          </div>
          <div class="text-center space-y-1">
            <h1 class="text-2xl font-bold">${user.username}</h1>
            <p class="text-muted-foreground">${user.bio || "No bio yet"}</p>
          </div>
          <div class="flex gap-2">
            ${
              !isOwnProfile
                ? /*html*/ `
              ${
                isFriend
                  ? /*html*/ `
                    <div class="flex gap-2">
                      <button class="btn btn-disabled" disabled>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Already Friends</span>
                      </button>
                      <button
                        class="btn btn-destructive"
                        onclick="this.closest('profile-page').removeFriend('${user.UID}')"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <line x1="18" y1="8" x2="23" y2="13"></line>
                          <line x1="23" y1="8" x2="18" y2="13"></line>
                        </svg>
                        <span>Remove Friend</span>
                      </button>
                    </div>
                  `
                  : hasPendingRequest
                  ? isRequestFromUser
                    ? /*html*/ `
                        <div class="flex gap-2">
                          <button
                            class="btn btn-primary"
                            onclick="this.closest('profile-page').acceptFriendRequest('${pendingRequestId}')"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>Accept Request</span>
                          </button>
                          <button
                            class="btn btn-destructive"
                            onclick="this.closest('profile-page').denyFriendRequest('${pendingRequestId}')"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            <span>Decline</span>
                          </button>
                        </div>
                      `
                    : /*html*/ `
                        <button class="btn btn-disabled" disabled>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          <span>Request Sent</span>
                        </button>
                      `
                  : hasSentRequest
                  ? /*html*/ `
                      <div class="flex gap-2">
                        <button class="btn btn-disabled" disabled>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                        <span>Request Sent</span>
                      </button>
                      <button
                        class="btn btn-destructive"
                        onclick="this.closest('profile-page').denyFriendRequest('${pendingRequestId}')"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>Cancel Request</span>
                      </button>
                    </div>
                  `
                  : /*html*/ `
                    <button
                      class="btn btn-outlined"
                      onclick="this.closest('profile-page').addFriend('${user.UID}')"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" y1="8" x2="19" y2="14"></line>
                        <line x1="22" y1="11" x2="16" y2="11"></line>
                      </svg>
                      <span>Add Friend</span>
                    </button>
                  `
              }
            `
                : ""
            }
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${stats
            .map(
              (stat) => /*html*/ `
            <div class="card border rounded-lg p-6 text-center">
              <p class="text-2xl font-bold">${stat.value}</p>
              <p class="text-sm text-muted-foreground">${stat.label}</p>
            </div>
          `
            )
            .join("")}
        </div>

        <!-- Recent Activity -->
        <div class="card border rounded-lg">
          <div class="card-header p-6 border-b">
            <h2 class="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div class="card-content p-6">
            <div class="space-y-4">
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full bg-primary"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium">Won against johndoe</p>
                  <p class="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <span class="text-sm font-medium text-primary">+25 pts</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full bg-destructive"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium">Lost against janedoe</p>
                  <p class="text-xs text-muted-foreground">5 hours ago</p>
                </div>
                <span class="text-sm font-medium text-destructive">-15 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async addFriend(uid: string) {
    try {
      const response = await fetchWithAuth(`/api/friends/request?uid=${uid}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to send friend request");
      }

      this.render();
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  }

  async acceptFriendRequest(uid: string) {
    try {
      const response = await fetchWithAuth(`/api/friends/accept?uid=${uid}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }

      this.render();
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  }

  async denyFriendRequest(uid: string) {
    try {
      const response = await fetchWithAuth(`/api/friends/deny?uid=${uid}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to deny friend request");
      }

      this.render();
    } catch (error) {
      console.error("Error denying friend request:", error);
    }
  }

  async removeFriend(uid: string) {
    try {
      const response = await fetchWithAuth(`/api/friends/remove?uid=${uid}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to remove friend");
      }

      showToast({
        type: "success",
        message: "Friend removed successfully",
      });

      this.render();
    } catch (error) {
      showToast({
        type: "error",
        message: "An unexpected error occurred while removing friend",
      });
    }
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define("profile-page", ProfilePage);
