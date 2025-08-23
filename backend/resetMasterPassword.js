import fs from "fs/promises";
import dotenv from "dotenv";
import path from "path";

async function resetMasterPassword() {
  try {
    // Load .env file
    dotenv.config();
    console.log(
      "Current state: Master password is",
      process.env.MASTER_PASSWORD_HASH ? "set" : "not set"
    );

    // Read the .env file
    const envFilePath = path.resolve(".env");
    const envFile = await fs.readFile(envFilePath, "utf8");

    // Create updated content with MASTER_PASSWORD_HASH commented out
    const updatedContent = envFile.replace(
      /^MASTER_PASSWORD_HASH=.*$/m,
      "# MASTER_PASSWORD_HASH has been reset"
    );

    // Write back to .env file
    await fs.writeFile(envFilePath, updatedContent, "utf8");
    console.log("Master password has been reset in .env file");
    console.log("You can now initialize a new master password");
  } catch (error) {
    console.error("Error resetting master password:", error.message);
  }
}

resetMasterPassword();
