type LazyLoadedPage = () => Promise<{ default: CustomElementConstructor }>;

type Route = {
  pathname: string;
  component: LazyLoadedPage;
  title?: string;
};

export const routes: Route[] = [
  {
    pathname: '/',
    component: () => import('./pages/home'),
  },
  {
    pathname: '/signin',
    component: () => import('./pages/auth/signin'),
    title: 'Sign-in',
  },
  {
    pathname: '/signup',
    component: () => import('./pages/auth/signup'),
    title: 'Sign-up',
  },
  {
    pathname: '/2fa/verify',
    component: () => import('./pages/auth/totp'),
    title: 'Two Factor Authentication',
  },
  {
    pathname: '/profile',
    component: () => import('./pages/user/profile'),
    title: 'Profile',
  },
  {
    pathname: '/settings',
    component: () => import('./pages/user/settings'),
    title: 'Settings',
  },
  {
    pathname: '/chat',
    component: () => import('./pages/user/chat'),
    title: 'Chat',
  },
  {
    pathname: '/leaderboard',
    component: () => import('./pages/leaderboard'),
    title: 'LeaderBoard',
  },
  {
    pathname: '/play',
    component: () => import('./pages/user/play'),
    title: 'Play',
  },
  {
    pathname: '*',
    component: () => import('./pages/not-found'),
    title: '404 - Not Found',
  },
];
