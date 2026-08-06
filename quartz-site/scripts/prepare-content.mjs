import { execFile as execFileCallback } from "node:child_process"
import { cp, lstat, mkdir, readdir, readFile, rm, utimes } from "node:fs/promises"
import { promisify } from "node:util"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const siteRoot = path.resolve(scriptDir, "..")
const vaultRoot = path.resolve(siteRoot, "..")
const contentRoot = path.join(siteRoot, "content")
const siteIndex = path.join(siteRoot, "site-content", "index.md")
const execFile = promisify(execFileCallback)

// These names are never part of the published vault, at any depth.
const excludedDirectories = new Set([
  ".git",
  ".github",
  ".obsidian",
  ".quartz",
  ".turbo",
  ".cache",
  "node_modules",
  "public",
  "quartz-site",
  "dist",
  "build",
  "coverage",
])
const excludedFiles = new Set([".DS_Store", "Thumbs.db"])
const markdownFiles = []
const assetFiles = []

function relativeToVault(filePath) {
  const relativePath = path.relative(vaultRoot, filePath)
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to copy a path outside the vault: ${filePath}`)
  }
  return relativePath
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excludedFiles.has(entry.name)) continue
    const fullPath = path.join(directory, entry.name)
    const stat = await lstat(fullPath)

    if (stat.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported in published content: ${fullPath}`)
    }
    if (stat.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) await walk(fullPath)
      continue
    }
    if (!stat.isFile()) continue

    if (entry.name.toLowerCase().endsWith(".md")) {
      markdownFiles.push(fullPath)
    } else {
      assetFiles.push(fullPath)
    }
  }
}

async function copyIntoContent(filePath, destinationRelativePath = relativeToVault(filePath)) {
  const destination = path.join(contentRoot, destinationRelativePath)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(filePath, destination, { force: true, errorOnExist: false })
  const modifiedTime = await sourceModifiedTime(filePath)
  await utimes(destination, modifiedTime, modifiedTime)
}

async function sourceModifiedTime(filePath) {
  try {
    const relativePath = relativeToVault(filePath)
    const { stdout } = await execFile("git", ["-C", vaultRoot, "log", "-1", "--format=%cI", "--", relativePath])
    const commitTime = new Date(stdout.trim())
    if (!Number.isNaN(commitTime.getTime())) return commitTime
  } catch {
    // Files newly added to a working tree have no Git timestamp yet.
  }
  return (await lstat(filePath)).mtime
}

function cleanReference(reference) {
  return decodeURIComponent(
    reference
      .trim()
      .replace(/^<|>$/g, "")
      .split("|")[0]
      .split("#")[0]
      .split("?")[0],
  )
}

function referencedPaths(markdownPath, markdown) {
  const references = new Set()
  const add = (reference) => {
    const cleaned = cleanReference(reference)
    if (
      cleaned &&
      !cleaned.startsWith("#") &&
      !/^(?:https?:|mailto:|data:|tel:)/i.test(cleaned)
    ) {
      references.add(cleaned)
    }
  }

  // Obsidian embeds/links, for example ![[attachments/photo.png|300]].
  for (const match of markdown.matchAll(/!?\[\[([^\]]+)\]\]/g)) add(match[1])
  // Markdown links and images. This also captures referenced PDFs and other assets.
  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) add(match[1])

  return [...references].map((reference) => ({
    reference,
    sourceDirectory: path.dirname(markdownPath),
  }))
}

function resolveAssets({ reference, sourceDirectory }) {
  const normalized = path.normalize(reference.replaceAll("/", path.sep))
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) return []

  const candidates = [path.resolve(sourceDirectory, normalized), path.resolve(vaultRoot, normalized)]
  const exactMatches = assetFiles.filter((asset) => candidates.includes(asset))
  if (exactMatches.length > 0) return exactMatches

  // Obsidian permits links such as ![[Pasted image 2026.png]] without a path.
  if (!reference.includes("/") && !reference.includes("\\")) {
    return assetFiles.filter((asset) => path.basename(asset) === path.basename(normalized))
  }
  return []
}

async function main() {
  await rm(contentRoot, { recursive: true, force: true })
  await mkdir(contentRoot, { recursive: true })
  await walk(vaultRoot)

  const referencedAssets = new Set()
  for (const markdownPath of markdownFiles) {
    const markdown = await readFile(markdownPath, "utf8")
    await copyIntoContent(markdownPath)
    for (const reference of referencedPaths(markdownPath, markdown)) {
      for (const asset of resolveAssets(reference)) referencedAssets.add(asset)
    }
  }
  for (const asset of referencedAssets) await copyIntoContent(asset)

  await copyIntoContent(siteIndex, "index.md")
  console.log(`Prepared ${markdownFiles.length} Markdown files and ${referencedAssets.size} referenced assets.`)
}

await main()
