const { execSync } = require("child_process");

const name = process.argv[2];

if (!name) {
  console.error("Please give a name for the migration: npm run -- <name>");
  process.exit(1);
}

execSync(
  `npx typeorm-ts-node-commonjs migration:generate src/migrations/${name} -d src/data-source.ts`,
  { stdio: "inherit" }
);
