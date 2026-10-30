const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'img', 'productos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Whey Isolate 2kg
const svgWhey = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#27272a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="tubGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="25%" stop-color="#27272a"/>
      <stop offset="50%" stop-color="#3f3f46"/>
      <stop offset="75%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ca8a04"/>
      <stop offset="50%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="50%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="500" height="500" rx="24" fill="url(#bgGlow)"/>
  <rect width="498" height="498" x="1" y="1" rx="23" fill="none" stroke="#27272a" stroke-width="2"/>
  
  <!-- Subtle circular grid / badge in background -->
  <circle cx="250" cy="250" r="180" fill="none" stroke="#facc15" stroke-opacity="0.05" stroke-dasharray="8 8"/>
  <circle cx="250" cy="250" r="140" fill="none" stroke="#ffffff" stroke-opacity="0.03"/>

  <!-- Product Shadow Base -->
  <ellipse cx="250" cy="445" rx="140" ry="22" fill="#000000" opacity="0.6"/>

  <!-- Product Container Group -->
  <g filter="url(#shadow)">
    <!-- Main Jar Body -->
    <rect x="135" y="130" width="230" height="295" rx="36" fill="url(#tubGrad)"/>
    
    <!-- Lid / Cap -->
    <rect x="165" y="75" width="170" height="58" rx="12" fill="#18181b" stroke="#3f3f46" stroke-width="2"/>
    <path d="M 175 88 L 325 88 M 175 98 L 325 98 M 175 108 L 325 108 M 175 118 L 325 118" stroke="#27272a" stroke-width="2"/>
    <rect x="180" y="65" width="140" height="14" rx="6" fill="#27272a"/>

    <!-- Gold Accent Ring between Cap and Tub -->
    <rect x="160" y="128" width="180" height="8" rx="3" fill="url(#goldGrad)"/>

    <!-- Front Label -->
    <rect x="145" y="155" width="210" height="240" rx="18" fill="url(#labelGrad)" stroke="#3f3f46" stroke-width="1.5"/>
    
    <!-- Label Header Gold Accent -->
    <path d="M 145 180 L 355 180" stroke="url(#goldGrad)" stroke-width="3"/>
    
    <!-- Brand Tag -->
    <text x="250" y="173" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="11" font-weight="900" letter-spacing="2">INFINITE FORCE &bull; ELITE</text>

    <!-- Product Title -->
    <text x="250" y="215" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="900" letter-spacing="1">100% WHEY</text>
    <text x="250" y="242" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="21" font-weight="800" letter-spacing="3">ISOLATE</text>

    <!-- Flavor Badge -->
    <rect x="170" y="260" width="160" height="24" rx="12" fill="#27272a" stroke="#ca8a04" stroke-width="1"/>
    <text x="250" y="276" text-anchor="middle" fill="#fef08a" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1">VAINILLA GOURMET</text>

    <!-- Nutritional Metrics Badge -->
    <g transform="translate(155, 300)">
      <rect x="0" y="0" width="58" height="42" rx="8" fill="#18181b" stroke="#3f3f46"/>
      <text x="29" y="18" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="900">27g</text>
      <text x="29" y="32" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="8" font-weight="600">PROTEIN</text>

      <rect x="66" y="0" width="58" height="42" rx="8" fill="#18181b" stroke="#3f3f46"/>
      <text x="95" y="18" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="13" font-weight="900">5.8g</text>
      <text x="95" y="32" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="8" font-weight="600">BCAA</text>

      <rect x="132" y="0" width="58" height="42" rx="8" fill="#18181b" stroke="#3f3f46"/>
      <text x="161" y="18" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="900">0g</text>
      <text x="161" y="32" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="8" font-weight="600">AZÚCAR</text>
    </g>

    <!-- Weight Tag -->
    <text x="250" y="375" text-anchor="middle" fill="#71717a" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="2">CONTENIDO NETO: 2.0 KG</text>
  </g>
