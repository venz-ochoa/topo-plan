//this is for the topographic lines used as decoration (the look of TopoPlan) and the small logo
//each ring is a closed curve with a gentle wobble, drawn a bit bigger than the one inside it
const RINGS = Array.from({ length: 12 }, (_, i) => {
const count = 40
const points = Array.from({ length: count }, (_, k) => {
    const a = (k / count) * 2 * Math.PI
    const wobble = 1 + 0.12 * Math.sin(3 * a + i * 0.5) + 0.07 * Math.sin(5 * a - i * 0.8) + 0.04 * Math.sin(2 * a + i)
    const r = 30 + i * 26
    return [300 + r * wobble * Math.cos(a) * 1.25, 300 + r * wobble * Math.sin(a)]
})
//this is for smoothing: the curve passes through the middle of each pair of points
const mid = (p, q) => ((p[0] + q[0]) / 2).toFixed(1) + ' ' + ((p[1] + q[1]) / 2).toFixed(1)
let d = 'M' + mid(points[count - 1], points[0])
points.forEach((p, k) => {
    d += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + mid(p, points[(k + 1) % count])
})
return d + 'Z'
})

//this is for the background lines (color them with text-... and fade them with opacity-...)
export function Contours({ className = '' }) {
return (
    <svg className={'contours ' + className} viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    {RINGS.map((d, i) => <path key={i} d={d} />)}
    </svg>
)
}

//this is for the logo: contour rings with a flag planted on the peak (the same picture as public/logo.svg)
export function Logo({ className = '' }) {
return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="16" cy="18" rx="14" ry="10" transform="rotate(-18 16 18)" />
    <ellipse cx="16" cy="18" rx="8.5" ry="6" transform="rotate(-18 16 18)" />
    <path d="M16 18V5" stroke="#fcfaf4" />
    <path d="M16 5l8 3.2-8 3.2z" fill="#e0532b" stroke="none" />
    <circle cx="16" cy="18" r="2.4" fill="#e0532b" stroke="#fcfaf4" strokeWidth="1.2" />
    </svg>
)
}

//this is for the small icons (one path each, drawn as a line so they all look alike)
const ICONS = {
dash: 'M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z',
bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
plus: 'M12 5v14M5 12h14',
user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
out: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
x: 'M6 6l12 12M18 6 6 18',
}

export function Icon({ name }) {
return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
    </svg>
)
}

//this is for a trail on a hill with a flag at the end, an ember dot walks it forever (it is the picture of "the path to the finish")
//it is light and sits right on the page: thin hill rings, a dotted cream trail, a small flag and a small glowing dot
const TRAIL = 'M12 100C46 100 40 68 78 70S120 46 148 52S178 52 188 32'
export function Trail({ className = '', tone = 'dark' }) {
//this is for the colors: 'dark' is for a dark background (the login screen), 'light' is for the paper cards
//on dark, the hill is drawn as three filled steps that are darker than the page, so the page's own lines stop at its edge and the trail stands out
const k = tone === 'light'
    ? { f1: 'none', f2: 'none', f3: 'none', ring: '#b4aa92', trail: '#1f5243', pole: '#1f5243', flag: '#e0532b', dot: '#e0532b', edge: '#fcfaf4' }
    : { f1: '#15291f', f2: '#101f18', f3: '#0b1712', ring: '#b4d3be', trail: '#fcfaf4', pole: '#fcfaf4', flag: '#ff7a4d', dot: '#ff7a4d', edge: '#fcfaf4' }
return (
    <svg className={className} viewBox="0 0 220 120" fill="none" strokeLinecap="round" aria-hidden="true">
    <g stroke={k.ring} strokeWidth="1.5">
        <ellipse cx="108" cy="78" rx="92" ry="37" fill={k.f1} />
        <ellipse cx="108" cy="78" rx="62" ry="25" fill={k.f2} />
        <ellipse cx="108" cy="78" rx="34" ry="13" fill={k.f3} />
    </g>
    <path d={TRAIL} stroke={k.trail} strokeWidth="3.4" strokeDasharray="0.1 8" />
    <path d="M188 32V8" stroke={k.pole} strokeWidth="2.4" />
    <path d="M188 8l16 6-16 6z" fill={k.flag} />
    <circle r="8" fill={k.dot} opacity="0.35">
        <animateMotion dur="5s" repeatCount="indefinite" path={TRAIL} />
        <animate attributeName="r" values="6;11;6" dur="1.6s" repeatCount="indefinite" />
    </circle>
    <circle r="5.5" fill={k.dot} stroke={k.edge} strokeWidth="2">
        <animateMotion dur="5s" repeatCount="indefinite" path={TRAIL} />
    </circle>
    </svg>
)
}

//this is for the waiting screen: the logo turns slowly
export function Loading() {
return <div className="loading"><Logo className="size-8 text-pine" /> Loading...</div>
}

//this is for the progress line of a project: a dotted trail, and a solid one that grows to the percent done
export function ProgressTrail({ percent, label }) {
const wave = 'M2 12Q27 0 52 12T102 12T152 12T198 12'
return (
    <div className="trail" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
    <svg viewBox="0 0 200 24" preserveAspectRatio="none">
        <path className="ahead" d={wave} />
        <path className="walked" d={wave} pathLength="100" style={{ strokeDasharray: percent + ' 100', opacity: percent ? 1 : 0 }} />
    </svg>
    </div>
    )
}