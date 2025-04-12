import type { Todo } from "../types"
import { Collection } from '@signaldb/core'
import createLocalStorageAdapter from '@signaldb/localstorage'
import svelteReactivityAdapter from '@signaldb/svelte'
import syncManager from "./syncManager"

const Todos = new Collection<Todo>({
  persistence: createLocalStorageAdapter('todos-svelte'),
  reactivity: svelteReactivityAdapter
})

syncManager.addCollection(Todos, {
  name: "todos",
});

syncManager.syncAll()

export default Todos;