</svg>`;

// 2. Creatina Monohidratada Creapure 300g
const svgCreatina = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgCreatina" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="creatinaJar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="25%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="75%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="shadowC" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <rect width="500" height="500" rx="24" fill="url(#bgCreatina)"/>
  <rect width="498" height="498" x="1" y="1" rx="23" fill="none" stroke="#1e293b" stroke-width="2"/>
  <circle cx="250" cy="250" r="170" fill="none" stroke="#06b6d4" stroke-opacity="0.08" stroke-dasharray="6 6"/>

  <!-- Shadow -->
  <ellipse cx="250" cy="440" rx="135" ry="20" fill="#000000" opacity="0.6"/>

  <g filter="url(#shadowC)">
    <!-- Tub Body -->
    <rect x="145" y="150" width="210" height="270" rx="30" fill="url(#creatinaJar)"/>
    
    <!-- Ribbed Cap -->
    <rect x="165" y="90" width="170" height="64" rx="10" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <path d="M 175 105 L 325 105 M 175 118 L 325 118 M 175 131 L 325 131 M 175 144 L 325 144" stroke="#1e293b" stroke-width="2"/>

    <!-- Cyan Accent Strip -->
    <rect x="155" y="150" width="190" height="6" fill="url(#cyanGrad)"/>

    <!-- Label -->
    <rect x="155" y="170" width="190" height="230" rx="16" fill="#090d16" stroke="#1e293b" stroke-width="1.5"/>

    <!-- Creapure Certified Stamp -->
    <rect x="180" y="185" width="140" height="24" rx="6" fill="#022c22" stroke="#059669" stroke-width="1.5"/>
    <text x="250" y="201" text-anchor="middle" fill="#34d399" font-family="system-ui, sans-serif" font-size="11" font-weight="900" letter-spacing="2">SELLO CREAPURE®</text>

    <!-- Main Title -->
    <text x="250" y="245" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="23" font-weight="900" letter-spacing="1">CREATINA</text>
    <text x="250" y="270" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="14" font-weight="800" letter-spacing="2">MONOHIDRATADA</text>
    <text x="250" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" font-weight="600" letter-spacing="1">100% MICRONIZADA &bull; ULTRA FINA</text>

    <!-- Strength & Power Graphic Icons -->
    <g transform="translate(170, 310)">
      <rect x="0" y="0" width="75" height="38" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <text x="37" y="17" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12" font-weight="900">FUERZA</text>
      <text x="37" y="30" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="8" font-weight="700">EXPLOSIVA</text>

      <rect x="85" y="0" width="75" height="38" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <text x="122" y="17" text-anchor="middle" fill="#34d399" font-family="system-ui, sans-serif" font-size="12" font-weight="900">POTENCIA</text>
      <text x="122" y="30" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="8" font-weight="700">ATP PURO</text>
    </g>

    <text x="250" y="380" text-anchor="middle" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="2">PESO NETO: 300G</text>
  </g>
</svg>`;

