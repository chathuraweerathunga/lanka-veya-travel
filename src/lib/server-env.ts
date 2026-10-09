import "server-only";

/** Server-only secrets. Importing this from a Client Component fails the build. */
export const serverEnv = {
  supabaseSecretKey: () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null,
  resendApiKey: () => process.env.RESEND_API_KEY || null,
  emailFrom: () => process.env.EMAIL_FROM || null,
  /** Salt used to hash visitor IPs for rate limiting (never stores raw IPs). */
  rateLimitSalt: () => process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "lvt-dev-salt",
};
