import { getUser } from "./api/user";
import "./style.css";
import { handleEffect } from "./utils";
import.meta.glob("./components/**/*.ts", { eager: true });
import.meta.glob("./pages/**/*.ts", { eager: true });

document.addEventListener("DOMContentLoaded", () => {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark");
  }

  handleEffect(document.body, async () => {
    window._currentUser = await getUser();
    const root = document.querySelector("#app");
    if (!root) throw Error("App Root Not Found!");

    root.replaceChildren(document.createElement("app-router"));
  });
});
