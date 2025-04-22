import { routes } from "~/routes";

function normalizePath(path: string) {
  let normalized = path.replace(/\/{2,}/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function navigateTo(pathname: string) {
  const appRouter = document.querySelector("app-router") as AppRouter | null;
  if (pathname !== normalizePath(window.location.pathname)) {
    window.history.pushState({ pathname }, "", pathname);
  }
  appRouter?.renderPage();
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
      this.childNodes.forEach((child) => child.remove());
      this.appendChild(element);
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
      if (anchor.pathname !== window.location.pathname) {
        navigateTo(href.replace(origin, ""));
      }
    }
  };

  connectedCallback() {
    this.addEventListener("click", this.onLinkClick);
    window.addEventListener("popstate", this.renderPage);
    navigateTo(window.location.pathname);
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.renderPage);
  }
}

customElements.define("app-router", AppRouter);
