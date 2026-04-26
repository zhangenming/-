const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SOURCE_HTML_FILE = path.join(ROOT_DIR, "派单结算录入.html");
const SOURCE_PUBLIC_DIR = path.join(ROOT_DIR, "public");
const TARGET_HTML_FILE = path.join(DIST_DIR, "派单结算录入.html");
const TARGET_PUBLIC_DIR = path.join(DIST_DIR, "public");
const BUILD_INFO_FILE = path.join(DIST_DIR, "build-info.json");

async function main() {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });
  await fs.copyFile(SOURCE_HTML_FILE, TARGET_HTML_FILE);
  await fs.cp(SOURCE_PUBLIC_DIR, TARGET_PUBLIC_DIR, { recursive: true });
  await fs.writeFile(
    BUILD_INFO_FILE,
    `${JSON.stringify({
      builtAt: new Date().toISOString(),
      html: path.basename(SOURCE_HTML_FILE),
      publicDir: path.basename(SOURCE_PUBLIC_DIR)
    }, null, 2)}\n`,
    "utf8"
  );

  console.log(`Build completed: ${DIST_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
