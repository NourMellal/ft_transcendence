import { fetchFriendRequests } from './api/friends';
import { closeNotificationSocket, setupNotificationsSocket } from './api/notifications';
import { fetchUserInfo } from './api/user';
import { friendRequests, notifications, user } from './app-state';
import './style.css';
import { handleEffect } from './utils';

function initTheme() {
  let isDarkMode = true;
  if (window.localStorage.getItem('theme')) {
    isDarkMode = window.localStorage.getItem('theme') === 'dark';
  } else {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  handleEffect(document.body, async () => {
    user.set(await fetchUserInfo());
    if (user.get() !== null) {
      await setupNotificationsSocket();
      friendRequests.set(await fetchFriendRequests());
    }

    user.subscribe((u) => {
      if (u === null) {
        closeNotificationSocket();
        friendRequests.set(null);
        notifications.set(null);
      }
    });

    const root = document.querySelector('#app');
    if (!root) throw Error('App Root Not Found!');

    root.replaceChildren(document.createElement('app-router'));
  });
});
