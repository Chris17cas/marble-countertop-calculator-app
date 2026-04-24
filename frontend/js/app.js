'use strict';

const API_URL = 'http://localhost:5000';
const BACKEND_ACTIVO = true;

const STATE = {
  mesonId:      'recto',
  materialId:   null,
  lavaActual:   null,
  mlCalculado:  0,
  historial:    [],
  catMatSel:    null,
  catLavaSel:   null,
  editandoMat:  null,
  editandoLava: null,
  _matData:     null,
  _lavaData:    null,
};

const BADGES = ['badge-blue', 'badge-slate', 'badge-indigo'];

const SVG_MAT_DEFAULT = `<svg width="100%" height="100%" viewBox="0 0 60 36">
  <rect x="2" y="2" width="56" height="32" rx="3" fill="#F1F5F9"/>
  <line x1="2" y1="18" x2="58" y2="18" stroke="#CBD5E1" stroke-width="0.8"/>
</svg>`;

const SVG_LAVA_NINGUNO = `<svg width="100%" height="100%" viewBox="0 0 64 40">
  <line x1="16" y1="10" x2="48" y2="30" stroke="#CBD5E1" stroke-width="2"/>
  <line x1="48" y1="10" x2="16" y2="30" stroke="#CBD5E1" stroke-width="2"/>
</svg>`;

const SVG_LAVA_DEFAULT = `<svg width="100%" height="100%" viewBox="0 0 64 44">
  <rect x="8" y="6" width="48" height="28" rx="5" fill="#DBEAFE" stroke="#93C5FD" stroke-width="0.8"/>
  <rect x="14" y="11" width="36" height="18" rx="3" fill="#BFDBFE" opacity="0.5"/>
  <circle cx="32" cy="39" r="3" fill="#94A3B8"/>
</svg>`;

// Valores de prueba
const MATERIALES_PRUEBA = [
  { id:1, nombre:'Marmol',      precio:'300000.00', imagen:null, bg:'#faf5ee' },
  { id:2, nombre:'Granito',     precio:'400000.00', imagen:null, bg:'#1a1a1a' },
  { id:3, nombre:'Quarzsstone', precio:'500000.00', imagen:null, bg:'#e8e8ec' },
];

const LAVAPLATOS_PRUEBA = [
  { id:1, nombre:'Sin lavaplatos',     precio:'0.00',      es_ninguno:true },
  { id:2, nombre:'Sencillo empotrar',  precio:'150000.00' },
  { id:3, nombre:'Sencillo submontar', precio:'200000.00' },
];

const CONFIG_PRUEBA = {
  manoObra:200000, precioHueco:100000, transpCerca:100000, transpLejos:200000
};

const $ = (id) => document.getElementById(id);

// Formato de numeros estilo colombiano
const fmt = (n) => {
  const num = Number(n);
  return '$' + num.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Formato de numeros sin signo $ (para m2, ml)
const fmtNum = (n) => Number(n).toLocaleString('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function getPrecio(mat) {
  return parseFloat(mat.precio) || 0;
}

function getMat() {
  const lista = STATE._matData || MATERIALES_PRUEBA;
  return lista.find(m => m.id === STATE.materialId) || lista[0] || null;
}

// Fetch con fallback
async function apiFetch(endpoint, fallback, opciones = {}) {
  if (!BACKEND_ACTIVO) return fallback;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(API_URL + endpoint, { signal: controller.signal, ...opciones });
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) {
    console.warn('[API] Error en ' + endpoint + ':', e.message);
    return fallback;
  }
}

// Carga de datos
async function cargarMateriales() {
  const data = await apiFetch('/materiales', MATERIALES_PRUEBA);
  STATE._matData   = data;
  STATE.materialId = data[0] ? data[0].id : 1;
  renderMatRow(data);
  renderCatMat(data);
  const mat = getMat();
  if (mat) {
    $('f-precio-mat').value    = getPrecio(mat);
    $('lbl-mat').textContent   = mat.nombre;
    $('strip-mat').textContent = mat.nombre;
  }
  calcular();
}

