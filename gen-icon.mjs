import sharp from 'sharp';

const SIZE = 512;
const R = SIZE / 2;

// Helper: point on circle
const px = (angleDeg, r) => (R + Math.cos((angleDeg - 90) * Math.PI / 180) * r).toFixed(1);
const py = (angleDeg, r) => (R + Math.sin((angleDeg - 90) * Math.PI / 180) * r).toFixed(1);

// Light mode — playful & cute design:
// - Warm ivory bg (#F5F0E6) with a soft drop shadow inner ring
// - Creamy clock face (#FFFDF9)
// - Purple & teal accent hands (app accent colors: #7C3AED, #0891B2)
// - Cute round hour dots
// - 3 flag emoji city pins (Seoul 🇰🇷, Hanoi 🇻🇳, San Diego 🇺🇸)
// - Tiny sparkle stars in corners
// - Warm coral second hand
// - Overall: rounded, soft, friendly

const starPath = (cx, cy, r, pts = 4) => {
  const parts = [];
  for (let i = 0; i < pts * 2; i++) {
    const angle = (i * 180 / pts - 90) * Math.PI / 180;
    const rad = i % 2 === 0 ? r : r * 0.4;
    parts.push(`${i === 0 ? 'M' : 'L'}${(cx + Math.cos(angle) * rad).toFixed(1)},${(cy + Math.sin(angle) * rad).toFixed(1)}`);
  }
  return parts.join(' ') + ' Z';
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <!-- Warm ivory background gradient -->
    <radialGradient id="bgGrad" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#FFF9F0"/>
      <stop offset="100%" stop-color="#EDE5D8"/>
    </radialGradient>

    <!-- Clock face gradient — soft warm white -->
    <radialGradient id="faceGrad" cx="38%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F5F0E6"/>
    </radialGradient>

    <!-- Hour hand gradient: deep purple -->
    <linearGradient id="hourGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#5B21B6"/>
    </linearGradient>

    <!-- Minute hand gradient: teal -->
    <linearGradient id="minGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0891B2"/>
      <stop offset="100%" stop-color="#0E7490"/>
    </linearGradient>

    <!-- Outer ring gradient: purple → teal -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="50%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#0891B2"/>
    </linearGradient>

    <!-- Soft shadow filter -->
    <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#C4A882" flood-opacity="0.3"/>
    </filter>

    <!-- Face shadow -->
    <filter id="faceShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#B8A090" flood-opacity="0.2"/>
    </filter>

    <!-- Hand shadow -->
    <filter id="handShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="1" dy="2" stdDeviation="4" flood-color="#5B21B6" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background rounded square (iOS style corner radius) -->
  <rect width="${SIZE}" height="${SIZE}" rx="114" ry="114" fill="url(#bgGrad)"/>

  <!-- Decorative dots — scattered playfully in bg -->
  <circle cx="68"  cy="72"  r="7"  fill="#D8B4FE" opacity="0.55"/>
  <circle cx="448" cy="88"  r="5"  fill="#67E8F9" opacity="0.55"/>
  <circle cx="78"  cy="438" r="5"  fill="#67E8F9" opacity="0.50"/>
  <circle cx="440" cy="430" r="7"  fill="#D8B4FE" opacity="0.50"/>
  <circle cx="255" cy="48"  r="4"  fill="#FCA5A5" opacity="0.60"/>
  <circle cx="464" cy="256" r="4"  fill="#86EFAC" opacity="0.55"/>

  <!-- Sparkle stars in corners -->
  <path d="${starPath(96, 104, 18)}"  fill="#7C3AED" opacity="0.35"/>
  <path d="${starPath(416, 96, 14)}"  fill="#0891B2" opacity="0.35"/>
  <path d="${starPath(100, 416, 13)}" fill="#0891B2" opacity="0.30"/>
  <path d="${starPath(420, 418, 17)}" fill="#7C3AED" opacity="0.30"/>

  <!-- Outer decorative ring (dashed, playful) -->
  <circle cx="${R}" cy="${R}" r="${R - 38}" fill="none"
    stroke="url(#ringGrad)" stroke-width="3.5"
    stroke-dasharray="18 10" stroke-linecap="round" opacity="0.45"/>

  <!-- Clock face -->
  <circle cx="${R}" cy="${R}" r="${R - 64}" fill="url(#faceGrad)" filter="url(#faceShadow)"/>

  <!-- Clock face inner ring (subtle) -->
  <circle cx="${R}" cy="${R}" r="${R - 64}" fill="none"
    stroke="url(#ringGrad)" stroke-width="5" opacity="0.6"/>

  <!-- Hour markers: chunky rounded dots -->
  ${Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30;
    const mr = R - 100;
    const x = px(angle, mr);
    const y = py(angle, mr);
    const isQuarter = i % 3 === 0;
    return isQuarter
      ? `<circle cx="${x}" cy="${y}" r="9" fill="#7C3AED" opacity="0.75"/>`
      : `<circle cx="${x}" cy="${y}" r="5" fill="#C4B5FD" opacity="0.65"/>`;
  }).join('\n  ')}

  <!-- HOUR HAND — 10 o'clock (300°) — thick rounded purple -->
  <line x1="${R}" y1="${R}" x2="${px(300, R - 165)}" y2="${py(300, R - 165)}"
    stroke="url(#hourGrad)" stroke-width="22" stroke-linecap="round"
    filter="url(#handShadow)"/>

  <!-- MINUTE HAND — 2 o'clock (60°) — thinner teal -->
  <line x1="${R}" y1="${R}" x2="${px(60, R - 120)}" y2="${py(60, R - 120)}"
    stroke="url(#minGrad)" stroke-width="14" stroke-linecap="round"
    filter="url(#handShadow)"/>

  <!-- SECOND HAND — coral/red, slim -->
  <line x1="${px(180, 50)}" y1="${py(180, 50)}"
        x2="${px(0, R - 105)}" y2="${py(0, R - 105)}"
    stroke="#F87171" stroke-width="5" stroke-linecap="round" opacity="0.9"/>

  <!-- Center cap — layered circles -->
  <circle cx="${R}" cy="${R}" r="20" fill="white"/>
  <circle cx="${R}" cy="${R}" r="14" fill="url(#ringGrad)"/>
  <circle cx="${R}" cy="${R}" r="7"  fill="white"/>

  <!-- City flag emoji as text (rendered natively by SVG engines) -->
  <!-- 🇰🇷 Seoul — top right -->
  <text x="${(R + 112).toFixed(0)}" y="${(R - 80).toFixed(0)}"
    font-size="42" text-anchor="middle" dominant-baseline="middle">🇰🇷</text>
  <!-- 🇻🇳 Hanoi — right of center -->
  <text x="${(R + 105).toFixed(0)}" y="${(R + 10).toFixed(0)}"
    font-size="36" text-anchor="middle" dominant-baseline="middle">🇻🇳</text>
  <!-- 🇺🇸 San Diego — lower left -->
  <text x="${(R - 115).toFixed(0)}" y="${(R + 72).toFixed(0)}"
    font-size="38" text-anchor="middle" dominant-baseline="middle">🇺🇸</text>
</svg>`;

// Write SVG for preview
import { writeFileSync } from 'fs';
writeFileSync('/home/ubuntu/timezone/icon-draft.svg', svg);

// Generate PNG at 512×512
await sharp(Buffer.from(svg))
  .png()
  .toFile('/home/ubuntu/timezone/icon-512.png');

// Generate 192×192 version
await sharp(Buffer.from(svg))
  .resize(192, 192)
  .png()
  .toFile('/home/ubuntu/timezone/icon-192.png');

console.log('Icons generated: icon-512.png, icon-192.png');
