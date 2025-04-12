import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { createTodoStore } from './TodoStore'

const todoStore = createTodoStore()

export { SSEHub } from "./SSEHub"

function getSSEHubStub(c) {
  const objectId = c.env.SSE_HUB.idFromName("shared")
  const stub = c.env.SSE_HUB.get(objectId)
  return stub
}

const app = new Hono()
app.use(logger())


app.get('/api/events', async (c) => {
  const stub = getSSEHubStub(c)

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

todos.get('/', (c) => c.json(todoStore.getAll()))

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

    const created = todoStore.put(todo);
    if (created) {
      c.status(201)
      getSSEHubStub(c).publishChange(todo)
      return c.json(todo)
    } else {
      c.status(200)
      getSSEHubStub(c).publishChange(todo)
      return c.json(todo)
    }
  },
)

todos.delete('/:id{[A-Za-z0-9]{1,32}}', (c) => {
  const { id } = c.req.param()
  const deleted = todoStore.delete(id)

  if (deleted) {
    c.status(204)
    getSSEHubStub(c).publishChange({ id })
    return c.body(null)
  } else {
    c.status(404)
    return c.json({ error: 'Not found' })
  }
})


app.route('/api/todos', todos)

export default app
