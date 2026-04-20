"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DIGIT_OPTIONS,
  dimensionLabels,
  findEntryByCode,
  getLocalizedLabel,
  ismData,
  parseCode,
  parseLanguage,
} from "@/lib/ism-data";

type GraphNode = {
  col: 0 | 1 | 2 | 3;
  value: number | null;
  x: number;
  y: number;
  id: string;
};

const graphDimensionColors = [
  { accent: "rgb(251 113 133 / 0.95)", soft: "rgb(251 113 133 / 0.35)" },
  { accent: "rgb(52 211 153 / 0.95)", soft: "rgb(52 211 153 / 0.35)" },
  { accent: "rgb(56 189 248 / 0.95)", soft: "rgb(56 189 248 / 0.35)" },
  { accent: "rgb(250 204 21 / 0.95)", soft: "rgb(250 204 21 / 0.35)" },
] as const;

export default function StepSelectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLanguage(searchParams.get("lang"));
  const initialCode = parseCode(searchParams.get("code")) ?? parseCode(searchParams.get("prefix")) ?? "1-1-1-1";
  const initialDigits = initialCode.split("-").map(Number);
  const [digits, setDigits] = useState<[number, number | null, number | null, number | null]>([
    initialDigits[0] ?? 1,
    initialDigits[1] ?? null,
    initialDigits[2] ?? null,
    initialDigits[3] ?? null,
  ]);

  const copy =
    lang === "en"
      ? {
          title: "Layered Navigation",
          empty: "",
          layered: "Coordinate graph",
          mapping: "Ideology mapping",
          noEntry: "No exact entry for this coordinate",
        }
      : {
          title: "分层导航",
          empty: "",
          layered: "坐标网络图",
          mapping: "意识形态对应",
          noEntry: "该坐标没有精确词条",
        };

  const optionsByDimension = useMemo(
    () => [0, 1, 2, 3].map((index) => ismData.dimensions[index] ?? DIGIT_OPTIONS),
    [],
  );
  const selectedRows = useMemo(() => {
    const rows: Array<{
      level: 0 | 1 | 2 | 3;
      dimension: string;
      code: string | null;
      label: string;
      entryExists: boolean;
    }> = [];
    let blocked = false;
    for (let index = 0; index < 4; index += 1) {
      const value = digits[index];
      const level = index as 0 | 1 | 2 | 3;
      if (blocked || value === null) {
        blocked = true;
        rows.push({
          level,
          dimension: dimensionLabels[lang][index],
          code: null,
          label: copy.empty,
          entryExists: false,
        });
        continue;
      }
      const code = digits.slice(0, index + 1).join("-");
      const entry = findEntryByCode(code);
      rows.push({
        level,
        dimension: dimensionLabels[lang][index],
        code,
        label: entry ? getLocalizedLabel(entry.title, lang) : copy.noEntry,
        entryExists: Boolean(entry),
      });
    }
    return rows;
  }, [copy.empty, copy.noEntry, digits, lang]);

  const graphColumns = useMemo(
    () =>
      [
        optionsByDimension[0].map((value) => value),
        [null, ...optionsByDimension[1]],
        [null, ...optionsByDimension[2]],
        [null, ...optionsByDimension[3]],
      ] as const,
    [optionsByDimension],
  );

  function updateDigit(index: 0 | 1 | 2 | 3, value: number | null) {
    setDigits((current) => {
      const next: [number, number | null, number | null, number | null] = [...current] as [
        number,
        number | null,
        number | null,
        number | null,
      ];
      next[index] = value;
      if (index <= 1 && value === null) {
        next[2] = null;
        next[3] = null;
      }
      if (index === 2 && value === null) {
        next[3] = null;
      }
      return next;
    });
  }

  const graphNodes = useMemo(() => {
    const xPositions = [10, 36, 62, 88] as const;
    const topPadding = 12;
    const bottomPadding = 88;
    const columns: GraphNode[][] = graphColumns.map((column, colIndex) => {
      const rowGap = (bottomPadding - topPadding) / Math.max(1, column.length - 1);
      return column.map((value, rowIndex) => ({
        col: colIndex as 0 | 1 | 2 | 3,
        value,
        x: xPositions[colIndex],
        y: topPadding + rowIndex * rowGap,
        id: `${colIndex}-${value === null ? "empty" : value}`,
      }));
    });
    return columns;
  }, [graphColumns]);

  const graphEdges = useMemo(() => {
    const edges: Array<{ from: GraphNode; to: GraphNode }> = [];
    for (let col = 0; col < graphNodes.length - 1; col += 1) {
      for (const fromNode of graphNodes[col]) {
        for (const toNode of graphNodes[col + 1]) {
          if (fromNode.value === null && toNode.value !== null) continue;
          edges.push({ from: fromNode, to: toNode });
        }
      }
    }
    return edges;
  }, [graphNodes]);

  function isNodeDisabled(node: GraphNode) {
    if (node.col === 0) return false;
    return digits[node.col - 1] === null && node.value !== null;
  }

  function isNodeHighlighted(node: GraphNode) {
    return digits[node.col] === node.value;
  }

  function isEdgeHighlighted(from: GraphNode, to: GraphNode) {
    return digits[from.col] === from.value && digits[to.col] === to.value;
  }

  function onGraphNodeClick(node: GraphNode) {
    if (isNodeDisabled(node)) return;
    updateDigit(node.col, node.value);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 text-[var(--foreground)]">
      <section className="mx-auto w-full max-w-5xl rounded-none border border-white/15 bg-black/55 p-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.16em]">{copy.title}</h1>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={copy.back}
            title={copy.back}
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

        <section className="rounded-none border border-white/12 bg-black/55 p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-none border border-white/12 bg-black/65 p-3">
            <svg viewBox="0 0 100 100" className="w-full aspect-[10/9] max-h-[68vh]">
              {graphEdges.map((edge) => (
                <line
                  key={`${edge.from.id}->${edge.to.id}`}
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke={isEdgeHighlighted(edge.from, edge.to) ? "rgb(255 255 255 / 0.78)" : "rgb(113 113 122 / 0.35)"}
                  strokeWidth={isEdgeHighlighted(edge.from, edge.to) ? 1.9 : 1}
                />
              ))}

              {graphNodes.flat().map((node) => {
                const disabled = isNodeDisabled(node);
                const highlighted = isNodeHighlighted(node);
                const color = graphDimensionColors[node.col];
                const fill = highlighted ? "rgb(250 250 250 / 0.95)" : disabled ? "rgb(82 82 91 / 0.4)" : "rgb(39 39 42 / 0.95)";
                const stroke = highlighted ? color.accent : color.soft;
                const label = node.value === null ? copy.empty : String(node.value);

                return (
                  <g key={node.id} onClick={() => onGraphNodeClick(node)} style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
                    <circle cx={node.x} cy={node.y} r={3.9} fill={fill} stroke={stroke} strokeWidth={0.8} />
                    <text
                      x={node.x}
                      y={node.y + 1.2}
                      textAnchor="middle"
                      fontSize="3.2"
                      fontWeight="700"
                      fill={highlighted ? "rgb(0 0 0)" : "rgb(228 228 231)"}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {dimensionLabels[lang].map((name, index) => (
                <text
                  key={`col-name-${name}`}
                  x={[10, 36, 62, 88][index]}
                  y={5.6}
                  textAnchor="middle"
                  fontSize="2.8"
                  fill={graphDimensionColors[index].accent}
                >
                  {name}
                </text>
              ))}
            </svg>
            </div>
            <aside className="rounded-none border border-white/12 bg-black/65 p-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-200">{copy.mapping}</h2>
              <div className="mt-3 space-y-2">
                {selectedRows.map((row) => {
                  const color = graphDimensionColors[row.level];
                  const className = "rounded-none border px-3 py-2 text-sm transition-colors";
                  if (row.code && row.entryExists) {
                    return (
                      <Link
                        key={`row-${row.level}`}
                        href={`/entry/${row.code}?lang=${lang}`}
                        className={`${className} block hover:text-white`}
                        style={{
                          borderColor: color.soft,
                          color: color.accent,
                          background: "rgb(0 0 0 / 0.35)",
                        }}
                      >
                        <div className="text-[11px] uppercase tracking-[0.08em] opacity-80">{row.dimension}</div>
                        <div className="mt-0.5 text-zinc-100">{row.label}</div>
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={`row-${row.level}`}
                      className={className}
                      style={{
                        borderColor: color.soft,
                        color: "rgb(161 161 170)",
                        background: "rgb(0 0 0 / 0.25)",
                      }}
                    >
                      <div className="text-[11px] uppercase tracking-[0.08em] opacity-80">{row.dimension}</div>
                      <div className="mt-0.5">{row.label}</div>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

      </section>
    </main>
  );
}
