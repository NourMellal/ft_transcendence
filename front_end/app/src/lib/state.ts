type Subscriber<T> = (state: T) => void;
type Unsubscribe = () => void;
type UpdateFn<T> = (prevState: T) => T;

export interface StateStore<T> {
  get: () => T;
  subscribe: (listener: Subscriber<T>) => Unsubscribe;
  set: (newStateOrUpdateFn: T | UpdateFn<T>) => void;
}

export function createStateStore<T>(initialState: T): StateStore<T> {
  let state: T = initialState;
  const subscribers: Set<Subscriber<T>> = new Set();

  const get = (): T => {
    return state;
  };

  const subscribe = (listener: Subscriber<T>): Unsubscribe => {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  };

  const set = (newStateOrUpdateFn: T | UpdateFn<T>): void => {
    const newState =
      typeof newStateOrUpdateFn === 'function'
        ? (newStateOrUpdateFn as UpdateFn<T>)(state)
        : newStateOrUpdateFn;

    state = newState;

    subscribers.forEach((listener) => listener(state));
  };

  return {
    get,
    subscribe,
    set,
  };
}
