import { User } from "./api/user";
import { createStateStore } from "./lib/state";

const user = createStateStore<User | null>(null);

export { user };
