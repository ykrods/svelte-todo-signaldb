<script lang="ts">
  import { tick } from "svelte";
  import { slide } from "svelte/transition";

  import { Collection } from '@signaldb/core'
  import createLocalStorageAdapter from '@signaldb/localstorage'
  import svelteReactivityAdapter from '@signaldb/svelte'
  import { Button, Checkbox } from "bits-ui";

  interface Todo {
    id: string
    text: string
    done: boolean
  }
  type FilterType = "all" | "active" | "done"

  let dep = $state(0);

  const Todos = new Collection<Todo>({
    persistence: createLocalStorageAdapter('todos'),
    reactivity: svelteReactivityAdapter,
  })

  const filterMap: Record<FilterType, any> = {
    all: {},
    done: { done: true },
    active: { done: false },
  }

  let newItemText: string = $state("")

  let items: Todo[] = $state.raw([])
  let filterType: FilterType = $state("all")
  let filter = $derived(filterMap[filterType])
  // for transition
  let duration = $state(0)

  $effect(() => {
    const cursor = Todos.find(filter)
    items = cursor.fetch()

    return () => {
      cursor.cleanup()
    };
  });

  $inspect(items)

  async function trans(operation: () => any) {
    duration = 300
    await operation()
    await tick()
    duration = 0
  }

  function addTodo() {
    trans(() => {
      if (0 < newItemText.length) {
        const postId = Todos.insert({ text: newItemText, done: false })
        newItemText = ""
      }
    })
  }

  async function toggleTodo(todo: Todo) {
    trans(() => {
      Todos.updateOne({ id: todo.id }, {
        $set: { done: !todo.done },
      })
    })
  }

  async function removeTodo(todo: Todo) {
    trans(() => {
      Todos.removeOne({ id: todo.id })
    })
  }
</script>
<main class="max-w-xl mx-auto flex flex-col h-screen">
  <h1 class="m-5 text-3xl font-bold text-center">Todo</h1>
  <div class="flex gap-3 m-3">
    <label class="input flex-1">
      <input
        type="text"
        placeholder="Add todo.."
        bind:value={newItemText}
        onkeydown={(e) => { (e.key === "Enter") && addTodo() }}
      />
      <kbd class="kbd kbd-sm">↩︎</kbd>
    </label>
    <Button.Root
      class="btn"
      onclick={addTodo}
      disabled={ newItemText === "" }
    >Add</Button.Root>
  </div>

  <ul class="flex-1 overflow-y-auto">
    {#each items as todo (todo.id)}
      <li class="flex gap-3 m-1" transition:slide={{ duration }}>
        <label class="fieldset-label flex-1">
          <Checkbox.Root
            class="checkbox"
            checked={todo.done}
            onCheckedChange={() => toggleTodo(todo)}
          >
          </Checkbox.Root>
          <span class:line-through={todo.done}>{ todo.text }</span>
        </label>
        <button
          class="btn btn-outline btn-circle"
          onclick={() => removeTodo(todo)}
        >
          <!-- https://heroicons.com/ -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
          </svg>
        </button>
      </li>
    {/each}
  </ul>

  <div class="flex justify-center m-3">
    <div class="join">
      {#each ["all", "active", "done"] as value}
        <input
          class="join-item btn"
          type="radio"
          name="filterType"
          aria-label={value}
          bind:group={filterType}
          {value}
        />
      {/each}
    </div>
  </div>
</main>
