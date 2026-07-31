import { DataSource } from "typeorm";
import "dotenv/config";
import { User } from "./entities/user/User";

let error = false;

if (!process.env.DB_HOST ||
  !process.env.DB_PORT ||
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_NAME) {
  console.error('Error: Database credentials are incomplete in the .env file.');
  error = true;
}

if (Number.isNaN(Number(process.env.DB_PORT))) {
  console.error('Error: Port in database credentials in .env file is not a number.');
  error = true;
}

if (error) {
  process.exit(0);
}

// "src/entities/**/*{.js,.ts}", "dist/entities/**/*{.js,.ts}"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  // The __dirname is important, so that the directory can be accessed at runtime!
  entities: [__dirname + "/entities/**/*{.js,.ts}"],
  subscribers: [],
  migrations: [__dirname + "/migrations/*.ts"],
});
