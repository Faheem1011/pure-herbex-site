import { existsSync } from "fs";

if (!existsSync("out/index.html")) {
  console.error(
    "ERROR: out/index.html missing — static export did not run. Hostinger needs the out/ folder."
  );
  process.exit(1);
}

console.log("Static export OK: out/index.html exists");
