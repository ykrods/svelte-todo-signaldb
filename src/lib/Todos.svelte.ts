import { Collection } from '@signaldb/core'
import createLocalStorageAdapter from '@signaldb/localstorage'
import svelteReactivityAdapter from '@signaldb/svelte'
import syncManager from "./syncManager"
import { createSubscriber } from "svelte/reactivity";

const Todos = new Collection<Todo>({
  persistence: createLocalStorageAdapter('todos-svelte'),
  reactivity: {
    create() {
      let _update;
      const subscribe = createSubscriber((update) => {
        _update = update;
      });
      return {
        depend() {
          subscribe()
        },
        notify() {
          _update?.();
        },
      };
    },
    isInScope: () => !!$effect.tracking(),
  }
})

syncManager.addCollection(Todos, {
  name: "todos",
});

syncManager.syncAll()

export default Todos;
