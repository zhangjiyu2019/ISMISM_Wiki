import { promises as fs } from "node:fs";
import path from "node:path";

const sourceDir = path.resolve(
  process.cwd(),
  process.env.ISMISM_SOURCE_DIR ?? "../ismism-wiki-main/ismism-wiki-main",
);
const outputDir = path.resolve(process.cwd(), "app/data");
const outputFile = path.join(outputDir, "ism-index.json");
const siteFallbackFile = path.resolve(process.cwd(), "app/data/ism-source-site.json");

const markdownFiles = [];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      markdownFiles.push(fullPath);
    }
  }
}

function normalizeTitle(firstLine, fallback) {
  const base = (firstLine ?? fallback).replace(/^#+\s*/, "").trim();
  return (
    base
      // strip code marker like 【1-2-3-4】
      .replace(/^【\s*\d(?:-\d){0,3}\s*】\s*/, "")
      // strip code marker like [1-2-3-4]
      .replace(/^\[\s*\d(?:-\d){0,3}\s*]\s*/, "")
      .trim() || fallback
  );
}

function extractCodeFromPath(filePath) {
  const baseName = path.basename(filePath, ".md").replace(/\s+/g, "");
  const match = baseName.match(/^(\d(?:-\d){0,3})$/);
  if (!match) {
    return null;
  }
  return match[1];
}

function scoreFilePath(filePath, contentLength) {
  const lower = filePath.toLowerCase();
  const originPenalty = lower.includes(`${path.sep}origin${path.sep}`) ? 0 : 1000;
  return originPenalty + contentLength;
}

function compareCodes(a, b) {
  const aParts = a.split("-").map(Number);
  const bParts = b.split("-").map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
    const left = aParts[i] ?? -1;
    const right = bParts[i] ?? -1;
    if (left !== right) return left - right;
  }
  return 0;
}

function toSiteEntryTitle(entry, code) {
  const zh = (entry.ch_name ?? "").trim();
  const en = (entry.en_name ?? "").trim();
  if (zh && en) return `${zh}（${en}）`;
  if (zh) return zh;
  if (en) return en;
  return code;
}

function toSiteEntryMarkdown(entry, code) {
  const title = toSiteEntryTitle(entry, code);
  const axisList = Array.isArray(entry.axis_list) ? entry.axis_list : [];
  const featureList = Array.isArray(entry.feature_list) ? entry.feature_list : [];
  const relatedList = Array.isArray(entry.related_list) ? entry.related_list : [];

  const lines = [`# 【${code}】${title}`, "", "## Axis"];
  for (const axis of axisList) {
    const value = String(axis ?? "").trim();
    if (value) lines.push(`- ${value}`);
  }
  lines.push("", "## Notes");
  for (const feature of featureList) {
    const value = String(feature ?? "").trim();
    if (value) lines.push(`- ${value}`);
  }
  lines.push("", "## Related");
  for (const related of relatedList) {
    const value = String(related ?? "").trim();
    if (value) lines.push(`- ${value}`);
  }
  return `${lines.join("\n").trim()}\n`;
}

function toList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function formatSiteListItem(value) {
  const rawUrlMatch = value.match(/https?:\/\/\S+/);
  if (!rawUrlMatch) return value;

  const url = rawUrlMatch[0].replace(/[),.;，。；]+$/, "");
  const prefix = value.slice(0, value.indexOf(rawUrlMatch[0])).trim().replace(/[：:]\s*$/, "");
  if (prefix) return `${prefix}: [${url}](${url})`;
  return `[${url}](${url})`;
}

function appendSiteSupplement(markdown, siteEntry) {
  if (!siteEntry || typeof siteEntry !== "object") return markdown;

  const axisList = toList(siteEntry.axis_list);
  const featureList = toList(siteEntry.feature_list);
  const relatedList = toList(siteEntry.related_list);

  if (axisList.length === 0 && featureList.length === 0 && relatedList.length === 0) {
    return markdown;
  }

  const lines = [];
  lines.push("", "---", "", "## 网站补充信息", "");

  if (axisList.length > 0) {
    lines.push("### 坐标轴");
    for (const axis of axisList) lines.push(`- ${formatSiteListItem(axis)}`);
    lines.push("");
  }

  if (featureList.length > 0) {
    lines.push("### 特征");
    for (const feature of featureList) lines.push(`- ${formatSiteListItem(feature)}`);
    lines.push("");
  }

  if (relatedList.length > 0) {
    lines.push("### 关联与视频");
    for (const related of relatedList) lines.push(`- ${formatSiteListItem(related)}`);
    lines.push("");
  }

  return `${markdown.trimEnd()}\n${lines.join("\n").trimEnd()}\n`;
}

