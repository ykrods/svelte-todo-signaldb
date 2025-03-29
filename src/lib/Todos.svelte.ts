import { Collection } from '@signaldb/core'
import createLocalStorageAdapter from '@signaldb/localstorage'
import svelteReactivityAdapter from '@signaldb/svelte'

const Todos = new Collection<Todo>({
  persistence: createLocalStorageAdapter('todos'),
  reactivity: svelteReactivityAdapter,
})

export default Todos;
