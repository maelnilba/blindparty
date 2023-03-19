import fs from "fs";
import path from "path";

// Read the contents of the .env file
const filePath = path.dirname(__filename);
const envFile = fs.readFileSync(filePath + "/.env", { encoding: "utf8" });

// Parse the contents into an object
const envVars = {};
envFile.split("\n").forEach((line) => {
  if (line.trim() !== "") {
    const [key, value] = line.split("=");
    // @ts-ignore
    envVars[key] = value;
  }
});

// Set the environment variables using the process.env object
for (const [key, value] of Object.entries(envVars)) {
  // @ts-ignore
  process.env[key] = value;
}

export default () => (() => {})();
