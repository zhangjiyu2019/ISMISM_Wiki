"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, type ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { READ_CODES_KEY, buildEntryMap, getLocalizedLabel, ismData, parseLanguage } from "@/lib/ism-data";
import { getHomeCopy } from "@/lib/ui-copy";

type ReadTreeNode = { code: string; children: ReadTreeNode[] };

function ReadingRecordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLanguage(searchParams.get("lang"));
  const t = getHomeCopy(lang, ismData.totalIndexedEntries);
  const entryMap = useMemo(() => buildEntryMap(), []);
  const [readCodes] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(READ_CODES_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  });

  const readCodeSet = useMemo(
    () => new Set(readCodes.filter((code) => entryMap.has(code))),
    [entryMap, readCodes],
  );

  const levelStats = useMemo(() => {
    const totals = [0, 0, 0, 0];
    const reads = [0, 0, 0, 0];
    for (const entry of ismData.entries) {
      const depth = entry.code.split("-").length;
      totals[depth - 1] += 1;
      if (readCodeSet.has(entry.code)) reads[depth - 1] += 1;
    }
    return { totals, reads };
  }, [readCodeSet]);

  const readTreeRoots = useMemo(() => {
    function compareCode(left: string, right: string) {
      const leftParts = left.split("-").map(Number);
      const rightParts = right.split("-").map(Number);
      const maxLength = Math.max(leftParts.length, rightParts.length);
      for (let index = 0; index < maxLength; index += 1) {
        const leftValue = leftParts[index];
        const rightValue = rightParts[index];
        if (leftValue === undefined) return -1;
        if (rightValue === undefined) return 1;
        if (leftValue !== rightValue) return leftValue - rightValue;
      }
      return 0;
    }

    const nodes = new Map<string, ReadTreeNode>();
    const sortedCodes = [...ismData.entries.map((entry) => entry.code)].sort(compareCode);
    sortedCodes.forEach((code) => {
      nodes.set(code, { code, children: [] });
    });

    const roots: ReadTreeNode[] = [];
    sortedCodes.forEach((code) => {
      const node = nodes.get(code);
      if (!node) return;
      const dashIndex = code.lastIndexOf("-");
      if (dashIndex === -1) {
        roots.push(node);
        return;
      }
      const parent = nodes.get(code.slice(0, dashIndex));
      if (parent) parent.children.push(node);
    });
    return roots;
  }, []);

  function renderReadTree(nodes: ReadTreeNode[], depth = 1): ReactElement {
    return (
      <ul className={`space-y-1 ${depth > 1 ? "mt-1 border-l border-white/8 pl-2" : ""}`}>
        {nodes.map((node) => {
          const entry = entryMap.get(node.code);
          if (!entry) return null;
          const isRead = readCodeSet.has(node.code);
          const nodeClass = isRead
            ? "border-white/70 bg-white/12 text-white"
            : "border-white/10 bg-black/25 text-zinc-500";
          return (
            <li key={`read-tree-${node.code}`}>
              <Link
                href={`/entry/${node.code}?lang=${lang}`}
                className={`block rounded-none border px-2 py-1 text-[11px] transition-colors hover:border-white/50 hover:text-white ${nodeClass}`}
              >
                {node.code} - {getLocalizedLabel(entry.title, lang)}
              </Link>
              {node.children.length > 0 ? renderReadTree(node.children, depth + 1) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 text-[var(--foreground)]">
      <section className="mx-auto w-full max-w-5xl rounded-none border border-white/15 bg-black/60 p-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.14em]">{t.readingRecords}</h1>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={lang === "en" ? "Back" : "返回上一级"}
            title={lang === "en" ? "Back" : "返回上一级"}
            className="inline-flex h-12 w-12 items-center justify-center rounded-none bg-transparent text-zinc-200 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M10.5 7L5 12l5.5 5" />
              <path d="M5.5 12h7.5c3.8 0 6.5-2.7 6.5-6.3" />
            </svg>
          </button>
        </header>

        <section className="rounded-none border border-white/12 bg-black/55 p-4">
          <p className="text-sm text-zinc-400">
            {t.readProgress}: {readCodeSet.size} / {ismData.entries.length}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={`level-${index + 1}`} className="rounded-none border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-400">
                {lang === "en" ? `L${index + 1}` : `第${index + 1}级`}: {levelStats.reads[index]} / {levelStats.totals[index]}
              </div>
            ))}
          </div>
          <div className="entry-scroll-area mt-3 max-h-[65vh] overflow-auto pr-1">
            {readCodeSet.size > 0 ? renderReadTree(readTreeRoots) : <p className="text-xs text-zinc-500">{t.noReadYet}</p>}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function ReadingRecordsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] px-6 py-8 text-[var(--foreground)]">
          <div className="mx-auto max-w-5xl animate-pulse rounded-none border border-white/10 bg-black/40 p-6 text-sm text-zinc-500">
            Loading…
          </div>
        </main>
      }
    >
      <ReadingRecordsPageContent />
    </Suspense>
  );
}
