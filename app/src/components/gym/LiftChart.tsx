"use client";

import { useId } from "react";

export interface LiftChartDatum {
  date: string;
  value: number;
}

const W = 320;

function fmtNum(v: number): string {
  return String(Number(v.toFixed(1)));
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
}

export function LiftChart({
  data,
  color,
  height = 110,
  detailed = false,
  unit = "kg",
}: {
  data: LiftChartDatum[];
  color: string;
  height?: number;
  detailed?: boolean;
  unit?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const H = height;
  const padL = detailed ? 38 : 6;
  const padR = detailed ? 16 : 6;
  const padT = detailed ? 18 : 8;
  const padB = detailed ? 24 : 8;

  if (data.length === 0) return null;

  const vals = data.map((d) => d.value);
  const vmin = Math.min(...vals);
  const vmax = Math.max(...vals);
  const span = vmax - vmin;
  const pad = span > 0 ? span * 0.18 : Math.max(vmax * 0.15, 1);
  const lo = vmin - pad;
  const hi = vmax + pad;

  const x = (i: number) =>
    padL + (data.length === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (data.length - 1));
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  const linePath = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px} ${py}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${H - padB} L ${pts[0][0]} ${H - padB} Z`;
  const last = data[data.length - 1];
  const [lx, ly] = pts[pts.length - 1];

  const ticks = [hi, (hi + lo) / 2, lo];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="lift progression chart">
      <defs>
        <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {detailed &&
        ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 5"
            />
            <text
              x={padL - 6}
              y={y(t) + 3}
              textAnchor="end"
              className="font-mono"
              fontSize="9"
              fill="rgba(255,255,255,0.35)"
            >
              {fmtNum(t)}
            </text>
          </g>
        ))}

      {data.length > 1 && <path d={areaPath} fill={`url(#grad-${uid})`} />}
      {data.length > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={detailed ? 2.5 : 2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {pts.map(([px, py], i) => {
        const isLast = i === pts.length - 1;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={isLast ? (detailed ? 5 : 4) : detailed ? 3.5 : 2.5}
            fill="#101410"
            stroke={color}
            strokeWidth={detailed ? 2 : 1.5}
          />
        );
      })}

      {detailed && (
        <>
          <text
            x={Math.min(lx, W - padR - 30)}
            y={Math.max(ly - 12, 10)}
            textAnchor="middle"
            className="font-mono"
            fontSize="11"
            fill={color}
            fontWeight="bold"
          >
            {fmtNum(last.value)}
            {unit ? ` ${unit}` : ""}
          </text>
          <text
            x={padL}
            y={H - 6}
            className="font-mono"
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
          >
            {shortDate(data[0].date)}
          </text>
          <text
            x={W - padR}
            y={H - 6}
            textAnchor="end"
            className="font-mono"
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
          >
            {shortDate(last.date)}
          </text>
        </>
      )}
    </svg>
  );
}
