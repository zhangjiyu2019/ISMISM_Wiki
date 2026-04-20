"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  codeToDigits,
  DIGIT_OPTIONS,
  dimensionLabels,
  findEntryByCode,
  getLocalizedLabel,
  getPrefixAtDepth,
  ismData,
  parseCode,
  parseLanguage,
} from "@/lib/ism-data";

export default function StepSelectorPage() {
  const params = useParams<{ step: string }>();
  const searchParams = useSearchParams();
  const lang = parseLanguage(searchParams.get("lang"));
  const requestedStep = Number(params.step);
  const step = Number.isFinite(requestedStep) ? Math.max(1, Math.min(4, requestedStep)) : 1;
  const stepIndex = step - 1;

  const prefixCode = parseCode(searchParams.get("prefix")) ?? "";
  const prefixDigits = prefixCode ? codeToDigits(prefixCode) : [];
  const currentEntry = findEntryByCode(prefixCode);

  const options = useMemo(() => ismData.dimensions[stepIndex] ?? DIGIT_OPTIONS, [stepIndex]);
  const dimensionText = dimensionLabels[lang][stepIndex];
  const currentDepthCode = getPrefixAtDepth(prefixDigits, step);
  const currentDepthEntry = findEntryByCode(currentDepthCode);

  const copy =
    lang === "en"
      ? {
          title: "Layered Coordinate Selection",
          progress: `Step ${step} / 4`,
          chosen: "Current coordinate",
          next: step === 4 ? "Continue to entry" : "Continue",
          back: "Back",
          home: "Home",
          openCurrent: "Open current-level entry",
          openAtStep: "Open entry at this level",
        }
      : {
          title: "分层坐标选择",
          progress: `第 ${step} / 4 步`,
          chosen: "当前坐标",
          next: step === 4 ? "继续进入条目" : "继续下一步",
          back: "上一步",
          home: "返回主页",
          openCurrent: "打开当前层级条目",
          openAtStep: "在该层级打开条目",
        };

  function buildNextPrefix(digit: number) {
    const nextDigits = [...prefixDigits];
    nextDigits[stepIndex] = digit;
    return getPrefixAtDepth(nextDigits, step);
  }

  function nextHref(digit: number) {
    const nextPrefix = buildNextPrefix(digit);
    if (step === 4) {
      return `/entry/${nextPrefix}?lang=${lang}`;
    }
    return `/select/${step + 1}?lang=${lang}&prefix=${nextPrefix}`;
  }

  function openCurrentHref(digit: number) {
    const nextPrefix = buildNextPrefix(digit);
    return `/entry/${nextPrefix}?lang=${lang}`;
  }

  const backHref =
    step === 1
      ? `/?lang=${lang}`
      : `/select/${step - 1}?lang=${lang}&prefix=${getPrefixAtDepth(prefixDigits, step - 2)}`;

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 text-[var(--foreground)]">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{copy.title}</h1>
            <p className="text-sm text-zinc-400">{copy.progress}</p>
          </div>
          <Link href={`/?lang=${lang}`} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-zinc-800">
            {copy.home}
          </Link>
        </header>

        <div className="mb-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <p className="text-sm text-zinc-300">
            {copy.chosen}: <span className="font-semibold">{prefixCode || "-"}</span>
          </p>
          <p className="mt-1 text-lg font-semibold">{dimensionText}</p>
          {currentDepthEntry ? (
            <Link
              href={`/entry/${currentDepthEntry.code}?lang=${lang}`}
              className="mt-3 inline-block rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20"
            >
              {copy.openCurrent}: {currentDepthEntry.code}
            </Link>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {options.map((digit) => {
            const active = prefixDigits[stepIndex] === digit;
            const nextPrefix = buildNextPrefix(digit);
            const nextPrefixEntry = findEntryByCode(nextPrefix);
            return (
              <div
                key={digit}
                className={`rounded-xl border px-4 py-5 text-center transition ${
                  active
                    ? "border-cyan-400 bg-cyan-500/20"
                    : "border-white/10 bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                <div className="text-2xl font-semibold">{digit}</div>
                <div className="mt-3 flex flex-col gap-2">
                  <Link href={nextHref(digit)} className="rounded-md bg-cyan-500 px-3 py-1 text-sm font-medium text-black">
                    {copy.next}
                  </Link>
                  {nextPrefixEntry ? (
                    <Link
                      href={openCurrentHref(digit)}
                      className="rounded-md border border-white/20 px-3 py-1 text-xs hover:bg-zinc-700"
                    >
                      {copy.openAtStep}
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {currentEntry ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
            <p className="text-xs text-zinc-500">{currentEntry.code}</p>
            <p className="text-sm">{getLocalizedLabel(currentEntry.title, lang)}</p>
          </div>
        ) : null}

        <div className="mt-6">
          <Link href={backHref} className="rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-zinc-800">
            {copy.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
