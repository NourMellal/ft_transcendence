type Route = {
  pathname: string;
  component: string;
  title?: string;
};

export const routes: Route[] = [
  {
    pathname: "/",
    component: "home-page",
  },
  {
    pathname: "/signin",
    component: "signin-page",
    title: "Sign-in",
  },
  {
    pathname: "/signup",
    component: "signup-page",
    title: "Sign-up",
  },
  {
    pathname: "/profile",
    component: "profile-page",
    title: "Profile",
  },
  {
    pathname: "/settings",
    component: "settings-page",
    title: "Settings",
  },
  {
    pathname: "/leaderboard",
    component: "leaderboard-page",
    title: "LeaderBoard",
  },
  {
    pathname: "/play",
    component: "play-page",
    title: "Play",
  },
  {
    pathname: "*",
    component: "not-found",
    title: "404 - Not Found",
  },
];
