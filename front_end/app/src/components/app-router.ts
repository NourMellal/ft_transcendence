import { getUser } from "~/api/user";
import { routes } from "~/routes";

function normalizePath(path: string) {
  let normalized = path.replace(/\/{2,}/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function navigateTo(pathname: string) {
  getUser().then((user) => {
    window._currentUser = user;
    const appRouter = document.querySelector("app-router") as AppRouter | null;

    // Split pathname and search params
    const [path, search] = pathname.split("?");
    const normalizedPath = normalizePath(path);
    const currentPath = normalizePath(window.location.pathname);
    const currentSearch = window.location.search;

    // Only update if path or search params have changed
    if (normalizedPath !== currentPath || search !== currentSearch.slice(1)) {
      const newUrl = search ? `${normalizedPath}?${search}` : normalizedPath;
      window.history.pushState(
        { pathname: normalizedPath, search },
        "",
        newUrl
      );
    }

    appRouter?.renderPage();
  });
}

class AppRouter extends HTMLElement {
  constructor() {
    super();
  }

  renderPage = () => {
    const route = normalizePath(window.location.pathname);
    const match = routes.find((r) => {
      if (r.pathname === "*") return true;
      return r.pathname === route;
    });

    if (match) {
      document.title = match.title ?? "ft_transcendence";
      const element = document.createElement(match.component);
      this.replaceChildren(element);
    }
  };

  onLinkClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest("a");
    if (!anchor) return;

    if (
      anchor.target === "_blank" ||
      anchor.hasAttribute("download") ||
      anchor.getAttribute("rel") === "external" ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const href = anchor.href;
    const origin = window.location.origin;

    if (href.startsWith(origin)) {
      event.preventDefault();
      if (
        anchor.pathname !== window.location.pathname ||
        anchor.search !== window.location.search
      ) {
        navigateTo(href.replace(origin, ""));
      }
    }
  };

  connectedCallback() {
    this.addEventListener("click", this.onLinkClick);
    window.addEventListener("popstate", this.renderPage);
    navigateTo(window.location.pathname + window.location.search);
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.renderPage);
  }
}

customElements.define("app-router", AppRouter);
