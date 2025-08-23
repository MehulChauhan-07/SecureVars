#!/usr/bin/env node
import readline from "readline";
import { hashPassword } from "../src/utils/encryption.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

rl.question("Enter new master password (min 12 chars): ", async (pwd) => {
  if (!pwd || pwd.length < 12) {
    console.error("Password must be at least 12 characters.");
    rl.close();
    process.exit(1);
  }
  try {
    const hash = await hashPassword(pwd);
    console.log("\nAdd this to your .env file (replace existing line):");
    console.log(`MASTER_PASSWORD_HASH=${hash}`);
  } catch (e) {
    console.error("Failed to hash password:", e.message);
    process.exit(1);
  } finally {
    rl.close();
  }
});
