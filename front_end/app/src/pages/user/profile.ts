import '~/components/navbar/navigation-bar';

import { navigateTo } from '~/components/app-router';
import { User, fetchMatchHistory, MatchHistoryEntry, MatchStatus, MatchType } from '~/api/user';
import { showToast } from '~/components/toast';
import { fetchWithAuth } from '~/api/auth';
import { html } from '~/lib/html';
import { friendRequestsStore, userStore, pushNotificationStore } from '~/app-state';
import { fetchFriendRequests, fetchFriends, fetchSentFriendRequests } from '~/api/friends';
import { NotificationData, NotificationType } from '~/api/notifications';
import { fetchUserRank } from '~/api/leaderboard';

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
  matchHistory: MatchHistoryEntry[];
}

export default class ProfilePage extends HTMLElement {
  private state: ProfileState | null = null;
  private cleanupCallbacks = new Array<Function>();

  async loadProfileData(): Promise<ProfileState | null> {
    const currentUser = userStore.get();
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
          this.replaceChildren(html`
            <div
              class="-mb-8 md:-mt-20 -mt-16 flex flex-col items-center justify-center min-h-screen space-y-4"
            >
              <h1 class="text-4xl font-bold tracking-tight">Profile Not Found</h1>
              <p class="text-muted-foreground text-center">
                The profile you're looking for doesn't exist.
              </p>
              <a href="/profile" class="btn-primary"> Go to my profile </a>
            </div>
          `);
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

      const matchHistoryRes = await fetchMatchHistory(profileUser.UID);
      const matchHistory = matchHistoryRes.success ? matchHistoryRes.data : [];

      const isOwnProfile = profileUser.UID === currentUser.UID;

      return {
        user: profileUser,
        isOwnProfile,
        friendStatus: isOwnProfile
          ? FriendStatus.NONE
          : await this.getFriendStatus(profileUser.UID).then((fs) => fs.friendStatus),
        pendingRequestId: isOwnProfile
          ? null
          : await this.getFriendStatus(profileUser.UID).then((fs) => fs.pendingRequestId),
        matchHistory,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigateTo('/404');
      return null;
    }
  }

  async getFriendStatus(
    targetUid: string
  ): Promise<{ friendStatus: FriendStatus; pendingRequestId: string | null }> {
    try {
      // Check if target user is already a friend
      const friendsRes = await fetchFriends();
      if (friendsRes.success && friendsRes.data.some((u) => u.UID === targetUid)) {
        return { friendStatus: FriendStatus.FRIEND, pendingRequestId: null };
      }

      // Check for incoming friend requests
      const incoming = await fetchFriendRequests();
      if (incoming) {
        const req = incoming.find((r) => r.from_uid === targetUid);
        if (req) {
          return { friendStatus: FriendStatus.PENDING_INCOMING, pendingRequestId: req.REQ_ID };
        }
      }

      // Check for outgoing (sent) friend requests
      const sentRes = await fetchSentFriendRequests();
      if (sentRes.success) {
        const outReq = sentRes.data.find((r) => r.to_uid === targetUid);
        if (outReq) {
          return { friendStatus: FriendStatus.PENDING_OUTGOING, pendingRequestId: outReq.REQ_ID };
        }
      }

      // No friendship or pending requests
      return { friendStatus: FriendStatus.NONE, pendingRequestId: null };
    } catch (err) {
      console.error('Error checking friend status:', err);
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

    friendRequestsStore.set(await fetchFriendRequests());
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

    const { user, isOwnProfile, matchHistory } = this.state;

    const rankInfo = await fetchUserRank(user.UID);
    const rankData = rankInfo.data ? rankInfo.data : { rank: 'Unranked', wins: 0, losses: 0 };
    const gamesPlayed = String(rankData.wins + rankData.losses);
    const winRate = String(
      rankData.wins + rankData.losses > 0
        ? ((rankData.wins / (rankData.wins + rankData.losses)) * 100).toFixed(0) + '%'
        : '0%'
    );
    const rank = String(rankData.rank);
    let wins = String(rankData.wins);
    let losses = String(rankData.losses);

    const stats = [
      { label: 'Games Played', value: gamesPlayed },
      { label: 'Wins', value: wins.toString() },
      { label: 'Losses', value: losses.toString() },
      { label: 'Win Rate', value: winRate },
      { label: 'Rank', value: rank },
    ];

    this.replaceChildren(html`
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
          <div id="profile-friend-actions" class="flex gap-2">
            ${!isOwnProfile ? this.renderFriendActionButtons() : ''}
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              ${matchHistory.length > 0
                ? matchHistory.map(
                    (match) => html`
                      <div class="flex items-center gap-4">
                        <div
                          class="w-2 h-2 rounded-full ${match.state === MatchStatus.WIN
                            ? 'bg-primary'
                            : match.state === MatchStatus.LOSS
                            ? 'bg-destructive'
                            : 'bg-muted-foreground'}"
                        ></div>
                        <div class="flex-1">
                          <p class="text-sm font-medium">
                            ${match.state === MatchStatus.WIN
                              ? 'Won'
                              : match.state === MatchStatus.LOSS
                              ? 'Lost'
                              : 'Pending'}
                            against ${match.match_type === MatchType.AI ? 'AI' : 'Opponent'}
                          </p>
                          <p class="text-xs text-muted-foreground">
                            ${new Date(match.started * 1000).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    `
                  )
                : html`<p class="text-sm text-muted-foreground">No recent activity.</p>`}
            </div>
          </div>
        </div>
      </div>
    `);

    this.setup();
  }

  handleNotification = (event: MessageEvent) => {
    const data = JSON.parse(event.data) as NotificationData;

    const notificationTypes = [
      NotificationType.NewFriendRequest,
      NotificationType.FriendRemove,
      NotificationType.FriendRequestAccepted,
      NotificationType.FriendRequestDenied,
      NotificationType.UserBlocked,
      NotificationType.UserUnBlocked,
    ];

    if (notificationTypes.some((type) => type === data.type)) {
      this.render();
    }
  };

  connectedCallback() {
    this.render();
    pushNotificationStore.get()?.addEventListener('message', this.handleNotification);
  }

  disconnectedCallback() {
    pushNotificationStore.get()?.removeEventListener('message', this.handleNotification);
    this.cleanupCallbacks.forEach((cleanup) => cleanup());
  }
}

if (!customElements.get('profile-page')) {
  customElements.define('profile-page', ProfilePage);
}
