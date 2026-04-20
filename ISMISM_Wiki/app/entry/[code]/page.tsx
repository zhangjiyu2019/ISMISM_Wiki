"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  buildEntryMap,
  coordinateDistance,
  getLocalizedLabel,
  ismData,
  parseCode,
  parseLanguage,
  STARRED_CODES_KEY,
} from "@/lib/ism-data";

export default function EntryPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const lang = parseLanguage(searchParams.get("lang"));
  const entryMap = useMemo(() => buildEntryMap(), []);
  const routeCode = parseCode(params.code) ?? parseCode(searchParams.get("code")) ?? ismData.entries[0]?.code ?? "1";
  const selectedEntry = entryMap.get(routeCode) ?? ismData.entries[0];

  const [query, setQuery] = useState("");
  const [starredCodes, setStarredCodes] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem(STARRED_CODES_KEY);
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
    window.localStorage.setItem(STARRED_CODES_KEY, JSON.stringify(starredCodes));
  }, [starredCodes]);

  useEffect(() => {
    if (selectedEntry) {
      window.localStorage.setItem("ismism-last-code", selectedEntry.code);
    }
  }, [selectedEntry]);

  function toggleStar(code: string) {
    setStarredCodes((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [code, ...current],
    );
  }

  const nearbyEntries = useMemo(() => {
    if (!selectedEntry) return [];
    return ismData.entries
      .filter((entry) => entry.code !== selectedEntry.code)
      .filter((entry) => entry.digits.length === selectedEntry.digits.length)
      .map((entry) => ({
        entry,
        diff: coordinateDistance(entry.digits, selectedEntry.digits),
      }))
      .filter((item) => item.diff === 1)
      .sort((a, b) => a.entry.code.localeCompare(b.entry.code))
      .map((item) => item.entry)
      .slice(0, 12);
  }, [selectedEntry]);

  const searchedEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ismData.entries.slice(0, 12);
    return ismData.entries
      .filter((entry) => {
        const byCode = entry.code.includes(normalized.replaceAll(" ", ""));
        const byTitle = getLocalizedLabel(entry.title, lang).toLowerCase().includes(normalized);
        return byCode || byTitle;
      })
      .slice(0, 16);
  }, [lang, query]);

  if (!selectedEntry) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p>No entry found.</p>
      </main>
    );
  }

  const copy =
    lang === "en"
      ? {
          breadcrumbs: "Breadcrumbs",
          search: "Omni-Search",
          searchPlaceholder: "Search title or code, e.g. 1-1 or 1-2-1-4",
          nearby: "Nearby Isms",
          star: "Star",
          starred: "Starred",
          selector: "Coordinate Selector",
          changeCoordinate: "Change coordinate",
          home: "Home",
        }
      : {
          breadcrumbs: "面包屑路径",
          search: "全局搜索",
          searchPlaceholder: "按标题或坐标搜索，例如 1-1 或 1-2-1-4",
          nearby: "附近主义",
          star: "收藏",
          starred: "已收藏",
          selector: "坐标选择器",
          changeCoordinate: "修改坐标",
          home: "主页",
        };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-5 p-5 lg:grid-cols-[280px_1fr_340px]">
        <aside className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{copy.breadcrumbs}</h2>
            <Link href={`/?lang=${lang}`} className="text-xs text-cyan-300 hover:underline">
              {copy.home}
            </Link>
          </div>
          <ol className="space-y-2 text-sm text-zinc-200">
            {selectedEntry.breadcrumbs.map((crumb) => (
              <li key={crumb.code}>
                <Link href={`/entry/${crumb.code}?lang=${lang}`} className="hover:text-white">
                  {crumb.code} - {getLocalizedLabel(crumb.label, lang)}
                </Link>
              </li>
            ))}
          </ol>
        </aside>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <header className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-semibold">{selectedEntry.code}</div>
            <h1 className="text-2xl font-semibold leading-tight">{getLocalizedLabel(selectedEntry.title, lang)}</h1>
            <button
              type="button"
              className="ml-auto rounded-lg border border-white/15 px-3 py-2 text-sm transition hover:bg-zinc-800"
              onClick={() => toggleStar(selectedEntry.code)}
            >
              {starredCodes.includes(selectedEntry.code) ? `★ ${copy.starred}` : `☆ ${copy.star}`}
            </button>
          </header>
          <div className="reader-pane max-h-[78vh] overflow-auto rounded-xl border border-white/10 bg-zinc-950/50 p-5">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {selectedEntry.markdown}
            </ReactMarkdown>
          </div>
        </section>

        <aside className="space-y-5 rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{copy.search}</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm outline-none ring-cyan-400/40 transition focus:ring"
            />
            <ul className="max-h-60 space-y-2 overflow-auto">
              {searchedEntries.map((entry) => (
                <li key={entry.code}>
                  <Link
                    href={`/entry/${entry.code}?lang=${lang}`}
                    className="block rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 hover:bg-zinc-700"
                  >
                    <div className="text-xs text-zinc-400">{entry.code}</div>
                    <div className="line-clamp-1 text-sm">{getLocalizedLabel(entry.title, lang)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{copy.nearby}</h2>
            <ul className="space-y-2 text-sm">
              {nearbyEntries.map((entry) => (
                <li key={`nearby-${entry.code}`}>
                  <Link
                    href={`/entry/${entry.code}?lang=${lang}`}
                    className="block rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 hover:bg-zinc-700"
                  >
                    <div className="text-xs text-zinc-400">{entry.code}</div>
                    <div className="line-clamp-1">{getLocalizedLabel(entry.title, lang)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm">
            <h2 className="font-semibold">{copy.selector}</h2>
            <p className="text-zinc-300">{selectedEntry.digits.join(" - ")}</p>
            <Link href={`/select/1?lang=${lang}&code=${selectedEntry.code}`} className="text-cyan-300 hover:underline">
              {copy.changeCoordinate}
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
