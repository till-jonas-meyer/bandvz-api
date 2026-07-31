import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./routes";
import "reflect-metadata";
import type { ErrorRequestHandler } from "express";
import { HttpError } from "./httpError";

export const app = express();

// Use body parser to read sent json payloads
app.use(
  urlencoded({
    extended: true,
  })
);
app.use(json());

const errorRequestHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    console.error('HTTP error', err.status, ':', err.message);
    return res.status(err.status).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: "Interner Serverfehler",
  });
}

RegisterRoutes(app);

app.use(errorRequestHandler);