// 3. Pre-Entreno Nitro Blast 30 Serv
const svgPreworkout = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgNitro" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#450a0a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="nitroJar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#facc15"/>
    </linearGradient>
    <filter id="shadowN" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#ef4444" flood-opacity="0.25"/>
    </filter>
  </defs>

  <rect width="500" height="500" rx="24" fill="url(#bgNitro)"/>
  <rect width="498" height="498" x="1" y="1" rx="23" fill="none" stroke="#27272a" stroke-width="2"/>

  <!-- Energy Burst Aura -->
  <circle cx="250" cy="270" r="160" fill="none" stroke="#ef4444" stroke-opacity="0.1" stroke-dasharray="10 5"/>

  <ellipse cx="250" cy="440" rx="135" ry="20" fill="#000000" opacity="0.6"/>

  <g filter="url(#shadowN)">
    <!-- Tub Body -->
    <rect x="145" y="150" width="210" height="270" rx="30" fill="url(#nitroJar)"/>

    <!-- Red Matte Cap -->
    <rect x="165" y="90" width="170" height="64" rx="10" fill="#7f1d1d" stroke="#ef4444" stroke-width="2"/>
    <path d="M 175 105 L 325 105 M 175 120 L 325 120 M 175 135 L 325 135" stroke="#991b1b" stroke-width="2"/>

    <!-- Flame Accent Line -->
    <rect x="155" y="150" width="190" height="6" fill="url(#fireGrad)"/>

    <!-- Front Label -->
    <rect x="155" y="170" width="190" height="230" rx="16" fill="#09090b" stroke="#7f1d1d" stroke-width="1.5"/>

    <!-- Explosive Bolt Icon -->
    <path d="M 252 185 L 243 205 L 253 205 L 246 225 L 261 202 L 251 202 Z" fill="url(#fireGrad)"/>

    <!-- Product Title -->
    <text x="250" y="248" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="900" letter-spacing="2">NITRO BLAST</text>
    <text x="250" y="270" text-anchor="middle" fill="#f97316" font-family="system-ui, sans-serif" font-size="12" font-weight="900" letter-spacing="3">PRE-WORKOUT MATRIX</text>

    <!-- Flavor Tag -->
    <rect x="175" y="285" width="150" height="22" rx="11" fill="#450a0a" stroke="#ef4444" stroke-width="1"/>
    <text x="250" y="300" text-anchor="middle" fill="#fca5a5" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1">FRUIT PUNCH</text>

    <!-- Formula Highlights -->
    <g transform="translate(165, 320)">
      <rect x="0" y="0" width="52" height="36" rx="6" fill="#18181b" stroke="#27272a"/>
      <text x="26" y="16" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="11" font-weight="800">350mg</text>
      <text x="26" y="28" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="7" font-weight="600">CAFEÍNA</text>

      <rect x="58" y="0" width="52" height="36" rx="6" fill="#18181b" stroke="#27272a"/>
      <text x="84" y="16" text-anchor="middle" fill="#f97316" font-family="system-ui, sans-serif" font-size="11" font-weight="800">3.2g</text>
      <text x="84" y="28" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="7" font-weight="600">B-ALANINA</text>

      <rect x="116" y="0" width="52" height="36" rx="6" fill="#18181b" stroke="#27272a"/>
      <text x="142" y="16" text-anchor="middle" fill="#ef4444" font-family="system-ui, sans-serif" font-size="11" font-weight="800">6.0g</text>
      <text x="142" y="28" text-anchor="middle" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="7" font-weight="600">CITRULINA</text>
    </g>

    <text x="250" y="380" text-anchor="middle" fill="#fca5a5" font-family="system-ui, sans-serif" font-size="11" font-weight="800" letter-spacing="2">30 SERVICIOS &bull; ENERGÍA TOTAL</text>
  </g>
</svg>`;

// 4. Shaker Termico Acero Inoxidable 750ml
const svgShaker = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgShaker" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#27272a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="steelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3f3f46"/>
      <stop offset="20%" stop-color="#71717a"/>
      <stop offset="50%" stop-color="#e4e4e7"/>
      <stop offset="80%" stop-color="#71717a"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
    <linearGradient id="lidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <filter id="shadowS" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.7"/>
    </filter>
  </defs>

  <rect width="500" height="500" rx="24" fill="url(#bgShaker)"/>
  <rect width="498" height="498" x="1" y="1" rx="23" fill="none" stroke="#27272a" stroke-width="2"/>

  <!-- Shadow Base -->
  <ellipse cx="250" cy="450" rx="90" ry="16" fill="#000000" opacity="0.6"/>

  <g filter="url(#shadowS)">
    <!-- Loop Handle -->
    <path d="M 215 50 C 215 35, 285 35, 285 50 L 280 80 L 220 80 Z" fill="#27272a" stroke="#3f3f46" stroke-width="2"/>
    <ellipse cx="250" cy="52" rx="22" ry="10" fill="#09090b"/>

    <!-- Flip Spout Lid -->
    <rect x="200" y="70" width="100" height="35" rx="8" fill="#18181b"/>
    <rect x="225" y="65" width="50" height="15" rx="5" fill="#facc15"/>

    <!-- Main Lid Cap -->
    <path d="M 175 100 L 325 100 L 315 135 L 185 135 Z" fill="url(#lidGrad)" stroke="#3f3f46" stroke-width="2"/>
    <!-- Yellow Accent Gasket -->
    <rect x="183" y="132" width="134" height="6" fill="#facc15"/>

    <!-- Steel Bottle Body (Tapered) -->
    <path d="M 185 138 L 315 138 L 295 425 L 205 425 Z" fill="url(#steelGrad)" stroke="#52525b" stroke-width="1.5"/>

    <!-- Non-slip Base Silicone Ring -->
    <path d="M 203 415 L 297 415 L 293 435 L 207 435 Z" fill="#18181b"/>

    <!-- Laser Engraved Logo (Vertical) -->
    <g transform="translate(250, 275) rotate(-90)">
      <text x="0" y="5" text-anchor="middle" fill="#09090b" opacity="0.8" font-family="system-ui, sans-serif" font-size="16" font-weight="900" letter-spacing="4">INFINITE FORCE</text>
    </g>

    <!-- Volume & Spec Badge -->
    <rect x="210" y="375" width="80" height="22" rx="6" fill="#18181b" opacity="0.85"/>
    <text x="250" y="390" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="10" font-weight="800" letter-spacing="1">750 ML</text>
  </g>
</svg>`;

