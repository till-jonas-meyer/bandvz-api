import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "./routes";
import "reflect-metadata";
import type { ErrorRequestHandler } from "express";
import { HttpError } from "./httpError";
import path from 'path';
import cookieParser from "cookie-parser";
import cors from 'cors';
import 'dotenv/config';

export const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

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

  console.error(err);

  res.status(500).json({
    message: "Interner Serverfehler",
  });
}

app.use(cookieParser());

RegisterRoutes(app);

app.use(errorRequestHandler);

app.get('/openapi/swagger.json', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'swagger.json'));
});
