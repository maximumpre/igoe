#!/usr/bin/env node
/**
 * verify-keyword-preservation.mjs
 *
 * Absolute Keyword Preservation gate (Step 5 §2). Every keyword in the baseline
 * snapshot must still resolve from `buildSiteKeywords()` (the meta list that feeds
 * `<meta name="keywords">`). Host tokens may move out of the visible body, but they
 * must never disappear from the meta list.
 *
 * Usage:
 *   node scripts/verify-keyword-preservation.mjs                 # verify working tree
 *   node scripts/verify-keyword-preservation.mjs --write-baseline # snapshot git HEAD
 *
 * Baseline file: seo-keyword-baseline.json (project root). The snapshot is evaluated
 * from git HEAD sources so it reflects the pre-change keyword system, not the tree.
 */

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const ts = require("typescript")

const ROOT = process.cwd()
const BASELINE_PATH = path.join(ROOT, "seo-keyword-baseline.json")
const WRITE_BASELINE = process.argv.includes("--write-baseline")
const MIN_TOTAL = 60
const MIN_VISIBLE = 25

function readHeadFile(rel) {
  return execFileSync("git", ["show", `HEAD:${rel}`], { cwd: ROOT, encoding: "utf8" })
}

function readWorkingFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8")
}

/** Evaluate `lib/seo-keywords.ts` + `lib/site-url.ts` from the given source strings. */
function evaluateKeywordModule(keywordsSrc, siteUrlSrc) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kw-verify-"))
  const compile = (src) =>
    ts.transpileModule(src.replace(/["']@\/lib\/site-url["']/g, '"./site-url.cjs"'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
  fs.writeFileSync(path.join(dir, "site-url.cjs"), compile(siteUrlSrc))
  fs.writeFileSync(path.join(dir, "seo-keywords.cjs"), compile(keywordsSrc))
  const mod = require(path.join(dir, "seo-keywords.cjs"))
  const siteUrl = require(path.join(dir, "site-url.cjs"))
  const keywords = mod.buildSiteKeywords()
  const visible = keywords.filter(
    (k) => ![siteUrl.CANONICAL_HOST, siteUrl.CANONICAL_HOST.replace(/^www\./, "")]
      .some((h) => k.toLowerCase().includes(h.toLowerCase())),
  )
  fs.rmSync(dir, { recursive: true, force: true })
  return { keywords, visible }
}

function sameKeyword(a, b) {
  return a.toLowerCase() === b.toLowerCase()
}

if (WRITE_BASELINE) {
  const { keywords } = evaluateKeywordModule(
    readHeadFile("lib/seo-keywords.ts"),
    readHeadFile("lib/site-url.ts"),
  )
  const baseline = {
    snapshot: "git HEAD lib/seo-keywords.ts + lib/site-url.ts (pre-Step-5 expansion)",
    count: keywords.length,
    keywords,
  }
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8")
  console.log(`Baseline written: ${keywords.length} keywords -> seo-keyword-baseline.json`)
  process.exit(0)
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error("FAIL: seo-keyword-baseline.json missing. Run with --write-baseline on a clean HEAD.")
  process.exit(1)
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
const current = evaluateKeywordModule(
  readWorkingFile("lib/seo-keywords.ts"),
  readWorkingFile("lib/site-url.ts"),
)

const missing = baseline.keywords.filter((k) => !current.keywords.some((c) => sameKeyword(c, k)))
const added = current.keywords.filter((c) => !baseline.keywords.some((k) => sameKeyword(k, c)))
const failures = []

if (missing.length) {
  failures.push(`${missing.length} baseline keyword(s) removed: ${missing.join(" | ")}`)
}
if (current.keywords.length < MIN_TOTAL) {
  failures.push(`meta keyword list has ${current.keywords.length} entries (minimum ${MIN_TOTAL})`)
}
if (current.visible.length < MIN_VISIBLE) {
  failures.push(`visible Related searches has ${current.visible.length} terms (minimum ${MIN_VISIBLE})`)
}
const duplicates = current.keywords.filter((k, i) => current.keywords.findIndex((c) => sameKeyword(c, k)) !== i)
if (duplicates.length) {
  failures.push(`duplicate keywords after merge: ${duplicates.join(" | ")}`)
}

console.log(`Baseline keywords: ${baseline.keywords.length}`)
console.log(`Current meta keywords: ${current.keywords.length} (added ${added.length})`)
console.log(`Visible Related searches terms: ${current.visible.length}`)
console.log(`Missing from baseline: ${missing.length}`)

if (failures.length) {
  console.error("FAIL verify-keyword-preservation:")
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

console.log("OK verify-keyword-preservation (zero deletions; meta list complete; visible terms >= 25)")