// 5. Cinturon Lumbar Powerlifting 10mm
const svgCinturon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgBelt" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#27272a" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="leatherGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="50%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="buckleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#52525b"/>
      <stop offset="50%" stop-color="#d4d4d8"/>
      <stop offset="100%" stop-color="#71717a"/>
    </linearGradient>
    <filter id="shadowB" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
  </defs>

  <rect width="500" height="500" rx="24" fill="url(#bgBelt)"/>
  <rect width="498" height="498" x="1" y="1" rx="23" fill="none" stroke="#27272a" stroke-width="2"/>

  <!-- Shadow Base -->
  <ellipse cx="250" cy="420" rx="170" ry="25" fill="#000000" opacity="0.6"/>

  <g filter="url(#shadowB)">
    <!-- Back Loop of Belt (Perspective Curve) -->
    <ellipse cx="250" cy="230" rx="160" ry="85" fill="none" stroke="#18181b" stroke-width="50"/>
    <ellipse cx="250" cy="230" rx="160" ry="85" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="6 4"/>

    <!-- Front Belt Section -->
    <path d="M 85 240 C 130 330, 370 330, 415 240 C 370 350, 130 350, 85 240 Z" fill="url(#leatherGrad)" stroke="#18181b" stroke-width="4"/>

    <!-- Heavy-Duty Stitching Line -->
    <path d="M 98 250 C 140 335, 360 335, 402 250" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="6 4"/>
    <path d="M 103 260 C 145 340, 355 340, 397 260" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="6 4"/>

    <!-- Steel Lever Buckle Unit (Center Front) -->
    <g transform="translate(195, 270)">
      <rect x="0" y="0" width="110" height="55" rx="8" fill="url(#buckleGrad)" stroke="#18181b" stroke-width="2"/>
      <!-- Screws / Rivets -->
      <circle cx="15" cy="15" r="4" fill="#18181b"/>
      <circle cx="15" cy="40" r="4" fill="#18181b"/>
      <circle cx="95" cy="15" r="4" fill="#18181b"/>
      <circle cx="95" cy="40" r="4" fill="#18181b"/>
      <!-- Lever Arm -->
      <rect x="30" y="16" width="65" height="22" rx="5" fill="#3f3f46" stroke="#27272a"/>
      <!-- Laser Logo on Lever -->
      <text x="62" y="31" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="9" font-weight="900" letter-spacing="1">IFG LEVER</text>
    </g>

    <!-- Adjustment Holes -->
    <circle cx="145" cy="275" r="4" fill="#09090b" stroke="#3f3f46" stroke-width="1.5"/>
    <circle cx="160" cy="283" r="4" fill="#09090b" stroke="#3f3f46" stroke-width="1.5"/>
    <circle cx="175" cy="290" r="4" fill="#09090b" stroke="#3f3f46" stroke-width="1.5"/>

    <!-- Specification Badge -->
    <g transform="translate(175, 370)">
      <rect x="0" y="0" width="150" height="28" rx="8" fill="#18181b" stroke="#3f3f46"/>
      <text x="75" y="18" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="10" font-weight="800" letter-spacing="1">POWERLIFTING 10MM</text>
    </g>
  </g>
