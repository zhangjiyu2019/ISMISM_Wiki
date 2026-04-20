"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  buildEntryMap,
  getLocalizedLabel,
  ismData,
  parseCode,
  parseLanguage,
  READ_CODES_KEY,
  splitBilingual,
} from "@/lib/ism-data";
import { getEntryCopy } from "@/lib/ui-copy";

function extractVideoLinks(markdown: string) {
  const matches = markdown.match(/https?:\/\/[^\s)\]]+/g) ?? [];
  const normalized = matches.map((url) => url.replace(/[),.;，。；]+$/, ""));
  const videoUrls = normalized.filter((url) =>
    /(bilibili\.com|b23\.tv|youtube\.com|youtu\.be|youku\.com|vimeo\.com)/i.test(url),
  );
  return [...new Set(videoUrls)];
}

function translateMarkdownForEnglish(markdown: string) {
  const replacements: Array<[RegExp, string]> = [
    [/^##\s*网站补充信息\s*$/gm, "## Website Supplement"],
    [/^###\s*坐标轴\s*$/gm, "### Axes"],
    [/^###\s*特征\s*$/gm, "### Features"],
    [/^###\s*关联与视频\s*$/gm, "### Related and Video"],
    [/原视频链接/g, "Original video"],
    [/思想史代表人物/g, "Representative figure"],
    [/意识形态代表物/g, "Ideological representative"],
    [/意识形态捕获群体/g, "Captured group"],
    [/返回主页面/g, "Home"],
    [/返回上一级/g, "Back"],
  ];

  let translated = markdown;
  for (const [pattern, nextText] of replacements) {
    translated = translated.replace(pattern, nextText);
  }
  return translated;
}

type EntryTreeNode = {
  code: string;
  children: EntryTreeNode[];
};

export default function EntryPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const lang = parseLanguage(searchParams.get("lang"));
  const entryMap = useMemo(() => buildEntryMap(), []);
  const routeCode = parseCode(params.code) ?? parseCode(searchParams.get("code")) ?? ismData.entries[0]?.code ?? "1";
  const selectedEntry = entryMap.get(routeCode) ?? ismData.entries[0];

  const [query, setQuery] = useState("");
  const [readCodes, setReadCodes] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem(READ_CODES_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(READ_CODES_KEY, JSON.stringify(readCodes));
  }, [readCodes]);

  useEffect(() => {
    if (selectedEntry) {
      window.localStorage.setItem("ismism-last-code", selectedEntry.code);
    }
  }, [selectedEntry]);

  function toggleRead(code: string) {
    setReadCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [code, ...current],
    );
  }

  const safeMarkdown = selectedEntry?.markdown ?? "";
  const videoLinks = useMemo(() => extractVideoLinks(safeMarkdown), [safeMarkdown]);
  const displayMarkdown = useMemo(
    () => (lang === "en" ? translateMarkdownForEnglish(safeMarkdown) : safeMarkdown),
    [lang, safeMarkdown],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const searchTree = useMemo(() => {
    function buildNodes(prefix: string, depth: number): EntryTreeNode[] {
      if (depth > 4) return [];
      return [1, 2, 3, 4].map((digit) => {
        const code = prefix ? `${prefix}-${digit}` : String(digit);
        return {
          code,
          children: buildNodes(code, depth + 1),
        };
      });
    }
    return buildNodes("", 1);
  }, []);
  const matchingCodeSet = useMemo(() => {
    if (!normalizedQuery) return null;
    const matched = new Set<string>();
    for (const entry of ismData.entries) {
      const byCode = entry.code.includes(normalizedQuery.replaceAll(" ", ""));
      const byTitle = getLocalizedLabel(entry.title, lang).toLowerCase().includes(normalizedQuery);
      if (byCode || byTitle) matched.add(entry.code);
    }
    return matched;
  }, [lang, normalizedQuery]);

  if (!selectedEntry) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p>No entry found.</p>
      </main>
    );
  }

  const copy = getEntryCopy(lang);
  const hasReadCurrent = readCodes.includes(selectedEntry.code);
  const titlePair = splitBilingual(selectedEntry.title);
  const sepQuery = titlePair.en || titlePair.zh;
  const sepUrl = `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent(sepQuery)}`;
  const wikipediaQuery = titlePair.en || titlePair.zh;
  const wikipediaUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(wikipediaQuery)}`;

  function isTreeBranchHighlighted(code: string) {
    if (!matchingCodeSet) return true;
    if (matchingCodeSet.has(code)) return true;
    for (const match of matchingCodeSet) {
      if (match.startsWith(code) || code.startsWith(match)) return true;
    }
    return false;
  }

  function renderSearchTree(nodes: EntryTreeNode[], depth = 1) {
    return (
      <ul className={`space-y-1 ${depth > 1 ? "mt-1 border-l border-white/10 pl-3" : ""}`}>
        {nodes.map((node) => {
          const entry = entryMap.get(node.code);
          const branchHighlighted = isTreeBranchHighlighted(node.code);
          const isCurrent = node.code === selectedEntry.code;
          const nodeClass = isCurrent
            ? "border-white/85 bg-white text-black"
            : branchHighlighted
              ? "border-white/20 bg-black/60 text-zinc-100"
              : "border-white/10 bg-black/35 text-zinc-500 opacity-55";

          return (
            <li key={`tree-${node.code}`}>
              {entry ? (
                <Link
                  href={`/entry/${node.code}?lang=${lang}`}
                  className={`block rounded-none border px-2.5 py-1.5 text-xs transition hover:border-white/55 ${nodeClass}`}
                >
                  {node.code} - {getLocalizedLabel(entry.title, lang)}
                </Link>
              ) : (
                <div className={`rounded-none border px-2.5 py-1.5 text-xs ${nodeClass}`}>
                  {node.code}
                </div>
              )}
              {depth < 4 ? renderSearchTree(node.children, depth + 1) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto grid h-full w-full max-w-[1600px] gap-5 p-5 lg:grid-cols-[1fr_340px]">
        <section className="flex min-h-0 flex-col space-y-4 rounded-none border border-white/15 bg-black/60 p-5">
          <header className="flex flex-wrap items-center gap-3">
            <div className="rounded-none border border-white/20 bg-black/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em]">
              {selectedEntry.code}
            </div>
            <h1 className="text-2xl font-semibold leading-tight uppercase tracking-[0.06em]">{getLocalizedLabel(selectedEntry.title, lang)}</h1>
            <button
              type="button"
              aria-label={hasReadCurrent ? copy.markedRead : copy.markRead}
              title={hasReadCurrent ? copy.markedRead : copy.markRead}
              className={`ml-auto inline-flex h-9 w-9 items-center justify-center rounded-none transition-colors ${
                hasReadCurrent
                  ? "bg-white/20 text-white"
                  : "bg-transparent text-zinc-600 hover:bg-white/12 hover:text-zinc-200"
              }`}
              onClick={() => toggleRead(selectedEntry.code)}
            >
              {hasReadCurrent ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M8.5 12.5l2.3 2.3 4.7-5.1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                </svg>
              )}
            </button>
          </header>
          <div className="reader-pane entry-scroll-area min-h-0 flex-1 overflow-auto rounded-none border border-white/12 bg-black/65 p-5">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {displayMarkdown}
            </ReactMarkdown>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col rounded-none border border-white/15 bg-black/60 p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label={lang === "en" ? "Back" : "返回上一级"}
              title={lang === "en" ? "Back" : "返回上一级"}
              className="inline-flex h-12 w-12 items-center justify-center rounded-none bg-transparent text-zinc-200 transition-colors hover:bg-white/15 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M10.5 7L5 12l5.5 5" />
                <path d="M5.5 12h7.5c3.8 0 6.5-2.7 6.5-6.3" />
              </svg>
            </button>
          </div>

          <section className="entry-search-wrap mt-5 flex min-h-0 flex-1 flex-col space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">{copy.search}</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-none border border-white/20 bg-black px-3 py-2 text-sm outline-none transition focus:border-white/55"
            />
            <div className="entry-scroll-area min-h-0 flex-1 overflow-auto pr-1">
              {renderSearchTree(searchTree)}
            </div>
          </section>

          <section className="mt-auto rounded-none border border-white/18 bg-black/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-200">
              {lang === "en" ? "References" : "参考链接"}
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={sepUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-none border border-white/30 bg-transparent px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-100 transition-colors hover:border-white/70 hover:bg-white hover:text-black"
              >
                SEP
              </a>
              <a
                href={wikipediaUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-none border border-white/30 bg-transparent px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-100 transition-colors hover:border-white/70 hover:bg-white hover:text-black"
              >
                Wikipedia
              </a>
              {videoLinks.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-none border border-white/30 bg-transparent px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-zinc-100 transition-colors hover:border-white/70 hover:bg-white hover:text-black"
                >
                  {lang === "en" ? `Video ${index + 1}` : `视频链接 ${index + 1}`}
                </a>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