async function cargarLavaplatos() {
  const data = await apiFetch('/lavaplatos', LAVAPLATOS_PRUEBA);
  STATE._lavaData  = data;
  STATE.lavaActual = data[0] || null;
  renderLavaRow(data);
  renderCatLava(data);
  const lava = data[0];
  if (lava) {
    $('strip-lava').textContent   = lava.nombre;
    $('lbl-lava-sum').textContent = lava.nombre;
  }
}

async function cargarConfig() {
  const data = await apiFetch('/config', CONFIG_PRUEBA);
  CONFIG.manoObra    = data.manoObra    || CONFIG_PRUEBA.manoObra;
  CONFIG.precioHueco = data.precioHueco || CONFIG_PRUEBA.precioHueco;
  CONFIG.transpCerca = data.transpCerca || CONFIG_PRUEBA.transpCerca;
  CONFIG.transpLejos = data.transpLejos || CONFIG_PRUEBA.transpLejos;
  $('cfg-mo').value           = CONFIG.manoObra;
  $('cfg-hueco').value        = CONFIG.precioHueco;
  $('cfg-transp-cerca').value = CONFIG.transpCerca;
  $('cfg-transp-lejos').value = CONFIG.transpLejos;
}

// Render fila materiales
function renderMatRow(lista) {
  const row = $('mat-row');
  if (!row) return;
  row.innerHTML = lista.map(mat => `
    <div class="sel-card ${mat.id === STATE.materialId ? 'active' : ''}" data-mat-id="${mat.id}">
      <div class="sel-img" style="background:${mat.bg || '#F1F5F9'};">
        ${mat.imagen
          ? `<img src="${API_URL}/${mat.imagen}" alt="${mat.nombre}">`
          : SVG_MAT_DEFAULT}
      </div>
      <p class="sel-label">${mat.nombre}</p>
      <p class="sel-sub">${fmt(getPrecio(mat))}/m\u00b2</p>
    </div>
  `).join('');

  row.querySelectorAll('.sel-card').forEach(card => {
    card.addEventListener('click', () => {
      STATE.materialId = parseInt(card.dataset.matId);
      row.querySelectorAll('.sel-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const mat = getMat();
      if (!mat) return;
      $('strip-mat').textContent  = mat.nombre;
      $('lbl-mat').textContent    = mat.nombre;
      $('f-precio-mat').value     = getPrecio(mat);
      calcular();
    });
  });
}

// Render fila lavaplatos
function renderLavaRow(lista) {
  const row = $('lava-row');
  if (!row) return;
  row.innerHTML = lista.map(lava => `
    <div class="sel-card ${lava.es_ninguno ? 'none-card' : ''} ${STATE.lavaActual && lava.id === STATE.lavaActual.id ? 'active' : ''}"
         data-lava-id="${lava.id}">
      <div class="sel-img">
        ${lava.imagen
          ? `<img src="${API_URL}/${lava.imagen}" alt="${lava.nombre}">`
          : lava.es_ninguno ? SVG_LAVA_NINGUNO : SVG_LAVA_DEFAULT}
      </div>
      <p class="sel-label">${lava.nombre}</p>
      <p class="sel-sub">${parseFloat(lava.precio) > 0 ? fmt(parseFloat(lava.precio)) : '\u2014'}</p>
    </div>
  `).join('');

  row.querySelectorAll('.sel-card').forEach(card => {
    card.addEventListener('click', () => {
      const id   = parseInt(card.dataset.lavaId);
      const lava = (STATE._lavaData || LAVAPLATOS_PRUEBA).find(l => l.id === id);
      if (!lava) return;
      STATE.lavaActual = lava;
      row.querySelectorAll('.sel-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      $('strip-lava').textContent   = lava.nombre;
      $('lbl-lava-sum').textContent = lava.nombre;
      calcular();
    });
  });
}

// Render catalogo materiales
function renderCatMat(lista) {
  const grid = $('mat-catalogo');
  if (!grid) return;
  grid.innerHTML = lista.map(mat => `
    <div class="catalog-card ${STATE.catMatSel === mat.id ? 'selected' : ''}" data-cmat="${mat.id}">
      <div class="catalog-img" style="background:${mat.bg || '#F1F5F9'};">
        ${mat.imagen ? `<img src="${API_URL}/${mat.imagen}" alt="${mat.nombre}">` : ''}
      </div>
      <p class="catalog-name">${mat.nombre}</p>
      <p class="catalog-price">${fmt(getPrecio(mat))}/m\u00b2</p>
    </div>
  `).join('');
  grid.querySelectorAll('.catalog-card').forEach(card => {
    card.addEventListener('click', () => {
      STATE.catMatSel = parseInt(card.dataset.cmat);
      grid.querySelectorAll('.catalog-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

// Render catalogo lavaplatos
function renderCatLava(lista) {
  const grid = $('lava-catalogo');
  if (!grid) return;
  grid.innerHTML = lista.map(lava => `
    <div class="catalog-card ${STATE.catLavaSel === lava.id ? 'selected' : ''}" data-clava="${lava.id}">
      <div class="catalog-img">
        ${lava.imagen
          ? `<img src="${API_URL}/${lava.imagen}" alt="${lava.nombre}">`
          : lava.es_ninguno ? SVG_LAVA_NINGUNO : SVG_LAVA_DEFAULT}
      </div>
      <p class="catalog-name">${lava.nombre}</p>
      <p class="catalog-price">${parseFloat(lava.precio) > 0 ? fmt(parseFloat(lava.precio)) : '\u2014'}</p>
    </div>
  `).join('');
  grid.querySelectorAll('.catalog-card').forEach(card => {
    card.addEventListener('click', () => {
      STATE.catLavaSel = parseInt(card.dataset.clava);
      grid.querySelectorAll('.catalog-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}

// Medidas dinamicas
function renderMedidas(tipoId) {
  const tipo = TIPOS_MESON[tipoId];
  if (!tipo) return;
  $('esquema-svg').innerHTML = tipo.svgGrande;
  const esOtros = tipoId === 'otros';
  $('campos-medidas').innerHTML = tipo.campos.map(c => `
    <div>
      <div class="campo-row">
        <div class="campo-letra ${c.resta ? 'resta' : ''}">${c.id}</div>
        <input type="number" id="campo-${c.id}"
          placeholder="${c.label}" value="0" min="0"
          step="${esOtros ? '0.01' : '1'}" />
        <span class="campo-unit">${esOtros ? 'ml' : 'cm'}</span>
      </div>
      ${c.resta ? '<p class="campo-hint">-- se resta del metraje lineal</p>' : ''}
    </div>
  `).join('');
  tipo.campos.forEach(c => {
    const el = $('campo-' + c.id);
    if (el) el.addEventListener('input', actualizarML);
  });
  actualizarML();
}

function actualizarML() {
  const tipo    = TIPOS_MESON[STATE.mesonId];
  const esOtros = STATE.mesonId === 'otros';
  const vals    = {};
  tipo.campos.forEach(c => {
    const el = $('campo-' + c.id);
    const v  = parseFloat(el ? el.value : 0) || 0;
    vals[c.id] = esOtros ? v : v / 100;
  });
  STATE.mlCalculado = Math.max(0, tipo.ml(vals));
  const d = STATE.mlCalculado.toFixed(2);
  $('ml-total').textContent   = d + ' ml';
  $('r-ml-label').textContent = d;
  calcular();
}

// Calcular totales
function calcular() {
  const m2        = parseFloat($('f-m2').value)         || 0;
  const precioMat = parseFloat($('f-precio-mat').value) || 0;
  const usaMO     = parseInt($('f-mo').value)           || 0;
  const huecos    = parseInt($('f-huecos').value)       || 0;
  const angulo    = parseFloat($('f-angulo').value)     || 0;
  const transpSel = parseInt($('f-transp').value)       || 0;

  const cMat    = m2 * precioMat;
  const cMO     = usaMO ? STATE.mlCalculado * CONFIG.manoObra : 0;
  const cHuecos = huecos * CONFIG.precioHueco;
  const cLava   = STATE.lavaActual ? parseFloat(STATE.lavaActual.precio) || 0 : 0;
  const cTransp = transpSel === 1 ? CONFIG.transpCerca
                : transpSel === 2 ? CONFIG.transpLejos : 0;
  const total   = cMat + cMO + cHuecos + cLava + angulo + cTransp;

  const mat = getMat();
  if (mat) $('lbl-mat').textContent = mat.nombre;

  $('r-mat').textContent    = fmt(cMat);
  $('r-mo').textContent     = usaMO ? fmt(cMO) : 'Sin mano de obra';
  $('r-huecos').textContent = huecos > 0 ? huecos + ' und \u2014 ' + fmt(cHuecos) : '\u2014';
  $('r-lava').textContent   = cLava > 0  ? fmt(cLava)  : '\u2014';
  $('r-angulo').textContent = angulo > 0 ? fmt(angulo) : '\u2014';
  $('r-transp').textContent = cTransp > 0 ? fmt(cTransp) : '\u2014';
  $('r-total').textContent  = fmt(total);

  return { m2, total, cMat, cMO, cHuecos, cLava, angulo, cTransp };
}

// Historial
async function guardarCalculo() {
  const mat  = getMat();
  const tipo = TIPOS_MESON[STATE.mesonId];
  const res  = calcular();
  const fecha = new Date().toLocaleDateString('es-CL', {
    day:'2-digit', month:'2-digit', year:'numeric'
  });

  const datos = {
    tipo_meson:   tipo.nombre,
    material:     mat ? mat.nombre : '--',
    m2:           res.m2,
    ml:           STATE.mlCalculado,
    precio_mat:   parseFloat($('f-precio-mat').value) || 0,
    costo_mo:     res.cMO,
    costo_lava:   res.cLava,
    costo_hueco:  res.cHuecos,
    costo_angulo: res.angulo,
    costo_transp: res.cTransp,
    total:        res.total,
  };

  if (BACKEND_ACTIVO) {
    try {
      await fetch(API_URL + '/historial', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos),
      });
      await cargarHistorial();
    } catch(e) {
      console.warn('[API] No se pudo guardar en historial:', e.message);
      STATE.historial.unshift({ fecha, ...datos });
      renderHistorial();
    }
  } else {
    STATE.historial.unshift({ fecha, ...datos });
    renderHistorial();
  }
}

async function cargarHistorial() {
  if (!BACKEND_ACTIVO) return;
  try {
    const data = await fetch(API_URL + '/historial').then(r => r.json());
    STATE.historial = data.map(h => ({
      id:         h.id,
      fecha:      h.fecha,
      tipo_meson: h.tipo_meson,
      material:   h.material,
      m2:         parseFloat(h.m2),
      ml:         parseFloat(h.ml),
      total:      parseFloat(h.total),
    }));
    renderHistorial();
  } catch(e) {
    console.warn('[API] No se pudo cargar historial:', e.message);
  }
}

function renderHistorial() {
  const body = $('hist-body');
  if (!body) return;
  if (!STATE.historial.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty-row">No hay calculos guardados aun</td></tr>';
    return;
  }
  body.innerHTML = STATE.historial.map((h, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:11px;">${h.fecha || '--'}</td>
      <td><span class="badge ${BADGES[i % 3]}">${h.tipo_meson || h.meson || '--'}</span></td>
      <td>${h.material || '--'}</td>
      <td>${fmtNum(h.m2 || 0)}</td>
      <td>${fmtNum(h.ml || 0)}</td>
      <td style="font-weight:700;color:var(--blue-700);">${fmt(h.total || 0)}</td>
      <td><button class="btn-sm btn-danger" data-del="${h.id || i}" data-idx="${i}" style="padding:3px 8px;">&times;</button></td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.del;
      const idx = parseInt(btn.dataset.idx);
      if (BACKEND_ACTIVO && !isNaN(parseInt(id))) {
        try {
          await fetch(API_URL + '/historial/' + id, { method: 'DELETE' });
        } catch(e) {
          console.warn('[API] No se pudo eliminar del historial:', e.message);
        }
      }
      STATE.historial.splice(idx, 1);
      renderHistorial();
    });
  });
}

// CRUD Materiales
function initCrudMat() {
  $('btn-nuevo-mat').addEventListener('click', () => {
    STATE.editandoMat = null;
    $('form-mat-titulo').textContent = 'Nuevo material';
    $('mat-nombre').value = '';
    $('mat-precio').value = '';
    $('mat-imagen').value = '';
    toggleForm('form-mat', true);
  });

  $('btn-editar-mat').addEventListener('click', () => {
    if (!STATE.catMatSel) return alert('Selecciona un material primero');
    const lista = STATE._matData || MATERIALES_PRUEBA;
    const mat   = lista.find(m => m.id === STATE.catMatSel);
    if (!mat) return;
    STATE.editandoMat = mat.id;
    $('form-mat-titulo').textContent = 'Editar material';
    $('mat-nombre').value = mat.nombre;
    $('mat-precio').value = getPrecio(mat);
    toggleForm('form-mat', true);
  });

  $('btn-eliminar-mat').addEventListener('click', async () => {
    if (!STATE.catMatSel) return alert('Selecciona un material primero');
    if (!confirm('Eliminar este material?')) return;
    if (BACKEND_ACTIVO) {
      await apiFetch('/materiales/' + STATE.catMatSel, null, { method: 'DELETE' });
    }
    STATE.catMatSel = null;
    await cargarMateriales();
  });

  $('btn-guardar-mat').addEventListener('click', async () => {
    const nombre = $('mat-nombre').value.trim();
    const precio = $('mat-precio').value;
    const file   = $('mat-imagen').files[0];
    if (!nombre || !precio) return alert('Nombre y precio son obligatorios');

    if (BACKEND_ACTIVO) {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('precio', precio);
      if (file) formData.append('imagen', file);

      const url    = STATE.editandoMat
        ? API_URL + '/materiales/' + STATE.editandoMat
        : API_URL + '/materiales';
      const method = STATE.editandoMat ? 'PUT' : 'POST';

      try {
        await fetch(url, { method, body: formData });
      } catch(e) {
        console.warn('[API] Error guardando material:', e.message);
      }
    }

    toggleForm('form-mat', false);
    STATE.catMatSel = null;
    await cargarMateriales();
  });

  $('btn-cancelar-mat').addEventListener('click', () => toggleForm('form-mat', false));

  $('btn-guardar-cfg').addEventListener('click', async () => {
    CONFIG.manoObra    = parseFloat($('cfg-mo').value)           || 35;
    CONFIG.precioHueco = parseFloat($('cfg-hueco').value)        || 25;
    CONFIG.transpCerca = parseFloat($('cfg-transp-cerca').value) || 50;
    CONFIG.transpLejos = parseFloat($('cfg-transp-lejos').value) || 120;

    if (BACKEND_ACTIVO) {
      try {
        await fetch(API_URL + '/config', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            manoObra:    CONFIG.manoObra,
            precioHueco: CONFIG.precioHueco,
            transpCerca: CONFIG.transpCerca,
            transpLejos: CONFIG.transpLejos,
          }),
        });
      } catch(e) {
        console.warn('[API] Error guardando config:', e.message);
      }
    }
    calcular();
    alert('Configuracion guardada');
  });
}

// CRUD Lavaplatos
function initCrudLava() {
  $('btn-nuevo-lava').addEventListener('click', () => {
    STATE.editandoLava = null;
    $('form-lava-titulo').textContent = 'Nuevo lavaplatos';
    $('lava-nombre').value = '';
    $('lava-precio').value = '';
    $('lava-imagen').value = '';
    toggleForm('form-lava', true);
  });

  $('btn-editar-lava').addEventListener('click', () => {
    if (!STATE.catLavaSel) return alert('Selecciona un lavaplatos primero');
    const lista = STATE._lavaData || LAVAPLATOS_PRUEBA;
    const lava  = lista.find(l => l.id === STATE.catLavaSel);
    if (!lava) return;
    STATE.editandoLava = lava.id;
    $('form-lava-titulo').textContent = 'Editar lavaplatos';
    $('lava-nombre').value = lava.nombre;
    $('lava-precio').value = getPrecio(lava);
    toggleForm('form-lava', true);
  });

  $('btn-eliminar-lava').addEventListener('click', async () => {
    if (!STATE.catLavaSel) return alert('Selecciona un lavaplatos primero');
    const lista = STATE._lavaData || LAVAPLATOS_PRUEBA;
    const lava  = lista.find(l => l.id === STATE.catLavaSel);
    if (lava && lava.es_ninguno) return alert('No se puede eliminar Sin lavaplatos');
    if (!confirm('Eliminar este lavaplatos?')) return;
    if (BACKEND_ACTIVO) {
      await apiFetch('/lavaplatos/' + STATE.catLavaSel, null, { method: 'DELETE' });
    }
    STATE.catLavaSel = null;
    await cargarLavaplatos();
  });

  $('btn-guardar-lava').addEventListener('click', async () => {
    const nombre = $('lava-nombre').value.trim();
    const precio = $('lava-precio').value;
    const file   = $('lava-imagen').files[0];
    if (!nombre || !precio) return alert('Nombre y precio son obligatorios');

    if (BACKEND_ACTIVO) {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('precio', precio);
      if (file) formData.append('imagen', file);

      const url    = STATE.editandoLava
        ? API_URL + '/lavaplatos/' + STATE.editandoLava
        : API_URL + '/lavaplatos';
      const method = STATE.editandoLava ? 'PUT' : 'POST';

      try {
        await fetch(url, { method, body: formData });
      } catch(e) {
        console.warn('[API] Error guardando lavaplatos:', e.message);
      }
    }

    toggleForm('form-lava', false);
    STATE.catLavaSel = null;
    await cargarLavaplatos();
  });

  $('btn-cancelar-lava').addEventListener('click', () => toggleForm('form-lava', false));
}

// Tabs
function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('page-' + btn.dataset.page).classList.add('active');
      if (btn.dataset.page === 'hist') cargarHistorial();
    });
  });
}

// Tipo de meson
function initMesonCards() {
  document.querySelectorAll('#meson-row .sel-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#meson-row .sel-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      STATE.mesonId = card.dataset.meson;
      const tipo = TIPOS_MESON[STATE.mesonId];
      $('strip-meson').textContent = tipo ? tipo.nombre : STATE.mesonId;
      renderMedidas(STATE.mesonId);
    });
  });
}

// Inputs numericos
function initInputs() {
  ['f-m2', 'f-precio-mat', 'f-huecos', 'f-angulo'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', calcular);
  });
  ['f-mo', 'f-transp'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', calcular);
  });
}

// Historial botones
function initHistorial() {
  $('btn-guardar').addEventListener('click', guardarCalculo);
  $('btn-limpiar-hist').addEventListener('click', async () => {
    if (!STATE.historial.length) return;
    if (!confirm('Limpiar todo el historial?')) return;
    STATE.historial = [];
    renderHistorial();
  });
}

// Toggle formulario
function toggleForm(id, show) {
  const el = $(id);
  if (!el) return;
  el.style.display = (show === undefined)
    ? (el.style.display === 'none' ? 'block' : 'none')
    : (show ? 'block' : 'none');
}

// INIT
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initMesonCards();
  initInputs();
  initCrudMat();
  initCrudLava();
  initHistorial();
  renderMedidas('recto');
  renderHistorial();

  await Promise.all([
    cargarConfig(),
    cargarMateriales(),
    cargarLavaplatos(),
  ]);
});
