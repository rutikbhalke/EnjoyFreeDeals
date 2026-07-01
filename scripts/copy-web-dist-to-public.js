const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const webDistDir = path.join(rootDir, "web", "dist");
const publicDir = path.join(rootDir, "public");

if (!fs.existsSync(webDistDir)) {
  throw new Error(`Web build output not found: ${webDistDir}`);
}

copyDirectory(webDistDir, publicDir);
console.log(`Copied web build output to ${publicDir}`);

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}
