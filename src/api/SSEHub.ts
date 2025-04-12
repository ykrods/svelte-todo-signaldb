import type { Todo } from "../types"


export class SSEHub {
  sessions = new Map<string, SSESession>()

  async subscribe(id: string) {
    if (!this.sessions.has(id)) {
      const { readable, writable } = new TransformStream()

      const timeoutId = setTimeout(async () => {
        if (this.sessions.has(id)) {
          const { writable } = this.sessions.get(id)!
          this.sessions.delete(id)
          try {
            const writer = writable.getWriter()
            await writer.close() // force close
          } catch(e) {
            console.error(e)
          }
        }
      }, 1000 * 600)

      this.sessions.set(id, { id, timeoutId, readable, writable })
    }

    return this.sessions.get(id)!.readable
  }

  payload({ event, data }: SSEMessage<any>): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  }

  async broadcast<T>(message: SSEMessage<T>) {
    const encoder = new TextEncoder()

    const survivors = new Map<string, SSESession>()
    for (const session of this.sessions.values()) {
      const writer = session.writable.getWriter()

      try {
        await writer.write(encoder.encode(this.payload(message)))
        survivors.set(session.id, session)
        console.log("sent to", session.id, message)
      } catch (e) {
        console.error(e)
        writer.close()
        clearTimeout(session.timeoutId)
      } finally {
        writer.releaseLock()
      }
    }
    this.sessions = survivors
  }
}
