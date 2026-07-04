import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const userRoot = path.join(rootDir, "u");
const errors = [];
const parsedJson = new Map();
const jsonFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      jsonFiles.push(fullPath);
    }
  }
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function addError(message) {
  errors.push(message);
}

walk(rootDir);

for (const file of jsonFiles) {
  try {
    parsedJson.set(file, JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (error) {
    addError(`${relative(file)}: invalid JSON (${error.message})`);
  }
}

if (!fs.existsSync(userRoot)) {
  addError("u/: missing creator root directory");
}

const creatorDirs = fs.existsSync(userRoot)
  ? fs
      .readdirSync(userRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  : [];

for (const dirName of creatorDirs) {
  if (dirName !== dirName.toLowerCase()) {
    addError(`u/${dirName}: creator directory must be lowercase`);
  }
}

const registryPath = path.join(userRoot, "registry.json");
const registry = parsedJson.get(registryPath);
const registryEntries = Array.isArray(registry?.vtubers) ? registry.vtubers : [];

if (!registry) {
  addError("u/registry.json: missing or invalid registry file");
}

const seenIds = new Set();
for (const entry of registryEntries) {
  if (!entry || typeof entry !== "object") {
    addError("u/registry.json: registry entries must be objects");
    continue;
  }

  if (typeof entry.id !== "string" || entry.id.length === 0) {
    addError("u/registry.json: every registry entry must have a non-empty string id");
    continue;
  }

  if (entry.id !== entry.id.trim()) {
    addError(`u/registry.json: id "${entry.id}" contains leading or trailing whitespace`);
  }

  if (entry.id !== entry.id.toLowerCase()) {
    addError(`u/registry.json: id "${entry.id}" must be lowercase`);
  }

  if (seenIds.has(entry.id)) {
    addError(`u/registry.json: duplicate id "${entry.id}"`);
  }

  seenIds.add(entry.id);
}

const managedDirs = creatorDirs.filter((dirName) => dirName !== "example");

for (const dirName of managedDirs) {
  const infoPath = path.join(userRoot, dirName, "info.json");
  const playlistPath = path.join(userRoot, dirName, "playlist.json");
  const bioPath = path.join(userRoot, dirName, "bio.md");
  const customPath = path.join(userRoot, dirName, "custom.html");

  if (!fs.existsSync(infoPath)) {
    addError(`u/${dirName}/info.json: missing required info file`);
    continue;
  }

  const info = parsedJson.get(infoPath);
  if (!info) continue;

  if (info.use_custom_page === true) {
    if (!fs.existsSync(customPath)) {
      addError(`u/${dirName}/custom.html: missing while use_custom_page is enabled`);
    }
    continue;
  }

  if (info.show_playlist !== false && !fs.existsSync(playlistPath)) {
    addError(`u/${dirName}/playlist.json: missing while show_playlist is enabled`);
  }

  if (info.bio === true && !fs.existsSync(bioPath)) {
    addError(`u/${dirName}/bio.md: missing while bio is enabled`);
  }
}

for (const dirName of managedDirs) {
  if (!registryEntries.some((entry) => entry?.id === dirName)) {
    addError(`u/registry.json: missing registry entry for directory "${dirName}"`);
  }
}

for (const entry of registryEntries) {
  if (!managedDirs.includes(entry.id) && entry.id !== "example") {
    addError(`u/registry.json: entry "${entry.id}" has no matching directory under u/`);
  }
}

if (errors.length > 0) {
  console.error(`Repository validation failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Repository validation passed. Checked ${jsonFiles.length} JSON files and ${managedDirs.length} creator directories.`);
