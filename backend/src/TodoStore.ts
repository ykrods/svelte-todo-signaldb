import type { Todo } from "./types.ts";

export class TodoStore {
  items: Todo[]

  constructor() {
    this.items = [];
  }

  getAll() {
    return this.items;
  }


  put(item: Todo) {
    const idx = this.items.findIndex(t => t.id === item.id);
    if (idx === -1) {
      this.items.push(item);
    } else {
      this.items[idx] = item;
    }
    return idx === -1;
  }

  delete(id: string) {
    const idx = this.items.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
    }
    return idx !== -1;
  }
}

export function createTodoStore() {
  return new TodoStore();
}
