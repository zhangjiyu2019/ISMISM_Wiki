"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type WheelEvent } from "react";
import {
  LANGUAGE_KEY,
  READ_CODES_KEY,
  getLocalizedLabel,
  ismData,
  parseLanguage,
  type Language,
} from "@/lib/ism-data";
import { getHomeCopy } from "@/lib/ui-copy";

const defaultRotation = { x: -22, y: 28 };
const minDigit = 1;
const maxDigit = 4;
const minCubeScale = 0.72;
const maxCubeScale = 1.38;
type AxisVector = { x: number; y: number; z: number };
type PlaneKey = "xy" | "xz" | "yz";

function rotateVector(vector: AxisVector, rotateXDeg: number, rotateYDeg: number) {
  const rx = (rotateXDeg * Math.PI) / 180;
  const ry = (rotateYDeg * Math.PI) / 180;

  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);

  // Match CSS transform order: rotateY(...) then rotateX(...)
  const x1 = vector.x * cosY + vector.z * sinY;
  const z1 = -vector.x * sinY + vector.z * cosY;
  const y1 = vector.y;

  const x2 = x1;
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;

  return { x: x2, y: y2, z: z2 };
}

export default function Home() {
  const [lang, setLang] = useState<Language>("zh");
  const [readCodes, setReadCodes] = useState<string[]>([]);
  const [initializedFromBrowser, setInitializedFromBrowser] = useState(false);

  useEffect(() => {
    const queryValue = new URLSearchParams(window.location.search).get("lang");
    const queryLang = queryValue ? parseLanguage(queryValue) : null;
    const savedLangRaw = window.localStorage.getItem(LANGUAGE_KEY);
    const savedLang = savedLangRaw ? parseLanguage(savedLangRaw) : null;
    const nextLang = queryLang ?? savedLang ?? "zh";
    const readCodesRaw = window.localStorage.getItem(READ_CODES_KEY);
    let nextReadCodes: string[] = [];
    if (readCodesRaw) {
      try {
        const parsed = JSON.parse(readCodesRaw);
        nextReadCodes = Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === "string")
          : [];
      } catch {
        nextReadCodes = [];
      }
    }

    const timer = window.setTimeout(() => {
      setLang(nextLang);
      setReadCodes(nextReadCodes);
      setInitializedFromBrowser(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!initializedFromBrowser) return;
    window.localStorage.setItem(LANGUAGE_KEY, lang);
  }, [initializedFromBrowser, lang]);

  function switchLanguage(next: Language) {
    setLang(next);
    window.localStorage.setItem(LANGUAGE_KEY, next);
  }

  const t = getHomeCopy(lang, ismData.totalIndexedEntries);
  const [iDigit, setIDigit] = useState(1);
  const [rotation, setRotation] = useState(defaultRotation);
  const [cubeScale, setCubeScale] = useState(1);
  const [hoveredPlane, setHoveredPlane] = useState<PlaneKey | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [peelDepth, setPeelDepth] = useState({ x: 0, y: 0, z: 0 });
  const dragState = useRef<{ dragging: boolean; x: number; y: number }>({
    dragging: false,
    x: 0,
    y: 0,
  });

  const entryMap = useMemo(
    () => new Map(ismData.entries.map((entry) => [entry.code, entry])),
    [],
  );
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

  function resetOrigin() {
    setIDigit(1);
    setRotation(defaultRotation);
  }

  function setPlaneView(plane: PlaneKey) {
    if (plane === "xy") {
      setRotation({ x: 0, y: 0 });
      return;
    }
    if (plane === "xz") {
      setRotation({ x: -90, y: 0 });
      return;
    }
    setRotation({ x: 0, y: 90 });
  }

  function cycleDigit(value: number, step: 1 | -1) {
    if (step > 0) return value >= maxDigit ? minDigit : value + 1;
    return value <= minDigit ? maxDigit : value - 1;
  }

  function changeTeleology(step: 1 | -1) {
    setIDigit((current) => cycleDigit(current, step));
  }

  const cubeSpan = useMemo(() => {
    const xMin = 1;
    const yMin = 1;
    const zMin = 1 + peelDepth.z;
    const xCount = 4 - peelDepth.x;
    const yCount = 4 - peelDepth.y;
    const zCount = 4 - peelDepth.z;
    const xMax = xMin + xCount - 1;
    const yMax = yMin + yCount - 1;
    const zMax = zMin + zCount - 1;
    return { xMin, xMax, xCount, yMin, yMax, yCount, zMin, zMax, zCount };
  }, [peelDepth.x, peelDepth.y, peelDepth.z]);

  const surfaceTiles = useMemo(() => {
    type FaceName = "front" | "back" | "right" | "left" | "top" | "bottom";
    type Tile = {
      key: string;
      code: string;
      face: FaceName;
      title: string;
      exists: boolean;
      style: { transform: string };
    };
    const { xMin, xMax, yMin, yMax, zMin, zMax } = cubeSpan;
    const tiles: Tile[] = [];

    function cubeDistance(percent: number) {
      const ratio = percent / 100;
      return `calc(var(--cube-size) * ${ratio})`;
    }

    function toXCenter(x: number) {
      return (x - 2.5) * 25;
    }
    function toYCenter(y: number) {
      return (y - 2.5) * 25;
    }
    function toZCenter(z: number) {
      return (2.5 - z) * 25;
    }
    function addTile(x: number, y: number, z: number, face: FaceName, rotate: string, offset: { x: number; y: number; z: number }) {
      const code = `${x}-${y}-${z}-${iDigit}`;
      const entry = entryMap.get(code);
      const px = toXCenter(x) + offset.x;
      const py = -toYCenter(y) - offset.y;
      const pz = toZCenter(z) + offset.z;
      tiles.push({
        key: `${face}-${code}`,
        code,
        face,
        exists: Boolean(entry),
        title: entry ? getLocalizedLabel(entry.title, lang) : t.noEntry,
        style: {
          transform: `translate(-50%, -50%) translate3d(${cubeDistance(px)}, ${cubeDistance(py)}, ${cubeDistance(pz)}) ${rotate}`,
        },
      });
    }

    for (let y = yMax; y >= yMin; y -= 1) {
      for (let x = xMin; x <= xMax; x += 1) {
        addTile(x, y, zMin, "front", "", { x: 0, y: 0, z: 12.5 });
        addTile(x, y, zMax, "back", "rotateY(180deg)", { x: 0, y: 0, z: -12.5 });
      }
    }
    for (let y = yMax; y >= yMin; y -= 1) {
      for (let z = zMin; z <= zMax; z += 1) {
        addTile(xMax, y, z, "right", "rotateY(90deg)", { x: 12.5, y: 0, z: 0 });
        addTile(xMin, y, z, "left", "rotateY(-90deg)", { x: -12.5, y: 0, z: 0 });
      }
    }
    for (let z = zMax; z >= zMin; z -= 1) {
      for (let x = xMin; x <= xMax; x += 1) {
        addTile(x, yMax, z, "top", "rotateX(90deg)", { x: 0, y: 12.5, z: 0 });
        addTile(x, yMin, z, "bottom", "rotateX(-90deg)", { x: 0, y: -12.5, z: 0 });
      }
    }

    return tiles;
  }, [cubeSpan, entryMap, iDigit, lang, t.noEntry]);

  const axisLines = useMemo(() => {
    const centerX = 50;
    const centerY = 50;
    const scale = 30;
    const cameraDistance = 2.8;
    const vectors = [
      { key: "x", label: "X", color: "#f43f5e", vector: { x: 1, y: 0, z: 0 } },
      { key: "y", label: "Y", color: "#22c55e", vector: { x: 0, y: 1, z: 0 } },
      { key: "z", label: "Z", color: "#3b82f6", vector: { x: 0, y: 0, z: 1 } },
      { key: "i", label: "i", color: "#facc15", vector: { x: -0.55, y: -0.4, z: 0.2 } },
    ] as const;

    return vectors.map((item) => {
      const rotated = rotateVector(item.vector, rotation.x, rotation.y);
      const perspective = cameraDistance / (cameraDistance - rotated.z * 0.8);
      const endX = centerX + rotated.x * scale * perspective;
      const endY = centerY - rotated.y * scale * perspective;
      const labelOffsetX = rotated.x >= 0 ? 4 : -4;
      const labelOffsetY = rotated.y >= 0 ? -3 : 3;
      const defaultAnchor: "start" | "end" = rotated.x >= 0 ? "start" : "end";
      const labelAnchor: "start" | "end" = item.key === "i" ? "end" : defaultAnchor;
      const maxX = labelAnchor === "start" ? 72 : 96;
      const minX = item.key === "i" ? 44 : labelAnchor === "start" ? 4 : 28;
      return {
        ...item,
        x2: endX,
        y2: endY,
        labelAnchor,
        labelX: Math.max(minX, Math.min(maxX, endX + labelOffsetX)),
        labelY: Math.max(8, Math.min(95, endY + labelOffsetY)),
      };
    });
  }, [rotation.x, rotation.y]);

  const planePolygons = useMemo(() => {
    const [xAxis, yAxis, zAxis] = axisLines;
    function buildPlaneQuad(first: { x2: number; y2: number }, second: { x2: number; y2: number }) {
      const ux = first.x2 - 50;
      const uy = first.y2 - 50;
      const vx = second.x2 - 50;
      const vy = second.y2 - 50;
      const inner = 0.22;
      const outer = 0.56;

      const p1x = 50 + ux * inner + vx * inner;
      const p1y = 50 + uy * inner + vy * inner;
      const p2x = 50 + ux * outer + vx * inner;
      const p2y = 50 + uy * outer + vy * inner;
      const p3x = 50 + ux * outer + vx * outer;
      const p3y = 50 + uy * outer + vy * outer;
      const p4x = 50 + ux * inner + vx * outer;
      const p4y = 50 + uy * inner + vy * outer;

      return `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`;
    }

    return [
      {
        key: "xy" as const,
        points: buildPlaneQuad(xAxis, yAxis),
      },
      {
        key: "xz" as const,
        points: buildPlaneQuad(xAxis, zAxis),
      },
      {
        key: "yz" as const,
        points: buildPlaneQuad(yAxis, zAxis),
      },
    ];
  }, [axisLines]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a")) return;
    if (event.button !== 0) return;
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
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function onWheelScale(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const zoomDelta = -event.deltaY * 0.0012;
    setCubeScale((current) => {
      const next = current + zoomDelta;
      return Math.max(minCubeScale, Math.min(maxCubeScale, next));
    });
  }

  function onFaceClick(faceClass: "front" | "back" | "right" | "left" | "top" | "bottom", event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a")) return;
    if (faceClass === "top") changeTeleology(1);
    if (faceClass === "bottom") changeTeleology(-1);
  }

  function peelOne(axis: "x" | "y" | "z") {
    setPeelDepth((current) => ({
      ...current,
      [axis]: Math.min(3, current[axis] + 1),
    }));
  }

  function restoreOne(axis: "x" | "y" | "z") {
    setPeelDepth((current) => ({
      ...current,
      [axis]: Math.max(0, current[axis] - 1),
    }));
  }

  function resetLayerPeeling() {
    setPeelDepth({ x: 0, y: 0, z: 0 });
  }

  return (
    <main className="home-main text-[var(--foreground)]">
      <button
        type="button"
        className={`menu-toggle ${menuOpen ? "menu-toggle-open" : ""}`}
        onClick={() => setMenuOpen((current) => !current)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`left-drawer ${menuOpen ? "left-drawer-open" : ""}`}>
        <h2 className="text-center text-[1.1rem] font-semibold uppercase tracking-[0.18em] text-zinc-100">{t.title}</h2>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-none border border-white/20 bg-black/55 px-3 py-2">
          <span className="px-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">{t.language}</span>
          <button
            type="button"
            onClick={() => switchLanguage("zh")}
            className={`rounded-none border px-3 py-1 text-xs tracking-[0.1em] uppercase transition-colors ${
              lang === "zh" ? "border-white bg-white text-black" : "border-white/25 bg-transparent text-zinc-300 hover:border-white/55"
            }`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => switchLanguage("en")}
            className={`rounded-none border px-3 py-1 text-xs tracking-[0.1em] uppercase transition-colors ${
              lang === "en" ? "border-white bg-white text-black" : "border-white/25 bg-transparent text-zinc-300 hover:border-white/55"
            }`}
          >
            English
          </button>
        </div>

        <section className="mt-5 rounded-none border border-white/12 bg-black/55 p-4">
          <Link
            href={`/what-is-ismism?lang=${lang}`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center justify-between gap-3 rounded-none border border-white/20 bg-black/35 px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 transition-colors hover:border-white/60 hover:bg-black/55 hover:text-white"
          >
            <span>{t.whatIs}</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </section>

        <section className="mt-4 rounded-none border border-white/12 bg-black/55 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">
            {lang === "en" ? "Cube Layer Peeling" : "魔方层级剥离"}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {lang === "en"
              ? "Use left arrow to peel one layer, right arrow to restore."
              : "点击左箭头剥离一层，右箭头恢复一层。"}
          </p>
          <div className="mt-3 space-y-2">
            {[
              { axis: "z" as const, label: lang === "en" ? "Front (Z)" : "前层 (Z)", value: peelDepth.z },
              { axis: "x" as const, label: lang === "en" ? "Right (X)" : "右层 (X)", value: peelDepth.x },
              { axis: "y" as const, label: lang === "en" ? "Top (Y)" : "上层 (Y)", value: peelDepth.y },
            ].map((item) => (
              <div key={`peel-${item.axis}`} className="flex items-center gap-2 rounded-none border border-white/12 bg-black/50 px-2 py-2">
                <button
                  type="button"
                  onClick={() => peelOne(item.axis)}
                  className="rounded-none border border-white/30 bg-transparent px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-white/65 hover:text-white"
                >
                  ◀
                </button>
                <div className="flex-1 text-xs text-zinc-300">
                  {item.label}: {item.value}
                </div>
                <button
                  type="button"
                  onClick={() => restoreOne(item.axis)}
                  className="rounded-none border border-white/30 bg-transparent px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-white/65 hover:text-white"
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={resetLayerPeeling}
            className="mt-3 w-full rounded-none border border-white/25 bg-transparent px-3 py-2 text-xs uppercase tracking-[0.12em] text-zinc-200 transition-colors hover:border-white/65 hover:text-white"
          >
            {lang === "en" ? "Reset Layer Peeling" : "重置层级剥离"}
          </button>
        </section>

        <Link
          href={`/select/1?lang=${lang}`}
          onClick={() => setMenuOpen(false)}
          className="mt-5 block rounded-none border border-white/80 bg-transparent px-4 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
        >
          {t.start}
        </Link>

        <Link
          href={`/reading-records?lang=${lang}`}
          onClick={() => setMenuOpen(false)}
          className="mt-3 block rounded-none border border-white/12 bg-black/55 p-4 transition-colors hover:border-white/55 hover:bg-black/70"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-300">{t.readingRecords}</h3>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {t.readProgress}: {readCodeSet.size} / {ismData.entries.length}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={`level-${index + 1}`} className="rounded-none border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-400">
                {lang === "en" ? `L${index + 1}` : `第${index + 1}级`}: {levelStats.reads[index]} / {levelStats.totals[index]}
              </div>
            ))}
          </div>
        </Link>

        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.12em] text-zinc-600">{t.indexed}</p>
      </aside>

      <div className="axis-panel">
        <svg
          viewBox="0 0 100 100"
          className="axis-svg"
          aria-label="coordinate axis"
          onMouseLeave={() => setHoveredPlane(null)}
        >
          {planePolygons.map((plane) => (
            <polygon
              key={plane.key}
              points={plane.points}
              className={`axis-plane ${hoveredPlane === plane.key ? "axis-plane-active" : ""}`}
              onMouseEnter={() => setHoveredPlane(plane.key)}
              onMouseDown={(event) => {
                if (event.button !== 0) return;
                setPlaneView(plane.key);
              }}
            />
          ))}
          <circle
            cx="50"
            cy="50"
            r="5"
            className="axis-origin"
            onClick={resetOrigin}
          />
          {axisLines.map((axis) => (
            <g key={axis.key}>
              <line
                x1="50"
                y1="50"
                x2={axis.x2}
                y2={axis.y2}
                stroke={axis.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={axis.key === "i" ? "6 4" : undefined}
              />
              <text
                x={axis.labelX}
                y={axis.labelY}
                textAnchor={axis.labelAnchor}
                fill={axis.color}
                fontSize="8.5"
                fontWeight="700"
              >
                {axis.key === "x"
                  ? t.field
                  : axis.key === "y"
                    ? t.ontology
                    : axis.key === "z"
                      ? t.epistemology
                      : t.teleology}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <section className={`cube-shell ${menuOpen ? "cube-shell-shifted" : ""}`}>
        <div
          className="cube-wrap flex min-h-[78vh] cursor-grab items-center justify-center active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheelScale}
          onMouseLeave={() => setHoveredCode(null)}
        >
          <div className="cube-stage">
            <div
              className="cube"
              style={{ transform: `scale(${cubeScale}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
            >
              {surfaceTiles.map((tile) =>
                tile.exists ? (
                  <Link
                    key={tile.key}
                    href={`/entry/${tile.code}?lang=${lang}`}
                    onMouseEnter={() => setHoveredCode(tile.code)}
                    className={`cube-tile cube-front-cell cube-front-cell-active ${
                      hoveredCode === tile.code ? "cube-cell-hovered" : ""
                    } ${tile.face === "front" ? "cube-front-rich" : "cube-side-compact"}`}
                    style={tile.style}
                  >
                    <div className="cube-cell-code">{tile.code}</div>
                    <div className={`cube-cell-title ${tile.face === "front" ? "" : "cube-side-title"}`}>{tile.title}</div>
                  </Link>
                ) : (
                  <button
                    key={tile.key}
                    type="button"
                    className={`cube-tile cube-front-cell cube-front-cell-empty ${
                      tile.face === "front" ? "cube-front-rich" : "cube-side-compact"
                    }`}
                    style={tile.style}
                    onClick={(event) => onFaceClick(tile.face, event)}
                  >
                    <div className="cube-cell-code text-zinc-500">{tile.code}</div>
                    <div className={`cube-cell-title text-zinc-500 ${tile.face === "front" ? "" : "cube-side-title"}`}>
                      {tile.title}
                    </div>
                  </button>
                ),
              )}
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
