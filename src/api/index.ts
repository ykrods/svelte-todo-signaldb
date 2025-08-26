import type { Todo } from "../types"

import { DurableObject } from "cloudflare:workers"

import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { SSEHub } from "./SSEHub"

export class TodoStore extends DurableObject {
  private sseHub = new SSEHub()
  private sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql

    this.sql.exec(`CREATE TABLE IF NOT EXISTS todos(
      id TEXT PRIMARY KEY,
      text TEXT,
      done INTEGER
    );`)
  }

  getAll() {
    const cursor = this.sql.exec(`SELECT * FROM todos`)
    return [...cursor].map((row) => ({
      id: row.id,
      text: row.text,
      done: row.done === 1,
    }))
  }

  put(item: Todo): boolean {
    const cursor = this.sql.exec(
      `INSERT INTO todos (id, text, done) VALUES(?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET text=?, done=?
      `,
      item.id, item.text, item.done ? 1 : 0,
      item.text, item.done ? 1 : 0,
    )
    // return true if created
    return cursor.rowsRead === 0
  }

  delete(id: string): boolean {
    const cursor = this.sql.exec(`DELETE FROM todos WHERE id = ?`, id)
    // return true if deleted
    return cursor.rowsWritten === 1
  }

  async subscribe(id: string) {
    return this.sseHub.subscribe(id)
  }

  async publishChange(data: Todo | { id: string }) {
    await this.sseHub.broadcast({
      event: "change",
      data,
    })
  }
}

function getTodoStoreStub(c) {
  const objectId = c.env.TODO_STORE.idFromName("shared")
  const stub = c.env.TODO_STORE.get(objectId)
  return stub
}

const app = new Hono()
app.use(logger())


app.get('/api/events', async (c) => {
  const stub = getTodoStoreStub(c)

  const id = (new Date()).getTime().toString()
  const readable = await stub.subscribe(id)

  return streamSSE(c, async (stream) => {
    stream.onAbort(() => console.log("aborted!"))

    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ id }),
    })

    await stream.pipe(readable)
  })
})

const todos = new Hono()

todos.get('/', async (c) => {
  const todos = await getTodoStoreStub(c).getAll()
  return c.json(todos)
})

todos.put(
  '/:id{[A-Za-z0-9]{1,32}}',
  zValidator(
    'json',
    z.object({
      id: z.string().max(32).regex(/^[a-zA-Z0-9]+$/),
      text: z.string().max(127),
      done: z.boolean().optional().default(false),
    }),
  ),
  async (c) => {
    const { id } = c.req.param()
    const todo = c.req.valid('json')

    if (id !== todo.id) {
      c.status(400)
      return c.json({ error: "invalid" })
    }

    const created = await getTodoStoreStub(c).put(todo);
    if (created) {
      c.status(201)
      await getTodoStoreStub(c).publishChange(todo)
      return c.json(todo)
    } else {
      c.status(200)
      await getTodoStoreStub(c).publishChange(todo)
      return c.json(todo)
    }
  },
)

todos.delete('/:id{[A-Za-z0-9]{1,32}}', async (c) => {
  const { id } = c.req.param()
  const deleted = await getTodoStoreStub(c).delete(id)

  if (deleted) {
    c.status(204)
    await getTodoStoreStub(c).publishChange({ id })
    return c.body(null)
  } else {
    c.status(404)
    return c.json({ error: 'Not found' })
  }
})


app.route('/api/todos', todos)

export default app
