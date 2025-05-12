import { navigateTo } from '~/components/app-router';
import { User } from '~/api/user';
import { showToast } from '~/components/toast';
import { fetchWithAuth } from '~/api/auth';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { friendRequestsState, userState } from '~/app-state';
import { fetchFriendRequests } from '~/api/friends';

enum FriendStatus {
  NONE,
  FRIEND,
  PENDING_OUTGOING,
  PENDING_INCOMING,
}

interface ProfileState {
  user: User;
  isOwnProfile: boolean;
  friendStatus: FriendStatus;
  pendingRequestId: string | null;
}

export default class ProfilePage extends HTMLElement {
  private state: ProfileState | null = null;
  private cleanupCallbacks = new Array<Function>();

  async loadProfileData(): Promise<ProfileState | null> {
    const currentUser = userState.get();
    if (!currentUser) {
      navigateTo('/signin');
      return null;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const username = urlParams.get('username');

    try {
      let profileUser: User | null;
      if (userId || username) {
        const queryParam = username ? `uname=${username}` : `uid=${userId}`;
        const res = await fetchWithAuth(`/api/user/info?${queryParam}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          navigateTo('/profile');
          return null;
        }
        profileUser = await res.json();
      } else {
        profileUser = currentUser;
      }

      if (!profileUser) {
        navigateTo('/signin');
        return null;
      }

      const isOwnProfile = profileUser.UID === currentUser.UID;

      if (isOwnProfile) {
        return {
          user: profileUser,
          isOwnProfile,
          friendStatus: FriendStatus.NONE,
          pendingRequestId: null,
        };
      }

      const friendStatus = await this.getFriendStatus(profileUser.UID);

      return {
        user: profileUser,
        isOwnProfile,
        ...friendStatus,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigateTo('/profile');
      return null;
    }
  }

  async getFriendStatus(
    targetUid: string
  ): Promise<{ friendStatus: FriendStatus; pendingRequestId: string | null }> {
    try {
      const friendsRes = await fetchWithAuth('/api/friends', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (friendsRes.ok) {
        const friends = await friendsRes.json();
        if (friends.includes(targetUid)) {
          return { friendStatus: FriendStatus.FRIEND, pendingRequestId: null };
        }
      }

      const requestsRes = await fetchWithAuth('/api/friends/requests', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        const incomingRequest = requests.find((request: any) => request.from_uid === targetUid);

        if (incomingRequest) {
          return {
            friendStatus: FriendStatus.PENDING_INCOMING,
            pendingRequestId: incomingRequest.REQ_ID,
          };
        }
      }

      const sentRequestsRes = await fetchWithAuth('/api/friends/sent_requests', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (sentRequestsRes.ok) {
        const sentRequests = await sentRequestsRes.json();
        const outgoingRequest = sentRequests.find((request: any) => request.to_uid === targetUid);

        if (outgoingRequest) {
          return {
            friendStatus: FriendStatus.PENDING_OUTGOING,
            pendingRequestId: outgoingRequest.REQ_ID,
          };
        }
      }

      return { friendStatus: FriendStatus.NONE, pendingRequestId: null };
    } catch (error) {
      console.error('Error checking friend status:', error);
      return { friendStatus: FriendStatus.NONE, pendingRequestId: null };
    }
  }

  renderFriendActionButtons() {
    if (!this.state || this.state.isOwnProfile) return '';

    const { user, friendStatus, pendingRequestId } = this.state;

    switch (friendStatus) {
      case FriendStatus.FRIEND:
        return html`
          <div class="flex gap-2">
            <button class="btn-ghost" disabled>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Already Friends</span>
            </button>
            <button
              class="btn btn-destructive friend-action"
              data-action="remove"
              data-id="${user.UID}"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="18" y1="8" x2="23" y2="13"></line>
                <line x1="23" y1="8" x2="18" y2="13"></line>
              </svg>
              <span>Remove Friend</span>
            </button>
          </div>
        `;

      case FriendStatus.PENDING_INCOMING:
        return html`
          <div class="flex gap-2">
            <button
              class="btn btn-primary friend-action"
              data-action="accept"
              data-id="${pendingRequestId}"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Accept Request</span>
            </button>
            <button
              class="btn btn-destructive friend-action"
              data-action="deny"
              data-id="${pendingRequestId}"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Decline</span>
            </button>
          </div>
        `;

      case FriendStatus.PENDING_OUTGOING:
        return html`
          <div class="flex gap-2">
            <button class="btn-ghost" disabled>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
              <span>Request Sent</span>
            </button>
            <button
              class="btn btn-destructive friend-action"
              data-action="cancel"
              data-id="${pendingRequestId}"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Cancel Request</span>
            </button>
          </div>
        `;

      default:
        return html`
          <button class="btn btn-outlined friend-action" data-action="add" data-id="${user.UID}">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            <span>Add Friend</span>
          </button>
        `;
    }
  }

  async handleFriendAction(action: string, id: string) {
    try {
      let endpoint = '';
      let successMessage = '';

      switch (action) {
        case 'add':
          endpoint = `/api/friends/request?uid=${id}`;
          successMessage = 'Friend request sent';
          break;
        case 'accept':
          endpoint = `/api/friends/accept?uid=${id}`;
          successMessage = 'Friend request accepted';
          break;
        case 'deny':
        case 'cancel':
          endpoint = `/api/friends/deny?uid=${id}`;
          successMessage =
            action === 'deny' ? 'Friend request declined' : 'Friend request canceled';
          break;
        case 'remove':
          endpoint = `/api/friends/remove?uid=${id}`;
          successMessage = 'Friend removed successfully';
          break;
        default:
          throw new Error('Invalid friend action');
      }

      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} friend`);
      }

      showToast({ type: 'success', message: successMessage });
      await this.render();
    } catch (error) {
      console.error(`Error with friend action (${action}):`, error);
      showToast({
        type: 'error',
        message: `Failed to ${action} friend. Please try again.`,
      });
    }

    friendRequestsState.set(await fetchFriendRequests());
  }

  setup() {
    const buttons = this.querySelectorAll('.friend-action');

    buttons.forEach((button) => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const action = target.dataset.action;
        const id = target.dataset.id;

        if (action && id) {
          this.handleFriendAction(action, id);
        }
      });
    });
  }

  async render() {
    this.state = await this.loadProfileData();
    if (!this.state) return;

    const { user, isOwnProfile } = this.state;

    const stats = [
      { label: 'Games Played', value: '42' },
      { label: 'Win Rate', value: '65%' },
      { label: 'Rank', value: '#12' },
    ];

    this.replaceChildren(html`
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
            ${isOwnProfile
              ? html`
                  <a
                    href="/settings"
                    class="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="h-4 w-4"
                    >
                      <path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path
                        d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"
                      ></path>
                    </svg>
                  </a>
                `
              : ''}
          </div>
          <div class="text-center space-y-1">
            <h1 class="text-2xl font-bold">${user.username}</h1>
            <p class="text-muted-foreground">${user.bio || 'No bio yet'}</p>
          </div>
          <div class="flex gap-2">${!isOwnProfile ? this.renderFriendActionButtons() : ''}</div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${stats.map(
            (stat) => html`
              <div class="card border rounded-lg p-6 text-center">
                <p class="text-2xl font-bold">${stat.value}</p>
                <p class="text-sm text-muted-foreground">${stat.label}</p>
              </div>
            `
          )}
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
                <span class="text-sm font-medium text-destructive"> -15 pts </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    this.setup();
  }

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(friendRequestsState.subscribe(() => this.render()));
  }

  disconnectedCallback() {
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
  }
}

customElements.define('profile-page', ProfilePage);
