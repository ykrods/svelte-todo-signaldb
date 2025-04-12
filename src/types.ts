export interface Todo {
  id: string
  text: string
  done: boolean
}
export type FilterType = "all" | "active" | "done"


export interface SSESession {
  id: string,
  timeoutId: ReturnType<typeof setTimeout>
  readable: ReadableStream
  writable: WritableStream
}

export interface SSEMessage<T = Record<string, any>> {
  event: string
  data: T
}
