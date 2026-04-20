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
export const READ_CODES_KEY = "ismism-read-codes";
export const LANGUAGE_KEY = "ismism-language";
export const DIGIT_OPTIONS = [1, 2, 3, 4] as const;

export const dimensionLabels: Record<Language, [string, string, string, string]> = {
  zh: ["场域论", "本体论", "认识论", "目的论"],
  en: ["Field", "Ontology", "Epistemology", "Teleology"],
};

const zhToEnExactMap: Record<string, string> = {
  实践: "Practice",
  实在论: "Realism",
  形而下学: "Subphysics",
  形而上学: "Metaphysics",
  观念论: "Idealism",
  本体论: "Ontology",
  认识论: "Epistemology",
  目的论: "Teleology",
};

function fallbackTranslateZhLabel(text: string) {
  const normalized = text.trim();
  if (!normalized) return normalized;
  if (zhToEnExactMap[normalized]) return zhToEnExactMap[normalized];

  let translated = normalized;
  translated = translated.replaceAll("场域", "Field");
  translated = translated.replaceAll("本体", "Ontology");
  translated = translated.replaceAll("认识", "Epistemology");
  translated = translated.replaceAll("目的", "Teleology");
  translated = translated.replaceAll("实践", "Practice");
  translated = translated.replaceAll("观念", "Idea");
  translated = translated.replaceAll("实在", "Real");
  translated = translated.replaceAll("形而上学", "Metaphysics");
  translated = translated.replaceAll("形而下学", "Subphysics");
  translated = translated.replaceAll("主义", "ism");
  translated = translated.replaceAll("论", "Theory");

  return translated === normalized ? normalized : translated;
}

export function splitBilingual(text: string) {
  const normalized = text.trim();
  const match = normalized.match(/^(.*?)（(.*?)）$/);
  if (!match) {
    return { zh: normalized, en: fallbackTranslateZhLabel(normalized) };
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
