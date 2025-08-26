<script lang="ts">
  import githubLogo from "./assets/github-mark.svg"
  import trash from "./assets/heroicons/24/outline/trash.svg";

  import type { Todo } from "../types";
  import type { FilterType } from "./types";

  import { tick } from "svelte";
  import { slide } from "svelte/transition";
  import { Button, Checkbox } from "bits-ui";

  import Todos from "./lib/Todos.svelte"

  const filterMap: Record<FilterType, any> = {
    all: {},
    done: { done: true },
    active: { done: false },
  }

  let newItemText: string = $state("")

  let filterType: FilterType = $state("all")
  let filter = $derived(filterMap[filterType])
  // for transition
  let duration = $state(0)

  let items = $derived(Todos.find(filter).fetch())

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
<main class="mx-3 max-w-xl mx-auto flex flex-col min-h-svh">
  <div class="absolute top-5 right-3">
    <a href="https://github.com/ykrods/svelte-todo-signaldb" target="_blank" rel="noreferrer">
      <img src={githubLogo} class="size-8" alt="move to github repository" />
    </a>
  </div>
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
      <li class="flex gap-3 mx-3 my-1" transition:slide={{ duration }}>
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
          <img src={trash} class="size-5" alt="trash" />
        </button>
      </li>
    {/each}
  </ul>

  <div class="flex justify-center my-3">
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
