import { closeNotificationSocket } from './api/notifications';
import { setupUser } from './api/user';
import { friendRequestsState, notificationsState, userState } from './app-state';
import { handleEffect } from './utils';

import '~/components/toast';
import '~/components/dialog';

function initTheme() {
  let isDarkMode = true;
  if (window.localStorage.getItem('theme')) {
    isDarkMode = window.localStorage.getItem('theme') === 'dark';
  } else {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  handleEffect(document.body, async () => {
    await setupUser();

    userState.subscribe((u) => {
      if (u === null) {
        closeNotificationSocket();
        friendRequestsState.set(null);
        notificationsState.set(null);
      }
    });

    const root = document.querySelector('#app');
    if (!root) throw Error('App Root Not Found!');

    root.replaceChildren(document.createElement('app-router'));
  });
});
