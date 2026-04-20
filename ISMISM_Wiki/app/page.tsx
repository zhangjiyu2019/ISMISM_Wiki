"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  DIGIT_OPTIONS,
  LANGUAGE_KEY,
  dimensionLabels,
  getLocalizedLabel,
  ismData,
  parseLanguage,
  type Language,
} from "@/lib/ism-data";

const copy = {
  zh: {
    title: "主义主义维基",
    subtitle: "哲学坐标导航系统",
    introTitle: "总体介绍",
    introText:
      "你可以先阅读总纲条目（如 1、2），再进入分层坐标选择。现在系统支持 1 级到 4 级全部条目。",
    start: "进入分层导航",
    latest: "继续上次条目",
    indexed: `已索引 ${ismData.totalIndexedEntries} 个主义`,
    language: "语言",
    matrixTitle: "4×4 网格词条面板",
    matrixHelp: "当前固定：场域论 + 目的论；网格坐标：本体论(行) × 认识论(列)",
    noEntry: "未收录",
    field: "场域论",
    ontology: "本体论",
    epistemology: "认识论",
    teleology: "目的论 (i 维度)",
    resetOrigin: "坐标原点复位",
    cadAxis: "CAD 风格坐标轴",
    rotateHint: "拖拽魔方可旋转，点击格子进入词条。",
    availableField: "场域论可用值",
  },
  en: {
    title: "Ismism Wiki",
    subtitle: "Philosophical Coordinate Navigator",
    introTitle: "Overview",
    introText:
      "You can start from top-level overview entries (such as 1, 2), then drill down via layered coordinate selection. The index supports depth 1 to 4.",
    start: "Start Layered Navigation",
    latest: "Continue Last Entry",
    indexed: `${ismData.totalIndexedEntries} indexed entries`,
    language: "Language",
    matrixTitle: "4×4 Entry Grid",
    matrixHelp: "Fixed dimensions: Field + Teleology; grid axes: Ontology (rows) × Epistemology (cols)",
    noEntry: "No entry",
    field: "Field",
    ontology: "Ontology",
    epistemology: "Epistemology",
    teleology: "Teleology (i-dimension)",
    resetOrigin: "Reset Origin",
    cadAxis: "CAD-style Axis",
    rotateHint: "Drag cube to rotate, click a tile to open entry.",
    availableField: "Available Field values",
  },
};

const defaultRotation = { x: -22, y: 28 };
const fillerFaceClasses = ["right face-ontology", "top face-epistemology", "back face-back", "left face-left", "bottom face-bottom"] as const;

