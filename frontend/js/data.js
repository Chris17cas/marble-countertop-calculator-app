//app.js cargarMateriales(), cargarLavaplatos()


'use strict';
//se sobre eecribe en el endponint GET

const CONFIG = {
  manoObra:     0,
  precioHueco:  0,
  transpCerca:  0,
  transpLejos: 0,
};

//se mantienen en el frontend valores fijos
const TIPOS_MESON = {

  recto: {
    nombre: 'Recto',
    campos: [
      { id: 'a', label: 'Largo del mesón', resta: false }
    ],
    formula: 'ML = a',
    ml: (c) => c.a,
    svgGrande: `<svg width="100%" height="100" viewBox="0 0 200 85">
      <rect x="14" y="22" width="172" height="32" rx="3" fill="#DBEAFE" stroke="#2563EB" stroke-width="1.5"/>
      <line x1="14" y1="64" x2="186" y2="64" stroke="#2563EB" stroke-width="1" stroke-dasharray="5,3" opacity="0.6"/>
      <line x1="14" y1="59" x2="14" y2="69" stroke="#2563EB" stroke-width="2"/>
      <line x1="186" y1="59" x2="186" y2="69" stroke="#2563EB" stroke-width="2"/>
      <text x="100" y="80" text-anchor="middle" font-size="16" fill="#1D4ED8" font-weight="700" font-family="Inter,sans-serif">a</text>
    </svg>`
  },

  ele: {
    nombre: 'ELE',
    campos: [
      { id: 'a', label: 'Largo tramo horizontal', resta: false },
      { id: 'b', label: 'Alto tramo vertical',    resta: false },
      { id: 'c', label: 'Ancho del mesón (resta)', resta: true  },
    ],
    formula: 'ML = a + b − c',
    ml: (c) => Math.max(0, c.a + c.b - c.c),
    svgGrande: `<svg width="100%" height="120" viewBox="0 0 200 115">
      <rect x="10" y="10" width="162" height="26" rx="3" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <rect x="142" y="10" width="28" height="84" rx="3" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="10" y1="4" x2="172" y2="4" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="10" y1="0" x2="10" y2="8" stroke="#475569" stroke-width="2"/>
      <line x1="172" y1="0" x2="172" y2="8" stroke="#475569" stroke-width="2"/>
      <text x="91" y="13" text-anchor="middle" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">a</text>
      <line x1="184" y1="10" x2="184" y2="94" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="180" y1="10" x2="188" y2="10" stroke="#475569" stroke-width="2"/>
      <line x1="180" y1="94" x2="188" y2="94" stroke="#475569" stroke-width="2"/>
      <text x="196" y="55" text-anchor="middle" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">b</text>
      <line x1="142" y1="108" x2="170" y2="108" stroke="#94A3B8" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>
      <line x1="142" y1="104" x2="142" y2="112" stroke="#94A3B8" stroke-width="2"/>
      <line x1="170" y1="104" x2="170" y2="112" stroke="#94A3B8" stroke-width="2"/>
      <text x="156" y="115" text-anchor="middle" font-size="13" fill="#94A3B8" font-weight="700" font-family="Inter,sans-serif">c</text>
    </svg>`
  },

  barra: {
    nombre: 'Barra 2-3 lados',
    campos: [
      { id: 'a', label: 'Largo del mesón',  resta: false },
      { id: 'b', label: 'Lado de la barra', resta: false },
    ],
    formula: 'ML = a + b',
    ml: (c) => c.a + c.b,
    svgGrande: `<svg width="100%" height="100" viewBox="0 0 200 85">
      <rect x="14" y="22" width="172" height="32" rx="3" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="14" y1="64" x2="186" y2="64" stroke="#475569" stroke-width="1" stroke-dasharray="5,3" opacity="0.5"/>
      <line x1="14" y1="59" x2="14" y2="69" stroke="#475569" stroke-width="2"/>
      <line x1="186" y1="59" x2="186" y2="69" stroke="#475569" stroke-width="2"/>
      <text x="100" y="78" text-anchor="middle" font-size="16" fill="#334155" font-weight="700" font-family="Inter,sans-serif">a</text>
      <line x1="194" y1="22" x2="194" y2="54" stroke="#475569" stroke-width="1" stroke-dasharray="5,3" opacity="0.5"/>
      <line x1="190" y1="22" x2="198" y2="22" stroke="#475569" stroke-width="2"/>
      <line x1="190" y1="54" x2="198" y2="54" stroke="#475569" stroke-width="2"/>
      <text x="200" y="41" text-anchor="start" font-size="15" fill="#334155" font-weight="700" font-family="Inter,sans-serif"> b</text>
    </svg>`
  },

  isla: {
    nombre: 'Isla',
    campos: [
      { id: 'a', label: 'Alto lado izquierdo', resta: false },
      { id: 'b', label: 'Ancho lado superior', resta: false },
      { id: 'c', label: 'Alto lado derecho',   resta: false },
    ],
    formula: 'ML = a + b + c',
    ml: (c) => c.a + c.b + c.c,
    svgGrande: `<svg width="100%" height="115" viewBox="0 0 200 108">
      <rect x="24" y="14" width="152" height="76" rx="3" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="8" y1="14" x2="8" y2="90" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="4" y1="14" x2="12" y2="14" stroke="#475569" stroke-width="2"/>
      <line x1="4" y1="90" x2="12" y2="90" stroke="#475569" stroke-width="2"/>
      <text x="8" y="55" text-anchor="middle" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">a</text>
      <line x1="24" y1="4" x2="176" y2="4" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="24" y1="0" x2="24" y2="8" stroke="#475569" stroke-width="2"/>
      <line x1="176" y1="0" x2="176" y2="8" stroke="#475569" stroke-width="2"/>
      <text x="100" y="13" text-anchor="middle" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">b</text>
      <line x1="192" y1="14" x2="192" y2="90" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="188" y1="14" x2="196" y2="14" stroke="#475569" stroke-width="2"/>
      <line x1="188" y1="90" x2="196" y2="90" stroke="#475569" stroke-width="2"/>
      <text x="200" y="55" text-anchor="start" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">c</text>
    </svg>`
  },

  mesonbarra: {
    nombre: 'Mesón + Barra',
    campos: [
      { id: 'a', label: 'Largo mesón (hasta la barra)', resta: false },
      { id: 'b', label: 'Alto de la barra',             resta: false },
      { id: 'c', label: 'Ancho de la barra',            resta: false },
    ],
    formula: 'ML = a + b + c',
    ml: (c) => c.a + c.b + c.c,
    svgGrande: `<svg width="100%" height="120" viewBox="0 0 200 115">
      <rect x="8" y="22" width="96" height="28" rx="3" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <rect x="98" y="22" width="34" height="78" rx="3" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="8" y1="12" x2="98" y2="12" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="8" y1="8" x2="8" y2="16" stroke="#475569" stroke-width="2"/>
      <line x1="98" y1="8" x2="98" y2="16" stroke="#475569" stroke-width="2"/>
      <text x="53" y="10" text-anchor="middle" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">a</text>
      <line x1="146" y1="22" x2="146" y2="100" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="142" y1="22" x2="150" y2="22" stroke="#475569" stroke-width="2"/>
      <line x1="142" y1="100" x2="150" y2="100" stroke="#475569" stroke-width="2"/>
      <text x="158" y="63" text-anchor="start" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">b</text>
      <line x1="98" y1="110" x2="132" y2="110" stroke="#475569" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>
      <line x1="98" y1="106" x2="98" y2="114" stroke="#475569" stroke-width="2"/>
      <line x1="132" y1="106" x2="132" y2="114" stroke="#475569" stroke-width="2"/>
      <text x="115" y="115" text-anchor="middle" font-size="14" fill="#334155" font-weight="700" font-family="Inter,sans-serif">c</text>
    </svg>`
  },

  otros: {
    nombre: 'Otros',
    campos: [
      { id: 'ml', label: 'Metraje lineal total', resta: false }
    ],
    formula: 'Ingreso manual',
    ml: (c) => c.ml,
    svgGrande: `<svg width="100%" height="100" viewBox="0 0 200 90">
      <text x="100" y="42" text-anchor="middle" font-size="36" fill="#CBD5E1">✦</text>
      <text x="100" y="62" text-anchor="middle" font-size="12" fill="#94A3B8" font-family="Inter,sans-serif">Forma personalizada</text>
      <text x="100" y="78" text-anchor="middle" font-size="11" fill="#CBD5E1" font-family="Inter,sans-serif">Ingresa el metraje manualmente</text>
    </svg>`
  },

};