</svg>`;

// 6. Glutamina Micronizada 500g
const svgGlutamina = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlut" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e1b4b" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="glutJar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="30%" stop-color="#27272a"/>
      <stop offset="50%" stop-color="#312e81"/>
      <stop offset="70%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <filter id="shadowG" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#6366f1" flood-opacity="0.2"/>
    </filter>
  </defs>

  <rect width="500" height="500" rx="24" fill="url(#bgGlut)"/>
  <rect width="498" height="498" x="1" y="1" rx="23" fill="none" stroke="#27272a" stroke-width="2"/>
  <circle cx="250" cy="250" r="160" fill="none" stroke="#818cf8" stroke-opacity="0.08" stroke-dasharray="6 6"/>

  <ellipse cx="250" cy="440" rx="135" ry="20" fill="#000000" opacity="0.6"/>

  <g filter="url(#shadowG)">
    <!-- Tub Body -->
    <rect x="145" y="150" width="210" height="270" rx="30" fill="url(#glutJar)"/>

    <!-- Indigo Cap -->
    <rect x="165" y="90" width="170" height="64" rx="10" fill="#1e1b4b" stroke="#4338ca" stroke-width="2"/>
    <path d="M 175 105 L 325 105 M 175 120 L 325 120 M 175 135 L 325 135" stroke="#312e81" stroke-width="2"/>

    <!-- Top Accent Line -->
    <rect x="155" y="150" width="190" height="6" fill="url(#indigoGrad)"/>

    <!-- Label -->
    <rect x="155" y="170" width="190" height="230" rx="16" fill="#09090b" stroke="#312e81" stroke-width="1.5"/>

    <!-- Clinical Tag -->
    <rect x="180" y="185" width="140" height="22" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1"/>
    <text x="250" y="200" text-anchor="middle" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="10" font-weight="800" letter-spacing="1">RECUPERACIÓN MUSCULAR</text>

    <!-- Main Title -->
    <text x="250" y="245" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="900" letter-spacing="1">GLUTAMINA</text>
    <text x="250" y="270" text-anchor="middle" fill="#a5b4fc" font-family="system-ui, sans-serif" font-size="13" font-weight="800" letter-spacing="2">100% MICRONIZADA</text>

    <!-- Feature Pillars -->
    <g transform="translate(170, 290)">
      <rect x="0" y="0" width="75" height="42" rx="8" fill="#18181b" stroke="#312e81"/>
      <text x="37" y="18" text-anchor="middle" fill="#818cf8" font-family="system-ui, sans-serif" font-size="12" font-weight="900">SISTEMA</text>
      <text x="37" y="32" text-anchor="middle" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="8" font-weight="700">INMUNE</text>

      <rect x="85" y="0" width="75" height="42" rx="8" fill="#18181b" stroke="#312e81"/>
      <text x="122" y="18" text-anchor="middle" fill="#facc15" font-family="system-ui, sans-serif" font-size="12" font-weight="900">ANTI</text>
      <text x="122" y="32" text-anchor="middle" fill="#c7d2fe" font-family="system-ui, sans-serif" font-size="8" font-weight="700">CATABÓLICO</text>
    </g>

    <text x="250" y="375" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="800" letter-spacing="2">CONTENIDO: 500 GRAMOS</text>
  </g>
</svg>`;

// Write each file
fs.writeFileSync(path.join(targetDir, 'whey-protein.svg'), svgWhey, 'utf8');
fs.writeFileSync(path.join(targetDir, 'creatina-creapure.svg'), svgCreatina, 'utf8');
fs.writeFileSync(path.join(targetDir, 'pre-entreno-nitro.svg'), svgPreworkout, 'utf8');
fs.writeFileSync(path.join(targetDir, 'shaker-inoxidable.svg'), svgShaker, 'utf8');
fs.writeFileSync(path.join(targetDir, 'cinturon-powerlifting.svg'), svgCinturon, 'utf8');
fs.writeFileSync(path.join(targetDir, 'glutamina-micronizada.svg'), svgGlutamina, 'utf8');

console.log('Successfully generated all 6 product SVG graphics in public/img/productos/');
