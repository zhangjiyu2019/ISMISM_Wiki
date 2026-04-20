import indexData from "@/app/data/ism-index.json";
import zhTitleEn from "@/lib/ism-title-en.json";

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
  // Ismism English gloss: 场域论 → Ontology; 本体论 → Metaphysics (not standard Anglo “field / ontology” pairing).
  en: ["Ontology", "Metaphysics", "Epistemology", "Teleology"],
};

const zhToEnExactMap: Record<string, string> = {
  实践: "Practice",
  实在论: "Realism",
  形而下学: "Subphysics",
  形而上学: "Metaphysics",
  观念论: "Idealism",
  场域论: "Ontology",
  本体论: "Metaphysics",
  认识论: "Epistemology",
  目的论: "Teleology",
  存在主义: "Existentialism",
  结构主义: "Structuralism",
  后结构主义: "Post-structuralism",
  符号学: "Semiotics",
  解释学: "Hermeneutics",
  列宁主义: "Leninism",
  金融资本主义: "Financial capitalism",
};

function fallbackTranslateZhLabel(text: string) {
  const normalized = text.trim();
  if (!normalized) return normalized;
  if (zhToEnExactMap[normalized]) return zhToEnExactMap[normalized];

  let translated = normalized;
  translated = translated.replaceAll("形而上学", "Metaphysics");
  translated = translated.replaceAll("形而下学", "Subphysics");
  translated = translated.replaceAll("场域论", "Ontology");
  translated = translated.replaceAll("本体论", "Metaphysics");
  translated = translated.replaceAll("认识论", "Epistemology");
  translated = translated.replaceAll("目的论", "Teleology");
  translated = translated.replaceAll("场域", "Ontology");
  translated = translated.replaceAll("本体", "Metaphysics");
  translated = translated.replaceAll("认识", "Epistemology");
  translated = translated.replaceAll("目的", "Teleology");
  translated = translated.replaceAll("实践", "Practice");
  translated = translated.replaceAll("观念", "Idea");
  translated = translated.replaceAll("实在", "Real");

  return translated === normalized ? normalized : translated;
}

const zhTitleEnMap = zhTitleEn as Record<string, string>;

export function splitBilingual(text: string) {
  const normalized = text.trim();
  const fullWidth = normalized.match(/^(.*?)（([^）]+)）$/);
  if (fullWidth) {
    return { zh: fullWidth[1].trim(), en: fullWidth[2].trim() };
  }
  const halfWidth = normalized.match(/^(.*)\(([^)]+)\)\s*$/);
  if (halfWidth && /[\u4e00-\u9fff]/.test(halfWidth[1]) && /[A-Za-z]/.test(halfWidth[2])) {
    return { zh: halfWidth[1].trim(), en: halfWidth[2].trim() };
  }
  const mapped = zhTitleEnMap[normalized];
  if (mapped) {
    return { zh: normalized, en: mapped };
  }
  if (!/[\u4e00-\u9fff]/.test(normalized)) {
    return { zh: normalized, en: normalized };
  }
  return { zh: normalized, en: fallbackTranslateZhLabel(normalized) };
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
