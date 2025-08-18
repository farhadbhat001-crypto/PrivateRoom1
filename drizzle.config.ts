import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.development.local", ".env.local", ".env"] });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/database.sqlite",
  },
});
