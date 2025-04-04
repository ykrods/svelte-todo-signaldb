import type { Response } from "express";

export class SSEHub {
  subscribers: Response[]
  constructor() {
    this.subscribers = [];
  }

  static payload(name: string, data = {}) {
    return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  subscribe(res: Response) {
    console.log("[SSEHub] add subscriber");
    this.subscribers.push(res);

    res.set({
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    res.flushHeaders();
    res.write(SSEHub.payload("connected"));

    res.on("close", () => {
      console.log("[SSEHub] remove subscriber");
      res.end();
      this.cleanup();
    });
  }

  cleanup() {
    this.subscribers = this.subscribers.filter(res => !res.writableEnded);
  }

  broadcast(name: string, data = {}) {
    this.cleanup();
    for (const res of this.subscribers) {
      res.write(SSEHub.payload(name, data));
    }
  }
}
