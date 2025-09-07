// Environment validation for local development
require("dotenv").config();

console.log("\n🔍 Environment Variables Check:");
console.log("================================");

// Database variables
console.log("📊 Database Configuration:");
console.log(`  POSTGRES_USER: ${process.env.POSTGRES_USER || "❌ NOT SET"}`);
console.log(`  POSTGRES_HOST: ${process.env.POSTGRES_HOST || "❌ NOT SET"}`);
console.log(`  POSTGRES_DB: ${process.env.POSTGRES_DB || "❌ NOT SET"}`);
console.log(
  `  POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? "✅ SET" : "❌ NOT SET"}`,
);
console.log(`  POSTGRES_PORT: ${process.env.POSTGRES_PORT || "❌ NOT SET"}`);

// Model Runner variables
console.log("\n🤖 Model Runner Configuration:");
console.log(`  OPENAI_API_URL: ${process.env.OPENAI_API_URL || "❌ NOT SET"}`);
console.log(
  `  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✅ SET" : "❌ NOT SET"}`,
);
console.log(`  OPENAI_MODEL: ${process.env.OPENAI_MODEL || "❌ NOT SET"}`);

// Application variables
console.log("\n📱 Application Configuration:");
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`  PORT: ${process.env.PORT || "3001"}`);

console.log("================================\n");

// Validate critical variables
const required = ["POSTGRES_PASSWORD", "POSTGRES_USER", "POSTGRES_DB"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missing.join(", "),
  );
  console.error("Please check your .env file and restart the application.");
  process.exit(1);
}

console.log("✅ All required environment variables are set");

// Validate password is a string
if (typeof process.env.POSTGRES_PASSWORD !== "string") {
  console.error("❌ POSTGRES_PASSWORD must be a string");
  console.error("Current type:", typeof process.env.POSTGRES_PASSWORD);
  process.exit(1);
}

console.log("✅ Environment validation passed\n");
