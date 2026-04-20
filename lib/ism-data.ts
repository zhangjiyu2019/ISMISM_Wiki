import indexData from "@/app/data/ism-index.json";

export type Language = "zh" | "en";

export type IsmBreadcrumb = {
  code: string;
  label: string;
};

export type IsmEntry = {
  code: string;
  digits: number[];
  title: string;
  markdown: string;
  sourcePath: string;
  breadcrumbs: IsmBreadcrumb[];
};

export type IsmIndex = {
  generatedAt: string;
  sourceDir: string;
  totalMarkdownFilesScanned: number;
  totalIndexedEntries: number;
  dimensions: number[][];
  entries: IsmEntry[];
};

export const ismData = indexData as IsmIndex;
export const STARRED_CODES_KEY = "ismism-starred-codes";
export const LANGUAGE_KEY = "ismism-language";

export const dimensionLabels: Record<Language, [string, string, string, string]> = {
  zh: ["场域论", "本体论", "认识论", "目的论"],
  en: ["Field", "Ontology", "Epistemology", "Teleology"],
};

export function splitBilingual(text: string) {
  const normalized = text.trim();
  const match = normalized.match(/^(.*?)（(.*?)）$/);
  if (!match) {
    return { zh: normalized, en: normalized };
  }
  return {
    zh: match[1].trim(),
    en: match[2].trim(),
  };
}

export function getLocalizedLabel(text: string, lang: Language) {
  const pair = splitBilingual(text);
  return lang === "en" ? pair.en : pair.zh;
}

export function coordinateDistance(left: number[], right: number[]) {
  const maxLength = Math.max(left.length, right.length);
  let diff = 0;
  for (let index = 0; index < maxLength; index += 1) {
    if ((left[index] ?? null) !== (right[index] ?? null)) diff += 1;
  }
  return diff;
}

export function buildEntryMap() {
  return new Map(ismData.entries.map((entry) => [entry.code, entry]));
}

export function chooseClosestCode(targetDigits: number[]) {
  const exactCode = targetDigits.join("-");
  if (ismData.entries.some((entry) => entry.code === exactCode)) return exactCode;

  const sorted = [...ismData.entries].sort((a, b) => {
    const diff = coordinateDistance(a.digits, targetDigits) - coordinateDistance(b.digits, targetDigits);
    if (diff !== 0) return diff;
    return a.code.localeCompare(b.code);
  });
  return sorted[0]?.code ?? ismData.entries[0]?.code ?? "1";
}

export function parseCode(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/^\d(?:-\d){0,3}$/);
  return match ? value : null;
}

export function codeToDigits(code: string) {
  return code.split("-").map(Number);
}

export function findEntryByCode(code: string | null | undefined) {
  if (!code) return undefined;
  return ismData.entries.find((entry) => entry.code === code);
}

export function getPrefixAtDepth(digits: number[], depth: number) {
  if (depth <= 0) return "";
  return digits.slice(0, depth).join("-");
}

export function parseLanguage(value: string | null | undefined): Language {
  return value === "en" ? "en" : "zh";
}
