import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  user: {
    modelName: "users",
    additionalFields: {
      themeMode: {
        type: "string",
        required: false,
        defaultValue: "light",
      },
      accentColor: {
        type: "string",
        required: false,
        defaultValue: "blue",
      },
      title: {
        type: "string",
        required: false,
      },
      username: {
        type: "string",
        required: false,
      },
      isGuest: {
        type: "boolean",
        required: false,
        defaultValue: false,
      }
    }
  }
});
