"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLocalizedLabel, ismData, parseLanguage } from "@/lib/ism-data";

function WhatIsIsmismPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLanguage(searchParams.get("lang"));
  const backLabel = lang === "en" ? "Back" : "返回上一级";
  const overviewGroups = useMemo(
    () =>
      [
        {
          title: lang === "en" ? "Field (1st digit)" : "场域论（第1格）",
          codes: ["1", "2", "3", "4"],
        },
        {
          title: lang === "en" ? "Ontology (2nd digit)" : "本体论（第2格）",
          codes: ["1-1", "1-2", "1-3", "1-4"],
        },
        {
          title: lang === "en" ? "Epistemology (3rd digit)" : "认识论（第3格）",
          codes: ["1-1-1", "1-1-2", "1-1-3", "1-1-4"],
        },
        {
          title: lang === "en" ? "Teleology (4th digit)" : "目的论（第4格）",
          codes: ["1-1-1-1", "1-1-1-2", "1-1-1-3", "1-1-1-4"],
        },
      ].map((group) => ({
        ...group,
        items: group.codes
          .map((code) => {
            const entry = ismData.entries.find((item) => item.code === code);
            if (!entry) return null;
            return { code, label: getLocalizedLabel(entry.title, lang) };
          })
          .filter((item): item is { code: string; label: string } => item !== null),
      })),
    [lang],
  );

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 text-[var(--foreground)]">
      <section className="mx-auto w-full max-w-4xl rounded-none border border-white/15 bg-black/60 p-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.14em]">
            {lang === "en" ? "What is Ismism?" : "什么是主义主义？"}
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={backLabel}
            title={backLabel}
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
        </header>

        <article className="reader-pane space-y-4 rounded-none border border-white/12 bg-black/65 p-5 text-zinc-200">
          {lang === "en" ? (
            <>
              <p>
                Ismism is a structuralist philosophical taxonomy first developed by Liu Simo. Most of its exposition appears as videos published on
                Bilibili under the account Weimingzi. In Ismism, any doctrine, ideology, or worldview can be located by four coordinates, called the
                four &quot;cells&quot;:
              </p>
              <p>① Field: the ontological frame, the dimension in which meaning is posited.</p>
              <p>② Ontology: what there is, the content of being.</p>
              <p>③ Epistemology: subjective access, phenomenology.</p>
              <p>④ Teleology: direction of movement, ethics.</p>
              <p>
                The first three cells are more overtly philosophical; the fourth is more ethical. Enter integers from 1 to 4 in each cell to fix a
                position; taken together they name a specific ism. For each digit:
              </p>
              <p>1 means wholeness, homogeneity, identity, sameness, an endless cyclic motion—empty spinning.</p>
              <p>2 means split, antagonism, external inconsistency, conflictual motion, binary division.</p>
              <p>3 means compromise, mediation, centrality, a centralized downward motion—vertical fall.</p>
              <p>4 means void, impossibility, internal inconsistency, openness, a motion toward the unknown.</p>
              <p>When filling the coordinates, the first cell (Field) is decisive. In that cell:</p>
              <p>1: Subphysics / realism—non-reflective rule of field-order.</p>
              <p>2: Metaphysics—partial reflection, doubling of the field, conflict and opposition.</p>
              <p>3: Idealism—radical reflection, centralization of the field.</p>
              <p>4: Practice—failure of reflection, opening of the field.</p>
            </>
          ) : (
            <>
              <p>
                主义主义是一套结构主义哲学分类学体系，由刘司墨首发，其主要内容以视频的形式由 bilibili 网站的账号未明子发布。
                在主义主义中，任何一种思想、主义或意识形态都可以通过四个格定位，此四格分别为：
              </p>
              <p>① 场域论：本体论框架、意义存在的维度。</p>
              <p>② 本体论：存在性内容、存有论。</p>
              <p>③ 认识论：主体性感知、现象学。</p>
              <p>④ 目的论：运动方向、伦理学。</p>

              <p>
                其中，一二三格的哲学性更强，第四格的伦理学性更强。在格中填入 1 到 4 的整数可以定位一种思想、主义或意识形态，
                在四个整数中：
              </p>
              <p>1 表示整全、均质、同一性、一致性、一种无限的循环运动、空转。</p>
              <p>2 表示分裂、对抗、外在不一致性、一种冲突分裂的运动、二元分裂。</p>
              <p>3 表示妥协、调和、中介性、一种中心化的下坠运动、垂直下坠。</p>
              <p>4 表示虚无、不可能性、内在不一致性、开放性、一种敞开的运动、未知。</p>

              <p>在填入数字时，在第一格场域中填入的数字是决定性的，其中：</p>
              <p>1：形而下学/实在论，不反思，场域秩序的统治。</p>
              <p>2：形而上学，不彻底的反思，场域的二重化、冲突与对立。</p>
              <p>3：观念论，彻底的反思，场域的中心化。</p>
              <p>4：实践，反思的失败，场域的敞开。</p>
            </>
          )}
        </article>

        <section className="mt-4 space-y-3 rounded-none border border-white/12 bg-black/55 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">
            {lang === "en" ? "Coordinate Reference" : "坐标分层参考"}
          </h2>
          {overviewGroups.map((group) => (
            <div key={group.title} className="rounded-none border border-white/10 bg-black/35 p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">{group.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Link
                    key={`${group.title}-${item.code}`}
                    href={`/entry/${item.code}?lang=${lang}`}
                    className="rounded-none border border-white/20 bg-transparent px-3 py-1 text-xs text-zinc-200 transition-colors hover:border-white/60 hover:text-white"
                  >
                    {item.code} - {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

export default function WhatIsIsmismPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] px-6 py-8 text-[var(--foreground)]">
          <div className="mx-auto max-w-4xl animate-pulse rounded-none border border-white/10 bg-black/40 p-6 text-sm text-zinc-500">
            Loading…
          </div>
        </main>
      }
    >
      <WhatIsIsmismPageContent />
    </Suspense>
  );
}