export default function Home() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window === "undefined") return "zh";
    const queryValue = new URLSearchParams(window.location.search).get("lang");
    const queryLang = queryValue ? parseLanguage(queryValue) : null;
    const savedLang = parseLanguage(window.localStorage.getItem(LANGUAGE_KEY));
    return queryLang ?? savedLang;
  });
  const [lastCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("ismism-last-code");
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, lang);
  }, [lang]);

  function switchLanguage(next: Language) {
    setLang(next);
    window.localStorage.setItem(LANGUAGE_KEY, next);
  }

  const t = copy[lang];
  const overviewEntries = ismData.entries.filter((entry) => entry.code.split("-").length === 1);
  const [fieldDigit, setFieldDigit] = useState(1);
  const [iDigit, setIDigit] = useState(1);
  const [rotation, setRotation] = useState(defaultRotation);
  const dragState = useRef<{ dragging: boolean; x: number; y: number }>({
    dragging: false,
    x: 0,
    y: 0,
  });

  const entryMap = useMemo(
    () => new Map(ismData.entries.map((entry) => [entry.code, entry])),
    [],
  );

  const availableFieldDigits = useMemo(() => {
    const set = new Set<number>();
    ismData.entries.forEach((entry) => {
      if (entry.digits.length >= 1) set.add(entry.digits[0]);
    });
    return set;
  }, []);
  const availableFieldValuesText = useMemo(
    () => [...availableFieldDigits].sort((a, b) => a - b).join(", "),
    [availableFieldDigits],
  );
  const faceFillers = useMemo(() => Array.from({ length: 16 }, (_, index) => index), []);

  const gridCells = useMemo(() => {
    const cells: Array<{ code: string; title: string; exists: boolean }> = [];
    for (let ontology = 1; ontology <= 4; ontology += 1) {
      for (let epistemology = 1; epistemology <= 4; epistemology += 1) {
        const code = `${fieldDigit}-${ontology}-${epistemology}-${iDigit}`;
        const entry = entryMap.get(code);
        cells.push({
          code,
          exists: Boolean(entry),
          title: entry ? getLocalizedLabel(entry.title, lang) : t.noEntry,
        });
      }
    }
    return cells;
  }, [entryMap, fieldDigit, iDigit, lang, t.noEntry]);

  function resetOrigin() {
    setFieldDigit(1);
    setIDigit(1);
    setRotation(defaultRotation);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragState.current = {
      dragging: true,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState.current.dragging) return;
    const deltaX = event.clientX - dragState.current.x;
    const deltaY = event.clientY - dragState.current.y;
    dragState.current.x = event.clientX;
    dragState.current.y = event.clientY;
    setRotation((current) => ({
      x: current.x - deltaY * 0.4,
      y: current.y + deltaX * 0.4,
    }));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragState.current.dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-[var(--foreground)]">
      <section className="w-full max-w-6xl rounded-3xl border border-white/10 bg-zinc-900/60 p-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{t.title}</h1>
            <p className="mt-2 text-zinc-400">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-zinc-950/70 p-2">
            <span className="px-2 text-xs text-zinc-400">{t.language}</span>
            <button
              type="button"
              onClick={() => switchLanguage("zh")}
              className={`rounded-md px-3 py-1 text-sm ${lang === "zh" ? "bg-cyan-500 text-black" : "bg-zinc-800"}`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => switchLanguage("en")}
              className={`rounded-md px-3 py-1 text-sm ${lang === "en" ? "bg-cyan-500 text-black" : "bg-zinc-800"}`}
            >
              English
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-950/40 p-4">
            <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">{t.cadAxis}</h3>
                <button
                  type="button"
                  onClick={resetOrigin}
                  className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20"
                >
                  {t.resetOrigin}
                </button>
              </div>
              <div className="flex items-center gap-5">
                <svg viewBox="0 0 140 140" className="h-28 w-28 rounded-lg border border-white/10 bg-zinc-950/70 p-2">
                  <circle cx="26" cy="114" r="3.5" fill="#f8fafc" />
                  <line x1="26" y1="114" x2="116" y2="114" stroke="#22d3ee" strokeWidth="3" />
                  <line x1="26" y1="114" x2="26" y2="26" stroke="#a78bfa" strokeWidth="3" />
                  <line x1="26" y1="114" x2="90" y2="50" stroke="#4ade80" strokeWidth="3" />
                  <line x1="26" y1="114" x2="56" y2="82" stroke="#f472b6" strokeDasharray="4 4" strokeWidth="2.5" />
                  <text x="118" y="118" fill="#22d3ee" fontSize="10">X</text>
                  <text x="20" y="20" fill="#a78bfa" fontSize="10">Y</text>
                  <text x="95" y="47" fill="#4ade80" fontSize="10">Z</text>
                  <text x="59" y="79" fill="#f472b6" fontSize="10">i</text>
                </svg>
                <div className="space-y-1 text-sm text-zinc-300">
                  <div>X: {t.field}</div>
                  <div>Y: {t.ontology}</div>
                  <div>Z: {t.epistemology}</div>
                  <div>i: {t.teleology}</div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
              <h3 className="text-sm font-semibold text-zinc-200">{t.matrixTitle}</h3>
              <p className="mt-1 text-sm text-zinc-400">{t.matrixHelp}</p>
              <p className="mt-1 text-xs text-cyan-200">{t.rotateHint}</p>
              <p className="mt-2 text-xs text-amber-300">
                {t.availableField}: {availableFieldValuesText}
              </p>

              <div className="mt-4 flex flex-wrap gap-5">
                <div>
                  <div className="mb-2 text-xs text-zinc-400">{t.field}</div>
                  <div className="flex gap-2">
                    {DIGIT_OPTIONS.map((value) => {
                      const enabled = availableFieldDigits.has(value);
                      return (
                        <button
                          key={`field-${value}`}
                          type="button"
                          onClick={() => setFieldDigit(value)}
                          className={`rounded-md px-3 py-1 text-sm ${
                            fieldDigit === value
                              ? "bg-cyan-500 text-black"
                              : enabled
                                ? "bg-zinc-800 text-zinc-100"
                                : "bg-zinc-800/50 text-zinc-500"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs text-zinc-400">{t.teleology}</div>
                  <div className="flex gap-2">
                    {DIGIT_OPTIONS.map((value) => (
                      <button
                        key={`i-${value}`}
                        type="button"
                        onClick={() => setIDigit(value)}
                        className={`rounded-md px-3 py-1 text-sm ${
                          iDigit === value ? "bg-fuchsia-400 text-black" : "bg-zinc-800 text-zinc-100"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="cube-wrap mt-4 flex min-h-[390px] cursor-grab items-center justify-center active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                <div className="cube" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
                  <div className="face front face-field">
                    <div className="cube-face-grid">
                      {gridCells.map((cell) =>
                        cell.exists ? (
                          <Link key={cell.code} href={`/entry/${cell.code}?lang=${lang}`} className="cube-front-cell cube-front-cell-active">
                            <div className="text-[11px] text-zinc-300">{cell.code}</div>
                            <div className="line-clamp-3 text-[11px]">{cell.title}</div>
                          </Link>
                        ) : (
                          <div key={cell.code} className="cube-front-cell cube-front-cell-empty">
                            <div className="text-[11px] text-zinc-500">{cell.code}</div>
                            <div className="line-clamp-3 text-[11px] text-zinc-500">{cell.title}</div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  {fillerFaceClasses.map((faceClass) => (
                    <div key={faceClass} className={`face ${faceClass}`}>
                      <div className="face-grid">
                        {faceFillers.map((item) => (
                          <span key={`${faceClass}-${item}`} className="sticker" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-white/10 bg-zinc-950/50 p-4">
              <h2 className="text-sm font-semibold text-cyan-300">{t.introTitle}</h2>
              <p className="mt-2 text-sm text-zinc-300">{t.introText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {overviewEntries.map((entry) => (
                  <Link
                    key={entry.code}
                    href={`/entry/${entry.code}?lang=${lang}`}
                    className="rounded-md border border-white/15 bg-zinc-800 px-3 py-1 text-xs hover:bg-zinc-700"
                  >
                    {entry.code} - {getLocalizedLabel(entry.title, lang)}
                  </Link>
                ))}
              </div>
            </section>

            {dimensionLabels[lang].map((label, index) => (
              <Link
                key={label}
                href={`/select/${index + 1}?lang=${lang}`}
                className="block rounded-xl border border-white/10 bg-zinc-800 px-4 py-4 text-base transition hover:bg-zinc-700"
              >
                {label}
              </Link>
            ))}

            <Link
              href={`/select/4?lang=${lang}`}
              className="block rounded-xl border border-fuchsia-300/40 bg-fuchsia-500/15 px-4 py-4 text-base transition hover:bg-fuchsia-500/25"
            >
              {lang === "en" ? "i-Dimension Teleology (Click to Enter)" : "i 维度目的论（点击进入）"}
            </Link>

            <Link
              href={`/select/1?lang=${lang}`}
              className="mt-4 block rounded-xl bg-cyan-500 px-4 py-3 text-center font-semibold text-black"
            >
              {t.start}
            </Link>

            {lastCode ? (
              <Link
                href={`/entry/${lastCode}?lang=${lang}`}
                className="block rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-center text-sm"
              >
                {t.latest}: {lastCode}
              </Link>
            ) : null}

            <p className="text-sm text-zinc-500">{t.indexed}</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
