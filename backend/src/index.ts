import type { Todo } from "./types.ts";

import process from "node:process";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import serveStatic from "serve-static";

import { SSEHub } from "./SSEHub.ts";
import { createTodoStore } from "./TodoStore.ts";
import { validateId, validatePutTodoData } from "./middlewares.ts";


function createEvent(
  action: "created" | "updated" | "deleted",
  type: "todo",
  item: Todo | { id: string }
) {
  return { action, type, item }
}

const app = express()
  .use(morgan("dev"));
const api = express.Router()
  .use(bodyParser.json());

const sseHub = new SSEHub();
const todoStore = createTodoStore();

if (process.env.NODE_ENV === "production") {
  app.use(serveStatic("dist"));
} else {
  api.use(cors());
}

api.get("/events", (req, res) => {
  sseHub.subscribe(res);
});

api.get("/todos", (req, res) => {
  res.json(todoStore.getAll());
});

api.put("/todos/:id", validateId, validatePutTodoData, (req, res) => {
  const { id } = req.params;
  const { text, done } = req.body;

  const todo = { id, text, done: done ?? false };

  const created = todoStore.put(todo);

  if (created) {
    res.status(201).json(todo)
    sseHub.broadcast("change", createEvent("created", "todo", todo));
  } else {
    res.status(200).json(todo)
    sseHub.broadcast("change", createEvent("updated", "todo", todo));
  }
});

api.delete("/todos/:id", validateId, (req, res) => {
  const { id } = req.params;

  const deleted = todoStore.delete(id);

  if (deleted) {
    res.sendStatus(204);
    sseHub.broadcast("change", createEvent("deleted", "todo", { id }));
  } else {
    res.status(400).json({ error: "Not found" })
  }
});

app.use("/api", api);

const port = 3000;

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
