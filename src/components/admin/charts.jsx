// src/components/admin/charts.jsx — grafik SVG ringan tanpa library.
import { useId, useState } from "react";
import { niceMax, compactIDR, formatIDR } from "../../lib/adminStats";

// ── Grafik area/garis (pendapatan per hari) ─────────────────
export function AreaChart({ data, valueKey = "revenue", format = formatIDR, axisFormat = compactIDR }) {
  const gradId = useId();
  const [active, setActive] = useState(null);

  if (!data?.length) return null;

  const W = 640;
  const H = 210;
  const PL = 46; // ruang label sumbu Y
  const PR = 10;
  const PT = 12;
  const PB = 26;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const values = data.map((d) => d[valueKey]);
  const max = niceMax(Math.max(...values, 0));
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const pts = values.map((v, i) => [PL + i * step, PT + innerH * (1 - v / max)]);

  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L${last[0].toFixed(1)},${PT + innerH} L${pts[0][0].toFixed(1)},${PT + innerH} Z`;

  const idx = active ?? data.length - 1;
  const labelIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-neutral-400">{data[idx].label}</span>
        <span className="font-semibold text-white">{format(values[idx])}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Grafik pendapatan">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => {
          const y = PT + (innerH * i) / 3;
          return (
            <g key={i}>
              <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#e7e1d6" strokeWidth="1" />
              <text x={PL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#7a7268">
                {axisFormat(max * (1 - i / 3))}
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke="#059669" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />

        {labelIdx.map((i, n) => (
          <text
            key={n}
            x={pts[i][0]}
            y={H - 8}
            fontSize="10"
            fill="#7a7268"
            textAnchor={n === 0 ? "start" : n === 2 ? "end" : "middle"}
          >
            {data[i].label}
          </text>
        ))}

        <line x1={pts[idx][0]} x2={pts[idx][0]} y1={PT} y2={PT + innerH} stroke="#059669" strokeOpacity="0.4" strokeDasharray="3 3" />
        <circle cx={pts[idx][0]} cy={pts[idx][1]} r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" />

        {/* area sentuh/hover per hari */}
        {data.map((_, i) => (
          <rect
            key={i}
            x={pts[i][0] - (step || innerW) / 2}
            y={0}
            width={step || innerW}
            height={H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onTouchStart={() => setActive(i)}
            onClick={() => setActive(i)}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Daftar batang horizontal (produk terlaris) ──────────────
export function BarList({ items, valueKey = "qty", suffix = "x", color = "#059669" }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div key={it.name}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-neutral-200">{it.name}</span>
            <span className="shrink-0 text-neutral-400">
              {it[valueKey]}
              {suffix}
              {it.revenue ? <span className="ml-2 text-neutral-600">{compactIDR(it.revenue)}</span> : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(4, (it[valueKey] / max) * 100)}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donat (status pesanan) ──────────────────────────────────
export function Donut({ segments, centerLabel = "order" }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return null;

  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label="Status pesanan">
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#efebe4" strokeWidth="14" />
          {segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.key}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1c1a17">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#7a7268">
          {centerLabel}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 truncate text-neutral-300">{s.label}</span>
            <span className="text-neutral-500">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