async function main() {
  try {
    await fs.access(sourceDir);
  } catch {
    throw new Error(
      `Source directory "${sourceDir}" does not exist. Set ISMISM_SOURCE_DIR to your markdown root.`,
    );
  }

  await walk(sourceDir);

  const allEntries = new Map();
  for (const filePath of markdownFiles) {
    const code = extractCodeFromPath(filePath);
    if (!code) continue;

    const markdown = await fs.readFile(filePath, "utf8");
    const lines = markdown.split(/\r?\n/);
    const firstHeading = lines.find((line) => line.trim().startsWith("#"));
    const title = normalizeTitle(firstHeading, code);
    const relativePath = path.relative(sourceDir, filePath).replaceAll("\\", "/");

    const candidate = {
      code,
      title,
      markdown,
      sourcePath: relativePath,
      score: scoreFilePath(filePath, markdown.length),
    };

    const current = allEntries.get(code);
    if (!current || candidate.score > current.score) {
      allEntries.set(code, candidate);
    }
  }

  let siteData = {};
  try {
    const siteRaw = await fs.readFile(siteFallbackFile, "utf8");
    siteData = JSON.parse(siteRaw);
  } catch {
    siteData = {};
  }

  // Merge official website supplement into markdown entries first.
  for (const entry of allEntries.values()) {
    const siteEntry = siteData[entry.code];
    if (!siteEntry || typeof siteEntry !== "object") continue;
    const hasBilingualTitle = /（.*?）/.test(entry.title);
    const siteEn = String(siteEntry.en_name ?? "").trim();
    if (!hasBilingualTitle && siteEn) {
      entry.title = toSiteEntryTitle(siteEntry, entry.code);
    }
    entry.markdown = appendSiteSupplement(entry.markdown, siteEntry);
  }

  // Backfill missing coordinates from official web dataset when local markdown is absent.
  try {
    for (const [code, siteEntry] of Object.entries(siteData)) {
      if (!/^\d(?:-\d){0,3}$/.test(code)) continue;
      if (!siteEntry || typeof siteEntry !== "object") continue;
      if (allEntries.has(code)) continue;

      allEntries.set(code, {
        code,
        title: toSiteEntryTitle(siteEntry, code),
        markdown: toSiteEntryMarkdown(siteEntry, code),
        sourcePath: `site-fallback/${code}`,
        score: 100,
      });
    }
  } catch {
    // Fallback file is optional; keep indexing local markdown data only.
  }

  const codeToTitle = new Map();
  for (const entry of allEntries.values()) {
    codeToTitle.set(entry.code, entry.title);
  }

  const indexedEntries = [...allEntries.values()]
    .filter((entry) => {
      const depth = entry.code.split("-").length;
      return depth >= 1 && depth <= 4;
    })
    .sort((a, b) => compareCodes(a.code, b.code))
    .map((entry) => {
      const parts = entry.code.split("-");
      const prefixes = parts.map((_, index) => parts.slice(0, index + 1).join("-"));
      const breadcrumbs = prefixes.map((prefix, index) => ({
        code: prefix,
        label: codeToTitle.get(prefix) ?? (index === parts.length - 1 ? entry.title : `Layer ${index + 1}`),
      }));

      return {
        code: entry.code,
        digits: parts.map(Number),
        title: entry.title,
        markdown: entry.markdown,
        sourcePath: entry.sourcePath,
        breadcrumbs,
      };
    });

  const dimensions = [0, 1, 2, 3].map((position) => {
    const values = new Set();
    for (const entry of indexedEntries) {
      if (entry.digits[position] !== undefined) {
        values.add(entry.digits[position]);
      }
    }
    return [...values].sort((a, b) => a - b);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    totalMarkdownFilesScanned: markdownFiles.length,
    totalIndexedEntries: indexedEntries.length,
    dimensions,
    entries: indexedEntries,
  };

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Indexed ${indexedEntries.length} Ism entries from ${markdownFiles.length} markdown files.`,
  );
  console.log(`Wrote index to ${outputFile}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
