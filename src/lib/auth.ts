import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { Pool } from "pg";
import nodemailer from "nodemailer";

const OWNER_EMAIL = "bikashananda40@gmail.com";
const BUILD_ONLY_SECRET = "build-only-secret-not-valid-for-authentication";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://build:build@127.0.0.1:5432/build",
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isAuthConfigured = () =>
  Boolean(
    process.env.DATABASE_URL &&
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_URL &&
    process.env.SMTP_URL &&
    process.env.EMAIL_FROM
  );

export const auth = betterAuth({
  appName: "Bikash Personal OS",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? BUILD_ONLY_SECRET,
  database: pool,
  trustedOrigins: [
    "http://localhost:3000",
    "https://bikashbhattarai.com.np",
    "https://www.bikashbhattarai.com.np",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
    storage: "database",
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/magic-link") {
        const requestedEmail = typeof ctx.body?.email === "string" ? normalizeEmail(ctx.body.email) : "";
        if (requestedEmail !== OWNER_EMAIL) {
          throw new APIError("FORBIDDEN", { message: "This workspace is private." });
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (normalizeEmail(user.email) !== OWNER_EMAIL) {
            throw new APIError("FORBIDDEN", { message: "This workspace is private." });
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 300,
      disableSignUp: false,
      storeToken: "hashed",
      rateLimit: { window: 60, max: 3 },
      sendMagicLink: async ({ email, url }) => {
        if (normalizeEmail(email) !== OWNER_EMAIL) {
          throw new Error("Recipient is not an authorized owner.");
        }
        if (!process.env.SMTP_URL || !process.env.EMAIL_FROM) {
          throw new Error("Email delivery is not configured.");
        }
        const transporter = nodemailer.createTransport(process.env.SMTP_URL);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: OWNER_EMAIL,
          subject: "Your Bikash OS sign-in link",
          text: `Use this one-time link to sign in to Bikash OS. It expires in 5 minutes.\n\n${url}\n\nIf you did not request this link, ignore this email.`,
          html: `<p>Use this one-time link to sign in to Bikash OS. It expires in 5 minutes.</p><p><a href="${url}">Sign in to Bikash OS</a></p><p>If you did not request this link, ignore this email.</p>`,
        });
      },
    }),
  ],
});
