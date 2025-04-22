import { getUser } from "./api/user";
import "./style.css";
import.meta.glob("./components/**/*.ts", { eager: true });
import.meta.glob("./pages/**/*.ts", { eager: true });

async function main() {
  window._currentUser = await getUser();
  const root = document.querySelector("#app");
  if (!root) throw Error("App Root Not Found!");

  root.replaceChildren(document.createElement("app-router"));
}

document.addEventListener("DOMContentLoaded", async () => {
  await main();
});
