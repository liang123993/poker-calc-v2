// src/components/PnlChart.tsx
import React from 'react';

export interface PnlPoint {
    gameId: string | null;
    title: string;
    date: string;
    net: number;
    cumulative: number;
}

const W = 800;
const H = 320;
const PAD = { top: 20, right: 20, bottom: 36, left: 56 };

export default function PnlChart({ points }: { points: PnlPoint[] }) {
    if (points.length === 0) return null;

    const values = points.map(p => p.cumulative).concat(0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1; // flat line -> avoid divide by zero
    const pad = span * 0.1;
    const lo = min - pad;
    const hi = max + pad;

    const x = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * (W - PAD.left - PAD.right) : (W - PAD.left - PAD.right) / 2);
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

    const final = points[points.length - 1].cumulative;
    const color = final >= 0 ? '#4ade80' : '#f87171';
    const line = points.map((p, i) => `${x(i)},${y(p.cumulative)}`).join(' ');
    const area = `${x(0)},${y(lo)} ${line} ${x(points.length - 1)},${y(lo)}`;
    const money = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Profit and loss over time">
            <defs>
                <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {[hi, (hi + lo) / 2, lo].map((v, i) => (
                <g key={i}>
                    <line x1={PAD.left} y1={y(v)} x2={W - PAD.right} y2={y(v)} stroke="var(--color-border)" strokeWidth="1" />
                    <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--color-text-secondary)">
                        ${v.toFixed(0)}
                    </text>
                </g>
            ))}

            {lo < 0 && hi > 0 && (
                <line x1={PAD.left} y1={y(0)} x2={W - PAD.right} y2={y(0)} stroke="var(--color-text-secondary)" strokeWidth="1" strokeDasharray="4 4" />
            )}

            <polygon points={area} fill="url(#pnlFill)" />
            <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {points.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.cumulative)} r="4" fill={color} stroke="var(--color-background)" strokeWidth="1.5">
                    <title>{`${p.title}\n${new Date(p.date).toLocaleDateString()}\nGame: ${money(p.net)}\nTotal: ${money(p.cumulative)}`}</title>
                </circle>
            ))}

            <text x={PAD.left} y={H - 10} fontSize="12" fill="var(--color-text-secondary)">
                {new Date(points[0].date).toLocaleDateString()}
            </text>
            <text x={W - PAD.right} y={H - 10} textAnchor="end" fontSize="12" fill="var(--color-text-secondary)">
                {new Date(points[points.length - 1].date).toLocaleDateString()}
            </text>
        </svg>
    );
}
