import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "hello" })
});

const port = 3000;

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
