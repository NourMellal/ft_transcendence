import '~/components/app-loader';
import '~/components/toast';
import '~/components/dialog';
import '~/components/navbar/navigation-bar';
import '~/components/app-router';

import { closeNotificationSocket } from './api/notifications';
import { setupUser } from './api/user';
import {
  friendRequestsStore,
  notificationsStore,
  userStore,
} from './app-state';
import { html } from './lib/html';

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

document.addEventListener('DOMContentLoaded', async () => {
  await setupUser();
  initTheme();

  userStore.subscribe((u) => {
    if (u === null) {
      closeNotificationSocket();
      friendRequestsStore.set(null);
      notificationsStore.set(null);
    }
  });

  const root = document.querySelector('#app');
  if (!root) throw Error('App Root Not Found!');

  root.replaceChildren(html`
    <navigation-bar></navigation-bar>
    <app-router></app-router>
  `);
});
