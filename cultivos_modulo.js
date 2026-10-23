/* cultivos_modulo.js — sección «Cultivos» de la PWA de campo (v12).

   Mismo patrón que los demás módulos de la PWA (crearFotos, crearMapaCampo…):
       const cultivos = crearCultivos('cultivosContainer', { fechaVisita: '2026-10-23' });
       reg.lotes_cultivo = cultivos.getData();      // al construir el registro
       cultivos.setData(d.lotes_cultivo || []);     // al cargar un registro en edición
   Así los cultivos viajan DENTRO del mismo _Db.json del avalúo rural: un solo
   archivo por visita, el mismo id, la misma carpeta, la misma importación.

   Requiere: cultivos_catalogo.js, cultivos_calculos.js, cultivos_diagramas.js.
   Opcional: fotos.js (crearFotos) para las fotos por lote.

   Lo que NO hace este módulo, a propósito: valorar. Aquí se capta lo que se ve,
   se mide y se informa; la valoración vive en la plataforma (Análisis → Cultivos)
   con el mismo motor de cálculo. Lo único que se calcula en campo es lo que
   sirve para saber si el muestreo alcanza (promedio, CV, puntos que faltan).
*/
(function (g) {
  'use strict';
  const K = g.CultivosCatalogo, CC = g.CultivosCalc, D = g.CultivosDiagramas;
  const VERSION_ESQUEMA = 1;

  // ------------------------------------------------------------------ util
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = (n, d = 2) => (n === null || n === undefined || !Number.isFinite(n)) ? '—' : n.toLocaleString('es-CO', { maximumFractionDigits: d });
  const rango = (a, u = '', d = 2) => a ? `${fmt(a[0], d)}–${fmt(a[1], d)}${u ? ' ' + u : ''}` : '—';
  const nid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
  function setPath(o, path, v) {
    const ks = path.split('.'); let a = o;
    for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; }
    a[ks[ks.length - 1]] = v;
  }
  const ICONO = { papa: '🥔', yuca: '🍠', arracacha: '🥕', zanahoria: '🥕', cebolla_bulbo: '🧅', cebolla_rama: '🌿', ajo: '🧄', tomate: '🍅',
    arveja: '🫛', frijol: '🫘', haba: '🫛', cebada: '🌾', trigo: '🌾', avena: '🌾', quinua: '🌾', maiz: '🌽', cana_panelera: '🎋', cafe: '☕',
    cacao: '🍫', platano: '🍌', banano: '🍌', tomate_arbol: '🍅', mora: '🫐', uchuva: '🟠', lulo: '🟠', fresa: '🍓', pitahaya: '🌵',
    pera: '🍐', manzana: '🍎', durazno: '🍑', ciruela: '🟣', feijoa: '🥝', aguacate: '🥑', naranja: '🍊', mandarina: '🍊', limon: '🍋',
    guayaba: '🍈', guanabana: '🍈', arandano: '🫐', gulupa: '🟣', granadilla: '🟡', curuba: '🟡', otro: '🌱' };

  // Listas cerradas: lo que se filtra o agrupa después NO puede ser texto libre.
  const OP = {
    objeto: [['establecido', 'Cultivo establecido'], ['pendiente', 'Producción pendiente'], ['afectacion', 'Daño / afectación'],
      ['lucro', 'Producción dejada de percibir'], ['infraestructura', 'Infraestructura asociada']],
    sistema: ['Campo abierto', 'Invernadero', 'Casa malla / macrotúnel', 'Agroforestal / con sombrío', 'Asociado / intercalado'],
    base_edad: ['Documento / registro', 'Fecha dicha por el productor', 'Estimación en campo', 'No determinada'],
    fuente_area: ['Medida GPS / mapa de campo', 'Medida con cinta', 'Plano / documento', 'Dicha por el productor', 'Estimada a ojo'],
    base_plantas: ['Conteo completo', 'Conteo por surcos', 'Dicho por el productor', 'Calculado del marco'],
    disposicion: [['cuadro', 'En cuadro'], ['tresbolillo', 'Tres bolillo'], ['surco', 'En surcos'], ['cama', 'En camas / eras'], ['voleo', 'Al voleo / chorrillo']],
    nivel: ['Alto', 'Medio', 'Bajo'],
    estado: ['Bueno', 'Regular', 'Deficiente', 'Muy deficiente'],
    renovacion: ['No aplica', 'No hay', 'Parcial', 'Reciente', 'Programada'],
    soporte: ['No aplica', 'Bueno', 'Regular', 'Deficiente'],
    riego: ['Lluvia', 'Gravedad', 'Aspersión', 'Goteo', 'Microaspersión', 'Mixto'],
    sino: ['Sí', 'No'],
    condicion: ['Buena', 'Regular', 'Deficiente'],
    fuente: ['Observación directa', 'Documento / registro', 'Productor / administrador', 'Mixta'],
    intensidad: ['Ninguna', 'Leve', 'Moderada', 'Alta', 'Severa'],
    rend_unidad: ['kg/planta', 'kg/ha', 't/ha', 'unid. de venta/ha'],
    etapa_costo: [['establecimiento', 'Establecimiento'], ['sostenimiento', 'Sostenimiento'], ['cosecha', 'Cosecha'], ['comercializacion', 'Comercialización']],
  };
  const val = (o) => Array.isArray(o) ? o[0] : o, lab = (o) => Array.isArray(o) ? o[1] : o;

  // ---------------------------------------------------------- lote nuevo
  function nuevoLote(especie, n) {
    const c = K.get(especie);
    return {
      id: nid('lc'), version_esquema: VERSION_ESQUEMA, catalogo_version: K.META.version,
      especie: c.id, especie_nombre: c.nombre, eva_nombre: c.eva || null,
      nombre_lote: `Lote ${n}`, objeto: [],
      identificacion: { variedad: null, patron: null, sistema: null },
      edad: { fecha_siembra: null, fecha_trasplante: null, fecha_primera_cosecha: null, edad_meses: null, base_edad: null, etapa: null },
      geometria: { area_cultivo_ha: null, area_medida_ha: null, fuente_area: null, area_productiva_pct: null,
        disposicion: c.disposicion || null, dist_surcos_m: null, dist_plantas_m: null, plantas_total: null, base_plantas: null,
        lat: null, lng: null, precision_m: null },
      estado: { vivas_pct: null, productivas_pct: null, descarte_pct: null, uniformidad: null, vigor: null, estado_general: null,
        renovacion: null, vida_remanente_meses: null },
      arquitectura: { altura_m: null, copa_m: null, tronco_cm: null, soporte_estado: null },
      variables: {},
      muestreo: { metodo: 'Recorrido en W', criterio: null, puntos: [] },
      etapas_pct: {},
      manejo: { riego: null, fertirriego: null, sombra_pct: null, nutricion: null, poda: null, malezas: null, suelo: null, drenaje: null, fuente: null, notas: null },
      sanidad: { intensidad: null, area_afectada_pct: null, unidades_afectadas_pct: null, parte_afectada: null, riesgos_observados: [], fuente: null, signos: null, factor: null },
      produccion_informada: { cosechado_kg: null, cosechas_n: null, frecuencia: null, fecha_proxima_cosecha: null, rendimiento_valor: null,
        rendimiento_unidad: null, produccion_anual_kg: null, informante: null },
      mercado_informado: { precio: null, unidad_venta: c.venta.unidad, kg_por_unidad: c.venta.kg, precio_min: null, precio_max: null,
        comprador: null, fecha_precio: null, notas: null },
      costos_informados: [], infraestructura: [], fotos: [],
      documentos: { plano: false, costos: false, ventas: false, tecnicos: false, contratos: false, detalle: null },
      observaciones: null, limitaciones: null,
      creado: new Date().toISOString(), actualizado: new Date().toISOString(),
    };
  }
  function nuevoPunto(prev) {
    return { id: nid('pt'), zona: prev ? prev.zona : '', unidades: null, productivas: null, valores: {}, estado: null, obs: null, lat: null, lng: null, precision_m: null };
  }

  // ------------------------------------------------------------- estilos
  function estilos() {
    if (document.getElementById('cv-styles')) return;
    const st = document.createElement('style'); st.id = 'cv-styles';
    st.textContent = `
.cv{--cv-acc:var(--green,#188038);--dg-ink:var(--text,#202124);--dg-muted:var(--gray,#5F6368);--dg-line:var(--gray-border,#DADCE0);--dg-bg:#FBFCFA;--dg-soil:#B89A72;--dg-leaf:#4E8A3A;--dg-leaf2:#86AD62;--dg-stem:#7B5A3A;--dg-accent2:#C0392B;font-size:14px;color:var(--text,#202124)}
html.oscuro .cv{--dg-bg:#1A1E22;--dg-soil:#8A6F4E;--dg-leaf:#6FA451;--dg-leaf2:#4C7A38;--dg-stem:#A57E55;--dg-accent2:#FF8A7A}
.cv *{box-sizing:border-box}
.cv-bar{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;-webkit-overflow-scrolling:touch}
.cv-lote{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:18px;border:1.5px solid var(--gray-border,#DADCE0);background:var(--white,#fff);color:var(--text);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.cv-lote.on{border-color:var(--cv-acc);background:var(--green-light,#E6F4EA);font-weight:600}
.cv-lote .b{font-size:10px;padding:1px 6px;border-radius:9px;background:#F9DEDC;color:#8C1D18}
.cv-lote .b.ok{background:#C4EED0;color:#0D652D}
html.oscuro .cv-lote .b{background:#4A1F1C;color:#F2B8B5} html.oscuro .cv-lote .b.ok{background:#173A23;color:#A8DAB5}
.cv-add{border-style:dashed;color:var(--gray)}
.cv-head{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-bottom:8px}
.cv-head .del{background:none;border:1px solid var(--gray-border);border-radius:8px;color:#D93025;padding:8px 10px;cursor:pointer;font-size:15px}
.cv-tabs{display:flex;gap:4px;border-bottom:1.5px solid var(--gray-border,#DADCE0);margin:4px 0 10px;overflow-x:auto;position:sticky;top:0;background:var(--white,#fff);z-index:5}
.cv-tabs button{flex:1 0 auto;background:none;border:0;border-bottom:3px solid transparent;padding:9px 5px 7px;font:inherit;font-size:12px;color:var(--gray);cursor:pointer;white-space:nowrap}
.cv-tabs button.on{color:var(--cv-acc);border-bottom-color:var(--cv-acc);font-weight:700}
.cv-tabs .n{display:inline-block;min-width:16px;padding:0 4px;margin-left:3px;border-radius:8px;font-size:10px;background:#F9DEDC;color:#8C1D18}
html.oscuro .cv-tabs .n{background:#4A1F1C;color:#F2B8B5}
.cv-sec{margin:12px 0 6px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--gray)}
.cv-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 10px}
.cv-g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.cv-f{min-width:0}.cv-f.full{grid-column:1/-1}
.cv-f label{display:block;font-size:11.5px;font-weight:500;color:var(--gray);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cv-f .u{font-weight:400;opacity:.8}
.cv input,.cv select,.cv textarea{width:100%;padding:8px 9px;font-size:14.5px;border:1.5px solid var(--gray-border,#DADCE0);border-radius:8px;background:var(--white,#fff);color:var(--text);font-family:inherit;outline:none;min-height:38px}
.cv textarea{min-height:58px;resize:vertical;line-height:1.4}
.cv input:focus,.cv select:focus,.cv textarea:focus{border-color:var(--cv-acc);box-shadow:0 0 0 3px rgba(24,128,56,.12)}
.cv input[readonly]{background:var(--gray-light,#F1F3F4);color:var(--gray)}
.cv .calc{font-size:11px;color:var(--cv-acc);margin-top:3px;min-height:13px}
.cv-chips{display:flex;flex-wrap:wrap;gap:5px}
.cv-chip{padding:6px 10px;border-radius:16px;font-size:12.5px;cursor:pointer;border:1.5px solid var(--gray-border);background:var(--white,#fff);color:var(--gray);user-select:none}
.cv-chip.on{background:var(--green-light,#E6F4EA);border-color:var(--cv-acc);color:var(--cv-acc);font-weight:600}
html.oscuro .cv-chip.on{background:#1B402A;border-color:#81C995;color:#CEEAD6}
.cv-btn{padding:9px 12px;border-radius:8px;border:1.5px solid var(--cv-acc);background:var(--white,#fff);color:var(--cv-acc);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.cv-btn.pri{background:var(--cv-acc);color:#fff}
.cv-btns{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.cv-btns .cv-btn{flex:1;min-width:110px}
.cv-hint{font-size:12px;line-height:1.45;color:var(--gray);background:var(--gray-light,#F1F3F4);border-left:3px solid var(--cv-acc);padding:8px 10px;border-radius:6px;margin:8px 0}
.cv-pt{border:1px solid var(--gray-border);border-radius:10px;padding:8px;margin-bottom:8px;background:var(--white,#fff)}
.cv-pt-h{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.cv-pt-h b{font-size:13px;min-width:26px}
.cv-pt-h input{flex:1;min-height:32px;padding:5px 8px;font-size:13px}
.cv-pt-h button{background:none;border:1px solid var(--gray-border);border-radius:7px;padding:5px 8px;cursor:pointer;font-size:13px;color:var(--text)}
.cv-pt-h .x{color:#D93025}
.cv-pt .kg{font-size:11.5px;color:var(--cv-acc);margin-top:5px;font-weight:600}
.cv-pt .gps{font-size:10.5px;color:var(--gray)}
.cv-pt .cv-g{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.cv-pt input,.cv-pt select{min-height:34px;padding:6px 7px;font-size:14px}
.cv-pt .cv-f label{white-space:normal;line-height:1.15;font-size:10.5px;min-height:24px;display:flex;align-items:flex-end}
.cv-res{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0}
.cv-k{border:1px solid var(--gray-border);border-radius:9px;padding:7px 8px;background:var(--gray-light,#F1F3F4)}
.cv-k span{display:block;font-size:10.5px;color:var(--gray)}
.cv-k strong{display:block;font-size:15px;margin-top:1px;color:var(--text)}
.cv-alert{font-size:12px;padding:6px 9px;border-radius:7px;margin:4px 0;background:#FEF7E0;color:#7A4F01;border:1px solid #F9E1A2}
.cv-alert.bad{background:#FCE8E6;color:#8C1D18;border-color:#F6C6C2}
html.oscuro .cv-alert{background:#33260F;color:#F5D58A;border-color:#6B5518}
html.oscuro .cv-alert.bad{background:#3A1614;color:#F2B8B5;border-color:#6E2B27}
.cv-tab table{width:100%;border-collapse:collapse;font-size:12.5px}
.cv-tab td,.cv-tab th{border-bottom:1px solid var(--gray-border);padding:5px 4px;text-align:left;vertical-align:middle}
.cv-tab th{font-size:10.5px;color:var(--gray);text-transform:uppercase}
.cv-tab td input,.cv-tab td select{min-height:32px;padding:5px 6px;font-size:13px}
/* ficha */
.cv-id{display:flex;gap:10px;align-items:center;margin:2px 0 8px}
.cv-id .ic{font-size:30px;width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:var(--green-light,#E6F4EA)}
.cv-id h3{margin:0;font-size:18px}.cv-id i{color:var(--gray);font-size:12.5px}
.cv-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.cv-tags span{font-size:10.5px;padding:2px 7px;border-radius:9px;background:var(--gray-light);color:var(--gray);border:1px solid var(--gray-border)}
.cv-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
.cv-fact{border:1px solid var(--gray-border);border-radius:8px;padding:6px 7px;background:var(--white,#fff)}
.cv-fact span{display:block;font-size:9.8px;color:var(--gray);text-transform:uppercase;letter-spacing:.03em}
.cv-fact strong{display:block;font-size:12.5px;margin-top:1px;line-height:1.25}
.cv-fact.eva{grid-column:span 3;border-color:var(--cv-acc)}
.cv-dg{display:grid;grid-template-columns:1fr;gap:8px;margin:8px 0}
@media(min-width:720px){.cv-dg.dos{grid-template-columns:1fr 1fr}.cv-facts{grid-template-columns:repeat(5,minmax(0,1fr))}.cv-fact.eva{grid-column:span 5}}
@media(max-width:380px){.cv-g,.cv-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.cv-fact.eva{grid-column:span 2}.cv-pt .cv-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
.cv-dg figure{margin:0;border:1px solid var(--gray-border);border-radius:10px;overflow:hidden;background:var(--dg-bg)}
.cv-dg figcaption{font-size:10.5px;color:var(--gray);padding:4px 8px;border-top:1px solid var(--gray-border)}
.cv-list{margin:4px 0;padding-left:0;list-style:none}
.cv-list li{font-size:12.5px;line-height:1.4;padding:4px 0 4px 18px;position:relative;border-bottom:1px dashed var(--gray-border)}
.cv-list li::before{content:'✓';position:absolute;left:2px;color:var(--cv-acc);font-weight:700}
.cv-list.av li::before{content:'›'}
.cv-list b{font-weight:600}
.cv details{border:1px solid var(--gray-border);border-radius:10px;margin:8px 0;background:var(--white,#fff)}
.cv summary{padding:9px 11px;font-size:12.5px;font-weight:700;cursor:pointer;color:var(--text)}
.cv details>div{padding:0 11px 10px}
.cv-sum{font-size:12px;color:var(--gray);margin-top:4px}
.cv-sum.bad{color:#D93025;font-weight:600}
.cv-vacio{text-align:center;padding:16px 8px;color:var(--gray);font-size:13px}
`;
    document.head.appendChild(st);
  }

  // ---------------------------------------------------- campos (render)
  /** f = [path, label, tipo, opciones|unidad, extra] ; tipo: num|txt|date|sel|chips|chips1|area|bool */
  function campo(lote, f) {
    const [path, label, tipo, x, extra = {}] = f;
    const v = getPath(lote, path);
    const full = extra.full ? ' full' : '';
    const unidad = (tipo === 'num' && x) ? ` <span class="u">(${esc(x)})</span>` : '';
    const id = 'cv_' + path.replace(/\./g, '_');
    let ctl = '';
    if (tipo === 'num') ctl = `<input id="${id}" data-p="${path}" data-t="num" inputmode="decimal" autocomplete="off" value="${esc(v ?? '')}"${extra.ph ? ` placeholder="${esc(extra.ph)}"` : ''}>`;
    else if (tipo === 'txt') ctl = `<input id="${id}" data-p="${path}" data-t="txt" autocomplete="off" value="${esc(v ?? '')}"${extra.ph ? ` placeholder="${esc(extra.ph)}"` : ''}>`;
    else if (tipo === 'date') ctl = `<input id="${id}" type="date" data-p="${path}" data-t="txt" value="${esc(v ?? '')}">`;
    else if (tipo === 'area') ctl = `<textarea id="${id}" data-p="${path}" data-t="txt"${extra.ph ? ` placeholder="${esc(extra.ph)}"` : ''}>${esc(v ?? '')}</textarea>`;
    else if (tipo === 'sel') ctl = `<select id="${id}" data-p="${path}" data-t="txt"><option value="">—</option>${x.map((o) => `<option value="${esc(val(o))}"${val(o) === v ? ' selected' : ''}>${esc(lab(o))}</option>`).join('')}</select>`;
    else if (tipo === 'chips' || tipo === 'chips1') {
      const sel = Array.isArray(v) ? v : (v ? [v] : []);
      ctl = `<div class="cv-chips" data-p="${path}" data-t="${tipo}">${x.map((o) => `<span class="cv-chip${sel.includes(val(o)) ? ' on' : ''}" data-v="${esc(val(o))}">${esc(lab(o))}</span>`).join('')}</div>`;
    } else if (tipo === 'bool') {
      return `<label class="cv-chip${v ? ' on' : ''}" data-p="${path}" data-t="bool" style="display:inline-block;margin:2px 3px 2px 0">${esc(label)}</label>`;
    }
    const calc = extra.calc ? `<div class="calc" data-calc="${extra.calc}"></div>` : '';
    return `<div class="cv-f${full}"><label for="${id}" title="${esc(label)}">${esc(label)}${unidad}</label>${ctl}${calc}</div>`;
  }
  const grid = (lote, campos, cls = '') => `<div class="cv-g ${cls}">${campos.map((f) => campo(lote, f)).join('')}</div>`;
  const sec = (t) => `<div class="cv-sec">${esc(t)}</div>`;

  // =================================================================== MÓDULO
  function crearCultivos(containerId, opts = {}) {
    const cont = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!cont || !K || !CC || !D) { console.warn('cultivos: faltan dependencias'); return null; }
    estilos();
    let lotes = [], activo = -1, tab = 'ficha', fichaId = 'papa';
    const fotosPorLote = {};
    const onChange = opts.onChange || (() => {});
    const fechaRef = () => (typeof opts.fechaVisita === 'function' ? opts.fechaVisita() : opts.fechaVisita) || new Date().toISOString().slice(0, 10);
    const lote = () => lotes[activo];
    const cult = () => K.get(activo >= 0 ? lote().especie : fichaId);
    let tCambio = null;
    function cambio() { if (lote()) lote().actualizado = new Date().toISOString(); clearTimeout(tCambio); tCambio = setTimeout(() => onChange(api.getData()), 400); }

    // ----------------------------------------------------- barra de lotes
    function barra() {
      const chips = lotes.map((l, i) => {
        const c = K.get(l.especie), rv = CC.revisarLote(l, c);
        return `<button type="button" class="cv-lote${i === activo ? ' on' : ''}" data-lote="${i}">${ICONO[c.id] || '🌱'} ${esc(l.nombre_lote || c.nombre)}
          <span class="b${rv.completo ? ' ok' : ''}">${rv.completo ? '✓' : rv.faltan.length}</span></button>`;
      }).join('');
      return `<div class="cv-bar"><button type="button" class="cv-lote${activo < 0 ? ' on' : ''}" data-lote="-1">📖 Fichas</button>${chips}
        <button type="button" class="cv-lote cv-add" data-accion="nuevo">＋ Lote de cultivo</button></div>`;
    }
    function selectorCultivo(sel, attr) {
      const grupos = K.grupos();
      return `<select ${attr}>${grupos.map((gname) => `<optgroup label="${esc(gname)}">${K.CULTIVOS.filter((c) => c.grupo === gname)
        .map((c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('')}</optgroup>`).join('')}</select>`;
    }

    // ------------------------------------------------------------ FICHA
    function htmlFicha(c, l) {
      const geo = l ? l.geometria : null;
      const ef = l ? CC.edadFase(l, c, fechaRef()) : null;
      const b = c.eva_ref && c.eva_ref.boyaca;
      const facts = [
        ['Altura', rango(c.altura_m, 'm')], ['Marco', c.surcos_m && c.plantas_m && c.plantas_m[1] ? `${rango(c.surcos_m)} × ${rango(c.plantas_m)} m` : (c.disposicion === 'voleo' ? 'Al voleo' : '—')],
        ['Densidad', c.densidad_ha ? rango(c.densidad_ha, '/ha', 0) : (c.disposicion === 'voleo' ? 'por m²' : '—')],
        ['Altitud', rango(c.altitud_msnm, 'msnm', 0)], ['Temperatura', rango(c.temp_c, '°C', 0)],
        ['Inicio producción', c.inicio_prod_meses ? rango(c.inicio_prod_meses, 'meses', 1) : '—'],
        [c.ciclo === 'transitorio' ? 'Ciclo' : 'Vida útil', c.ciclo_meses ? rango(c.ciclo_meses, 'meses', 1) : (c.vida_util_anios ? rango(c.vida_util_anios, 'años', 1) : '—')],
        ['Peso del órgano', c.peso_unidad_g ? rango(c.peso_unidad_g, 'g', c.peso_unidad_g[1] < 1 ? 3 : 0) : '—'],
        ['Unidad de venta', `${c.venta.unidad}${c.venta.kg !== 1 ? ' ≈ ' + fmt(c.venta.kg, 1) + ' kg' : ''}`],
        ['Se cuenta por', c.produccion.base === 'm2' ? 'm² (marco)' : c.produccion.base],
      ];
      const evaTxt = b ? `<strong>Boyacá: mediana ${fmt(b.mediana, 1)} t/ha · 80 % de municipios entre ${fmt(b.p10, 1)} y ${fmt(b.p90, 1)}</strong>
          <span style="text-transform:none;margin-top:2px">${b.municipios} municipios · ${fmt(b.area_ha, 0)} ha sembradas/año${c.eva_producto ? ' · ' + esc(c.eva_producto) : ''}</span>` : '<strong>Sin dato EVA</strong>';
      let est = 0;
      if (l) { const pf = CC.produccionFisica(l, c, 'muestreo'); est = pf.t_ha; }
      return `
        <div class="cv-id"><div class="ic">${ICONO[c.id] || '🌱'}</div><div><h3>${esc(c.nombre)}</h3><i>${esc(c.cientifico)}</i>
          <div class="cv-tags">${[c.familia, c.grupo, c.ciclo, c.habito, 'Cosecha: ' + c.organo].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('')}</div></div></div>
        ${l ? '' : `<div class="cv-f" style="margin-bottom:8px"><label>Consultar ficha de</label>${selectorCultivo(c.id, 'data-ficha')}</div>`}
        <div class="cv-facts">${facts.map(([k, v]) => `<div class="cv-fact"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}
          <div class="cv-fact eva"><span>Rendimiento municipal EVA (su base nucleo.cultivos_detalle)</span>${evaTxt}</div></div>
        ${ef && ef.meses !== null ? `<div class="cv-hint"><b>Este lote:</b> ${fmt(ef.meses, 1)} meses (${fmt(ef.anios, 1)} años) · fase de referencia: <b>${esc(ef.fase || 'fuera de las fases')}</b>${ef.vida_consumida_pct !== null ? ` · ${fmt(ef.vida_consumida_pct, 0)} % de la ${c.ciclo === 'transitorio' ? 'duración del ciclo' : 'vida útil máxima'}` : ''}</div>` : ''}
        <div class="cv-dg dos">
          <figure>${D.arquitectura(c)}<figcaption>Arquitectura con escala vertical en metros; órgano cosechable resaltado. Esquema, no fotografía.</figcaption></figure>
          <figure>${D.marco(c, geo && CC.hay(geo.dist_surcos_m) && CC.hay(geo.dist_plantas_m) ? { surcos_m: CC.num(geo.dist_surcos_m), plantas_m: CC.num(geo.dist_plantas_m), disposicion: geo.disposicion } : null)}<figcaption>${geo && CC.hay(geo.dist_surcos_m) ? 'Marco OBSERVADO en este lote, a escala.' : 'Marco de referencia (punto medio del rango), a escala.'}</figcaption></figure>
        </div>
        <div class="cv-dg dos">
          <figure>${D.ciclo(c, ef ? ef.meses : null)}<figcaption>Fases de referencia${ef && ef.meses !== null ? '; la flecha marca la edad de este lote' : ''}.</figcaption></figure>
          <figure>${D.rendimiento(c, est)}<figcaption>${est ? 'La línea roja es lo que da el muestreo de este lote.' : 'Cuando haya muestreo, aquí se marca lo estimado.'}</figcaption></figure>
        </div>
        <details${l ? '' : ' open'}><summary>🟢 Cómo se ve un cultivo sano</summary><div><ul class="cv-list">${c.sano.map((s) => `<li><b>${esc(s.t)}.</b> ${esc(s.d)}</li>`).join('')}</ul>
          ${c.riesgos.length ? `<div class="cv-sum" style="margin-top:6px"><b>Qué vigilar:</b> ${c.riesgos.map(esc).join(' · ')}</div>` : ''}</div></details>
        <details${l ? '' : ' open'}><summary>⚖️ Para el avalúo</summary><div><ul class="cv-list av">${c.avaluo.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></details>
        <details><summary>📏 Cómo muestrear este cultivo</summary><div><div class="cv-dg"><figure>${D.muestreo(c)}</figure></div>
          <div class="cv-sum">Variables por punto: ${c.muestreo.map((x) => esc(x.label) + (x.u ? ` (${esc(x.u)})` : '')).join(' · ')}.<br>
          Fórmula: ${c.produccion.factores.join(' × ')}${c.produccion.divisor !== 1 ? ' ÷ ' + fmt(c.produccion.divisor, 0) : ''} = kg/${c.produccion.base}.${c.produccion.nota ? ' ' + esc(c.produccion.nota) : ''}</div></div></details>
        <div class="cv-sum">${esc(K.META.advertencia)}</div>`;
    }

    // ------------------------------------------------------------- LOTE
    function htmlLote(l, c) {
      const vars = c.variables.map((x) => [`variables.${x.k}`, x.label, x.t === 'op' ? 'sel' : (x.t === 'num' ? 'num' : 'txt'), x.t === 'op' ? x.op : x.u]);
      return `
        ${sec('Qué se valora')}${grid(l, [['objeto', 'Objeto (puede ser más de uno)', 'chips', OP.objeto, { full: true }]])}
        ${sec('Identificación')}${grid(l, [
          ['identificacion.variedad', 'Variedad / clon', 'txt'], ['identificacion.patron', 'Patrón / injerto', 'txt'],
          ['identificacion.sistema', 'Sistema', 'sel', OP.sistema], ...vars])}
        ${sec('Edad y etapa')}${grid(l, [
          ['edad.fecha_siembra', 'Fecha de siembra', 'date', null, { calc: 'edad' }], ['edad.edad_meses', 'Edad si no hay fecha', 'num', 'meses'],
          ['edad.base_edad', 'De dónde sale la edad', 'sel', OP.base_edad], ['edad.etapa', 'Etapa observada', 'sel', c.etapas.map((e) => [e.k, e.label])],
          ['edad.fecha_trasplante', 'Trasplante', 'date'], ['edad.fecha_primera_cosecha', 'Primera cosecha', 'date']])}
        ${sec('Área y plantas')}${grid(l, [
          ['geometria.area_medida_ha', 'Área medida', 'num', 'ha', { calc: 'area' }], ['geometria.area_cultivo_ha', 'Área dicha / estimada', 'num', 'ha'],
          ['geometria.fuente_area', 'Cómo se midió', 'sel', OP.fuente_area], ['geometria.area_productiva_pct', 'Área productiva', 'num', '%', { ph: '100' }],
          ['geometria.disposicion', 'Disposición', 'sel', OP.disposicion],
          ...(c.produccion.base === 'm2' && c.disposicion === 'voleo' ? [] : [
            ['geometria.dist_surcos_m', 'Entre surcos / hileras', 'num', 'm', { ph: c.surcos_m ? rango(c.surcos_m) : '' }],
            ['geometria.dist_plantas_m', 'Entre plantas', 'num', 'm', { ph: c.plantas_m ? rango(c.plantas_m) : '', calc: 'densidad' }],
            ['geometria.plantas_total', `${c.unidad === 'árbol' ? 'Árboles' : 'Plantas'} en el lote`, 'num', 'n', { calc: 'plantas' }],
            ['geometria.base_plantas', 'Cómo se obtuvo', 'sel', OP.base_plantas]])])}
        <div class="cv-btns"><button type="button" class="cv-btn" data-accion="gps-lote">📍 GPS del lote</button></div>
        <div class="cv-sum" data-calc="gps-lote">${l.geometria.lat ? `${l.geometria.lat}, ${l.geometria.lng} ±${l.geometria.precision_m ?? '?'} m` : 'Sin coordenada.'}</div>
        ${sec('Estado del lote')}${grid(l, [
          ['estado.vivas_pct', 'Plantas vivas', 'num', '%'], ['estado.productivas_pct', 'De las vivas, productivas', 'num', '%'],
          ['estado.descarte_pct', 'Descarte estimado', 'num', '%'], ['estado.uniformidad', 'Uniformidad', 'sel', OP.nivel],
          ['estado.vigor', 'Vigor', 'sel', OP.nivel], ['estado.estado_general', 'Estado general', 'sel', OP.estado],
          ['estado.renovacion', 'Renovación / resiembra', 'sel', OP.renovacion], ['estado.vida_remanente_meses', 'Vida productiva que le queda', 'num', 'meses']])}
        ${c.ciclo !== 'transitorio' || c.diagrama === 'tutorado' ? sec('Arquitectura observada') + grid(l, [
          ['arquitectura.altura_m', 'Altura media', 'num', 'm', { ph: rango(c.altura_m) }], ['arquitectura.copa_m', 'Diámetro de copa', 'num', 'm'],
          ['arquitectura.tronco_cm', 'Diámetro de tronco', 'num', 'cm'], ['arquitectura.soporte_estado', 'Tutor / soporte', 'sel', OP.soporte]]) : ''}`;
    }

    // --------------------------------------------------------- MUESTREO
    function htmlMuestreo(l, c) {
      const pts = l.muestreo.puntos;
      const sch = c.muestreo;
      const ptsHtml = pts.map((p, i) => `
        <div class="cv-pt" data-pt="${i}">
          <div class="cv-pt-h"><b>${i + 1}</b><input data-pp="zona" placeholder="Zona / estrato (alta, baja, módulo 2…)" value="${esc(p.zona || '')}">
            <button type="button" data-accion="gps-pt" title="GPS del punto">📍</button><button type="button" class="x" data-accion="del-pt" title="Quitar">✕</button></div>
          <div class="cv-g">
            ${c.produccion.base !== 'm2' ? `<div class="cv-f"><label>${esc(c.unidad[0].toUpperCase()+c.unidad.slice(1))}s vistas</label><input data-pp="unidades" inputmode="decimal" value="${esc(p.unidades ?? '')}"></div>
            <div class="cv-f"><label>Productivas</label><input data-pp="productivas" inputmode="decimal" value="${esc(p.productivas ?? '')}"></div>` : ''}
            ${sch.map((x) => `<div class="cv-f"><label title="${esc(x.label)}">${esc(x.label)}${x.u ? ` <span class="u">(${esc(x.u)})</span>` : ''}</label>${x.t === 'op'
              ? `<select data-pv="${x.k}"><option value="">—</option>${x.op.map((o) => `<option${p.valores[x.k] === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`
              : `<input data-pv="${x.k}" inputmode="decimal" value="${esc(p.valores[x.k] ?? '')}">`}</div>`).join('')}
            <div class="cv-f"><label>Estado</label><select data-pp="estado"><option value="">—</option>${OP.estado.map((o) => `<option${p.estado === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
          </div>
          <input data-pp="obs" placeholder="Observación del punto" value="${esc(p.obs || '')}" style="margin-top:6px;min-height:32px;font-size:13px">
          <div class="kg" data-kg="${i}"></div><div class="gps" data-gps="${i}">${p.lat ? `📍 ${p.lat}, ${p.lng} ±${p.precision_m ?? '?'} m` : ''}</div>
        </div>`).join('');
      const etapas = c.etapas.map((e) => [`etapas_pct.${e.k}`, e.label, 'num', '%']);
      return `
        <div class="cv-hint">Variables medidas en las unidades <b>productivas</b> de cada punto. Fórmula: <b>${c.produccion.factores.map((k) => (sch.find((x) => x.k === k) || {}).label || k).join(' × ')}</b>${c.produccion.divisor !== 1 ? ' ÷ ' + fmt(c.produccion.divisor, 0) : ''} = kg/${c.produccion.base}.${c.produccion.nota ? ' ' + esc(c.produccion.nota) : ''}</div>
        ${grid(l, [['muestreo.metodo', 'Método', 'sel', ['Recorrido en W', 'Sistemático', 'Aleatorio', 'Estratificado', 'Dirigido']],
          ['muestreo.criterio', 'Criterio de los puntos', 'txt', null, { ph: 'Bordes excluidos, 5 plantas seguidas…' }]])}
        <div data-calc="muestreo"></div>
        ${ptsHtml || '<div class="cv-vacio">Sin puntos todavía.</div>'}
        <div class="cv-btns"><button type="button" class="cv-btn pri" data-accion="add-pt">＋ Punto</button><button type="button" class="cv-btn" data-accion="add-5">＋ 5 puntos</button></div>
        <details><summary>Distribución del lote por etapa (%)</summary><div>${grid(l, etapas, 'cv-g3')}<div class="cv-sum" data-calc="etapas"></div></div></details>`;
    }
    function htmlResumenMuestreo(l, c) {
      const pf = CC.produccionFisica(l, c, 'muestreo'), m = pf.muestreo, k = m.kg_base;
      const fila = (t, v) => `<div class="cv-k"><span>${t}</span><strong>${v}</strong></div>`;
      let h = `<div class="cv-res">${fila('Puntos válidos', `${m.puntos_validos} de ${m.puntos_registrados}`)}
        ${fila('Promedio', k ? `${fmt(k.media, 3)} ${m.base_label}` : '—')}
        ${fila('CV', k && k.cv !== null ? fmt(k.cv, 1) + ' %' : '—')}
        ${fila('IC 95 %', k && k.ic95 ? `± ${fmt(k.error_rel_pct, 0)} %` : '—')}
        ${fila('Comercial', m.comercial_pct !== null ? fmt(m.comercial_pct, 0) + ' %' : '—')}
        ${fila('Estimado', pf.t_ha !== null ? fmt(pf.t_ha, 1) + ' t/ha' : '—')}</div>`;
      if (pf.kg_total !== null) h += `<div class="cv-sum">≈ ${fmt(pf.kg_total, 0)} kg en el lote (${fmt(pf.kg_comercial, 0)} kg comerciales) · ${esc(pf.fuente)}. <i>Indicativo: el cálculo definitivo se hace en la plataforma.</i></div>`;
      else h += `<div class="cv-sum">Para llevar el promedio al lote falta ${m.base === 'm2' ? 'el área' : 'el número de plantas (o el marco y el área)'} en la pestaña Lote.</div>`;
      if (pf.eva) h += `<div class="cv-sum">Frente a EVA Boyacá: <b>${esc(pf.eva.posicion)}</b> (${fmt(pf.eva.veces_mediana, 2)} × la mediana).</div>`;
      if (k && m.puntos_para_15pct && m.puntos_para_15pct > m.puntos_validos) h += `<div class="cv-alert">Con este CV harían falta unos <b>${m.puntos_para_15pct}</b> puntos para un error de ±15 %.</div>`;
      if (k) h += `<div class="cv-sum">${esc(m.lectura)}</div>`;
      if (m.zonas.length) h += `<div class="cv-sum">Por zona: ${m.zonas.map((z) => `${esc(z.zona)} ${fmt(z.media, 3)} (n=${z.n})`).join(' · ')}</div>`;
      m.alertas.forEach((a) => { h += `<div class="cv-alert">${esc(a)}</div>`; });
      return h;
    }

    // --------------------------------------------------- MANEJO / SANIDAD
    function htmlManejo(l, c) {
      return `${sec('Manejo')}${grid(l, [
        ['manejo.riego', 'Riego', 'sel', OP.riego], ['manejo.fertirriego', 'Fertirriego', 'sel', OP.sino],
        ['manejo.sombra_pct', 'Sombra', 'num', '%'], ['manejo.suelo', 'Suelo superficial', 'sel', OP.condicion],
        ['manejo.drenaje', 'Drenaje', 'sel', OP.condicion], ['manejo.malezas', 'Control de malezas', 'sel', OP.condicion],
        ['manejo.nutricion', 'Fertilización', 'txt', null, { ph: 'Plan técnico, orgánica…' }], ['manejo.poda', 'Poda / deshije', 'txt'],
        ['manejo.fuente', 'Fuente de la información', 'sel', OP.fuente], ['manejo.notas', 'Notas de manejo', 'area', null, { full: true }]])}
        ${sec('Sanidad y afectaciones (observado, no diagnóstico)')}${grid(l, [
        ['sanidad.intensidad', 'Intensidad de la afectación', 'sel', OP.intensidad], ['sanidad.area_afectada_pct', 'Área afectada', 'num', '%'],
        ['sanidad.unidades_afectadas_pct', 'Plantas afectadas', 'num', '%'], ['sanidad.parte_afectada', 'Parte afectada', 'txt', null, { ph: 'Hojas, fruto, raíz…' }],
        ['sanidad.riesgos_observados', 'Compatible con (de la ficha)', 'chips', c.riesgos, { full: true }],
        ['sanidad.signos', 'Signos y síntomas que se ven', 'area', null, { full: true }],
        ['sanidad.factor', 'Hecho que lo causó (si hay soporte)', 'area', null, { full: true, ph: 'Helada, granizo, inundación, obra…' }],
        ['sanidad.fuente', 'Fuente', 'sel', OP.fuente]])}`;
    }

    // ------------------------------------------------------- PRODUCCIÓN
    function htmlProduccion(l, c) {
      const filasCosto = l.costos_informados.map((x, i) => `<tr data-row="costos_informados.${i}">
        <td><input data-rc="concepto" value="${esc(x.concepto || '')}" placeholder="Concepto"></td>
        <td><select data-rc="etapa">${OP.etapa_costo.map((o) => `<option value="${o[0]}"${x.etapa === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></td>
        <td><input data-rc="incurrido" inputmode="decimal" value="${esc(x.incurrido ?? '')}"></td><td><input data-rc="pendiente" inputmode="decimal" value="${esc(x.pendiente ?? '')}"></td>
        <td><input data-rc="soporte" value="${esc(x.soporte || '')}" placeholder="Factura, dicho…"></td><td><button type="button" class="cv-btn" data-accion="del-row" style="padding:4px 8px;min-width:0">✕</button></td></tr>`).join('');
      const filasInfra = l.infraestructura.map((x, i) => `<tr data-row="infraestructura.${i}">
        <td><input data-rc="elemento" value="${esc(x.elemento || '')}" placeholder="Invernadero, riego…"></td><td><input data-rc="cantidad" inputmode="decimal" value="${esc(x.cantidad ?? '')}"></td>
        <td><input data-rc="unidad" value="${esc(x.unidad || '')}" placeholder="m², m, und"></td><td><input data-rc="edad_anios" inputmode="decimal" value="${esc(x.edad_anios ?? '')}"></td>
        <td><select data-rc="estado"><option value="">—</option>${OP.estado.map((o) => `<option${x.estado === o ? ' selected' : ''}>${o}</option>`).join('')}</select></td>
        <td><button type="button" class="cv-btn" data-accion="del-row" style="padding:4px 8px;min-width:0">✕</button></td></tr>`).join('');
      return `<div class="cv-hint">Lo que <b>informa</b> el productor o los documentos. Se guarda separado de lo medido: la plataforma decide qué usar.</div>
        ${sec('Producción informada')}${grid(l, [
        ['produccion_informada.cosechado_kg', 'Ya cosechado (este ciclo)', 'num', 'kg'], ['produccion_informada.cosechas_n', 'Cosechas hechas', 'num', 'n'],
        ['produccion_informada.frecuencia', 'Frecuencia de cosecha', 'txt', null, { ph: 'Semanal, cada 15 días…' }], ['produccion_informada.fecha_proxima_cosecha', 'Próxima cosecha', 'date'],
        ['produccion_informada.rendimiento_valor', 'Rendimiento que dice', 'num'], ['produccion_informada.rendimiento_unidad', 'Unidad', 'sel', OP.rend_unidad],
        ['produccion_informada.produccion_anual_kg', 'Producción anual', 'num', 'kg'], ['produccion_informada.informante', 'Quién informa', 'txt']])}
        ${sec('Precio en finca')}${grid(l, [
        ['mercado_informado.precio', 'Precio', 'num', '$', { calc: 'precio' }], ['mercado_informado.unidad_venta', 'Por', 'txt'],
        ['mercado_informado.kg_por_unidad', 'kg por unidad de venta', 'num', 'kg'], ['mercado_informado.fecha_precio', 'Fecha del precio', 'date'],
        ['mercado_informado.precio_min', 'Mínimo visto', 'num', '$'], ['mercado_informado.precio_max', 'Máximo visto', 'num', '$'],
        ['mercado_informado.comprador', 'Comprador / canal', 'txt', null, { full: true }]])}
        ${sec('Costos informados ($)')}
        <div class="cv-tab" style="overflow-x:auto"><table style="min-width:520px"><thead><tr><th>Concepto</th><th>Etapa</th><th>Incurrido</th><th>Pendiente</th><th>Soporte</th><th></th></tr></thead><tbody>${filasCosto}</tbody></table></div>
        <div class="cv-btns"><button type="button" class="cv-btn" data-accion="add-costo">＋ Costo</button></div><div class="cv-sum" data-calc="costos"></div>
        ${sec('Infraestructura del cultivo')}
        <div class="cv-tab" style="overflow-x:auto"><table style="min-width:480px"><thead><tr><th>Elemento</th><th>Cant.</th><th>Unidad</th><th>Edad (años)</th><th>Estado</th><th></th></tr></thead><tbody>${filasInfra}</tbody></table></div>
        <div class="cv-btns"><button type="button" class="cv-btn" data-accion="add-infra">＋ Elemento</button></div>`;
    }

    // --------------------------------------------------------- REVISIÓN
    function htmlRevision(l, c) {
      const rv = CC.revisarLote(l, c);
      const docs = [['documentos.plano', 'Plano / coordenadas', 'bool'], ['documentos.costos', 'Soportes de costos', 'bool'], ['documentos.ventas', 'Registros de cosecha / ventas', 'bool'],
        ['documentos.tecnicos', 'Registros técnicos', 'bool'], ['documentos.contratos', 'Contratos de venta', 'bool']];
      return `${rv.faltan.map((f) => `<div class="cv-alert bad">Falta: ${esc(f)}</div>`).join('')}
        ${rv.avisos.map((f) => `<div class="cv-alert">${esc(f)}</div>`).join('')}
        ${rv.completo && !rv.avisos.length ? '<div class="cv-hint">✓ El lote tiene lo necesario para el análisis.</div>' : ''}
        ${sec('Fotos del lote')}<div id="cv_fotos_${esc(l.id)}"></div>
        ${sec('Documentos aportados')}<div>${docs.map((f) => campo(l, f)).join('')}</div>
        ${grid(l, [['documentos.detalle', 'Detalle de documentos', 'area', null, { full: true, ph: 'Qué documento, quién lo aportó, fecha…' }],
          ['observaciones', 'Observaciones del lote', 'area', null, { full: true }],
          ['limitaciones', 'Limitaciones y supuestos de campo', 'area', null, { full: true }]])}`;
    }

    // ------------------------------------------------------------ render
    const TABS = [['ficha', 'Ficha'], ['lote', 'Lote'], ['muestreo', 'Muestreo'], ['manejo', 'Manejo'], ['produccion', 'Producción'], ['revision', 'Revisión']];
    function render() {
      let h = barra();
      if (activo < 0) {
        h += lotes.length ? '' : `<div class="cv-hint">Consulte la ficha antes de la visita. Para registrar un cultivo del predio, use <b>＋ Lote de cultivo</b>: un lote por cada cultivo o por cada zona con edad o manejo distinto.</div>`;
        h += htmlFicha(K.get(fichaId), null);
      } else {
        const l = lote(), c = K.get(l.especie), rv = CC.revisarLote(l, c);
        h += `<div class="cv-head"><div class="cv-f"><label>Cultivo</label>${selectorCultivo(l.especie, 'data-especie')}</div>
          <div class="cv-f"><label>Nombre del lote</label><input data-p="nombre_lote" data-t="txt" value="${esc(l.nombre_lote || '')}"></div>
          <button type="button" class="del" data-accion="del-lote" title="Eliminar lote">🗑</button></div>
          <div class="cv-tabs">${TABS.map(([k, t]) => `<button type="button" data-tab="${k}" class="${tab === k ? 'on' : ''}">${t}${k === 'revision' && rv.faltan.length ? `<span class="n">${rv.faltan.length}</span>` : ''}</button>`).join('')}</div>
          <div class="cv-panel">${{ ficha: (l_, c_) => htmlFicha(c_, l_), lote: htmlLote, muestreo: htmlMuestreo, manejo: htmlManejo, produccion: htmlProduccion, revision: htmlRevision }[tab](l, c)}</div>`;
      }
      cont.innerHTML = `<div class="cv">${h}</div>`;
      calcs();
      if (activo >= 0 && tab === 'revision') montarFotos();
    }
    function montarFotos() {
      const l = lote(); const el = document.getElementById('cv_fotos_' + l.id);
      if (!el) return;
      if (typeof g.crearFotos !== 'function') { el.innerHTML = '<div class="cv-sum">fotos.js no está cargado.</div>'; return; }
      const f = g.crearFotos('cv_fotos_' + l.id);
      if (f) {
        f.setData(l.fotos || []); fotosPorLote[l.id] = f;
        // fotos.js no avisa cuando cambia: se relee al tocar el recuadro y al guardar (getData)
        el.addEventListener('click', () => setTimeout(() => { l.fotos = f.getData(); cambio(); }, 300));
        el.addEventListener('change', () => setTimeout(() => { l.fotos = f.getData(); cambio(); }, 2500));
      }
    }

    /** Recalcula los textos vivos sin redibujar (no se pierde el foco). */
    function calcs() {
      if (activo < 0) return;
      const l = lote(), c = K.get(l.especie), $ = (s) => cont.querySelector(`[data-calc="${s}"]`);
      const geo = CC.geometria(l, c);
      const set = (k, t) => { const e = $(k); if (e) e.innerHTML = t; };
      const ef = CC.edadFase(l, c, fechaRef());
      set('edad', ef.meses !== null ? `${fmt(ef.meses, 1)} meses · ${esc(ef.fase || 'fuera de las fases')}` : '');
      set('area', geo.area_efectiva_ha !== null ? `Efectiva ${fmt(geo.area_efectiva_ha, 4)} ha (${fmt(geo.area_efectiva_ha * 10000, 0)} m²)` : '');
      set('densidad', geo.densidad_marco_ha ? `${fmt(geo.densidad_marco_ha, 0)} /ha${c.densidad_ha ? ` (ref. ${rango(c.densidad_ha, '', 0)})` : ''}` : '');
      set('plantas', !CC.hay(l.geometria.plantas_total) && geo.unidades_total ? `Del marco: ≈ ${fmt(geo.unidades_total, 0)}` : (geo.densidad_real_ha ? `${fmt(geo.densidad_real_ha, 0)} /ha reales` : ''));
      const mi = l.mercado_informado;
      set('precio', CC.hay(mi.precio) && CC.hay(mi.kg_por_unidad) && CC.num(mi.kg_por_unidad) ? `= ${fmt(CC.num(mi.precio) / CC.num(mi.kg_por_unidad), 0)} $/kg` : '');
      const cs = CC.costos(l);
      set('costos', l.costos_informados.length ? `Incurrido $${fmt(cs.incurrido, 0)} · pendiente $${fmt(cs.pendiente, 0)}` : '');
      const et = Object.values(l.etapas_pct || {}).map(CC.num).filter((x) => x !== null);
      if ($('etapas')) { const s = et.reduce((a, b) => a + b, 0); const e = $('etapas'); e.textContent = et.length ? `Suma: ${fmt(s, 1)} %${Math.abs(s - 100) > 0.5 ? ' — debe dar 100 %' : ' ✓'}` : ''; e.className = 'cv-sum' + (et.length && Math.abs(s - 100) > 0.5 ? ' bad' : ''); }
      if ($('muestreo')) {
        set('muestreo', htmlResumenMuestreo(l, c));
        l.muestreo.puntos.forEach((p, i) => {
          const e = cont.querySelector(`[data-kg="${i}"]`); if (!e) return;
          const k = CC.kgPorPunto(p, c); e.textContent = k !== null ? `= ${fmt(k, 3)} kg/${c.produccion.base}` : '';
        });
      }
      // badge de la barra
      const rv = CC.revisarLote(l, c), b = cont.querySelector(`[data-lote="${activo}"] .b`);
      if (b) { b.textContent = rv.completo ? '✓' : rv.faltan.length; b.className = 'b' + (rv.completo ? ' ok' : ''); }
      const tb = cont.querySelector('[data-tab="revision"]');
      if (tb) tb.innerHTML = 'Revisión' + (rv.faltan.length ? `<span class="n">${rv.faltan.length}</span>` : '');
    }

    // ------------------------------------------------------------ eventos
    function leerValor(el) {
      const t = el.dataset.t, s = el.value;
      if (t === 'num') { const n = CC.num(s); return n !== null ? n : (s.trim() ? s.trim() : null); }
      return s === '' ? null : s;
    }
    cont.addEventListener('input', (ev) => {
      const el = ev.target; if (activo < 0) return;
      const l = lote();
      if (el.dataset.p) { setPath(l, el.dataset.p, leerValor(el)); }
      else if (el.dataset.pp || el.dataset.pv) {
        const p = l.muestreo.puntos[+el.closest('[data-pt]').dataset.pt];
        const raw = el.value;
        const v = el.tagName === 'SELECT' ? (raw || null) : (el.dataset.pp === 'zona' || el.dataset.pp === 'obs' ? (raw || null) : (CC.num(raw) ?? (raw.trim() || null)));
        if (el.dataset.pp) p[el.dataset.pp] = v; else p.valores[el.dataset.pv] = v;
      } else if (el.dataset.rc) {
        const [arr, i] = el.closest('[data-row]').dataset.row.split('.');
        const numCols = ['incurrido', 'pendiente', 'cantidad', 'edad_anios'];
        l[arr][+i][el.dataset.rc] = numCols.includes(el.dataset.rc) ? (CC.num(el.value) ?? (el.value.trim() || null)) : (el.value || null);
      } else return;
      calcs(); cambio();
    });
    cont.addEventListener('change', (ev) => {
      const el = ev.target;
      if (el.dataset.ficha !== undefined) { fichaId = el.value; render(); return; }
      if (el.dataset.especie !== undefined) {
        const l = lote(), nuevo = el.value;
        const tieneMuestreo = l.muestreo.puntos.some((p) => Object.values(p.valores).some((x) => x !== null && x !== ''));
        if (tieneMuestreo && !confirm('Cambiar el cultivo deja sin uso las variables de muestreo ya escritas (se conservan en el registro, pero no se calculan). ¿Cambiar?')) { el.value = l.especie; return; }
        const c = K.get(nuevo); l.especie = c.id; l.especie_nombre = c.nombre; l.eva_nombre = c.eva || null;
        if (!l.geometria.disposicion) l.geometria.disposicion = c.disposicion;
        l.mercado_informado.unidad_venta = l.mercado_informado.unidad_venta || c.venta.unidad;
        render(); cambio(); return;
      }
    });
    cont.addEventListener('focusout', (ev) => {   // normaliza "9. 02" → "9.02" al salir, como numeros.js
      const el = ev.target;
      if (el.getAttribute && el.getAttribute('inputmode') === 'decimal') { const n = CC.num(el.value); if (n !== null && String(n) !== el.value) el.value = String(n); }
    });
    cont.addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-lote],[data-tab],[data-accion],.cv-chip');
      if (!t) return;
      if (t.dataset.lote !== undefined) { activo = +t.dataset.lote; if (activo >= 0 && !tab) tab = 'ficha'; render(); return; }
      if (t.dataset.tab) { tab = t.dataset.tab; render(); return; }
      if (t.classList.contains('cv-chip')) {
        const box = t.closest('[data-p]') || t; const path = box.dataset.p, tipo = box.dataset.t; const l = lote(); if (!l) return;
        if (tipo === 'bool') { const v = !getPath(l, path); setPath(l, path, v); t.classList.toggle('on', v); }
        else {
          let arr = getPath(l, path); arr = Array.isArray(arr) ? arr : (arr ? [arr] : []);
          const v = t.dataset.v;
          if (tipo === 'chips1') arr = arr.includes(v) ? [] : [v]; else arr = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
          setPath(l, path, tipo === 'chips1' ? (arr[0] || null) : arr);
          box.querySelectorAll('.cv-chip').forEach((ch) => ch.classList.toggle('on', arr.includes(ch.dataset.v)));
        }
        calcs(); cambio(); return;
      }
      const a = t.dataset.accion, l = lote();
      if (a === 'nuevo') { lotes.push(nuevoLote(activo >= 0 ? lote().especie : fichaId, lotes.length + 1)); activo = lotes.length - 1; tab = 'lote'; render(); cambio(); }
      else if (a === 'del-lote') { if (confirm(`¿Eliminar «${l.nombre_lote}» y todo lo capturado en él?`)) { lotes.splice(activo, 1); activo = lotes.length ? Math.min(activo, lotes.length - 1) : -1; render(); cambio(); } }
      else if (a === 'add-pt' || a === 'add-5') {
        const n = a === 'add-5' ? 5 : 1;
        for (let i = 0; i < n; i++) l.muestreo.puntos.push(nuevoPunto(l.muestreo.puntos[l.muestreo.puntos.length - 1]));
        render(); cambio();
        const pts = cont.querySelectorAll('.cv-pt'); const ult = pts[pts.length - n]; if (ult) ult.scrollIntoView({ block: 'center' });
      } else if (a === 'del-pt') {
        const i = +t.closest('[data-pt]').dataset.pt;
        const p = l.muestreo.puntos[i];
        const conDatos = p.unidades !== null || Object.values(p.valores).some((x) => x !== null && x !== '');
        if (!conDatos || confirm(`¿Quitar el punto ${i + 1}?`)) { l.muestreo.puntos.splice(i, 1); render(); cambio(); }
      } else if (a === 'gps-pt' || a === 'gps-lote') {
        if (!navigator.geolocation) { alert('Este dispositivo no da GPS.'); return; }
        const i = a === 'gps-pt' ? +t.closest('[data-pt]').dataset.pt : null;
        const out = a === 'gps-pt' ? cont.querySelector(`[data-gps="${i}"]`) : cont.querySelector('[data-calc="gps-lote"]');
        if (out) out.textContent = '⏳ Obteniendo GPS…';
        navigator.geolocation.getCurrentPosition((pos) => {
          const o = { lat: +pos.coords.latitude.toFixed(7), lng: +pos.coords.longitude.toFixed(7), precision_m: Math.round(pos.coords.accuracy) };
          Object.assign(a === 'gps-pt' ? l.muestreo.puntos[i] : l.geometria, o);
          if (out) out.textContent = `📍 ${o.lat}, ${o.lng} ±${o.precision_m} m`; cambio();
        }, (e) => { if (out) out.textContent = 'Sin GPS: ' + e.message; }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
      } else if (a === 'add-costo') { l.costos_informados.push({ concepto: null, etapa: 'sostenimiento', incurrido: null, pendiente: null, soporte: null }); render(); cambio(); }
      else if (a === 'add-infra') { l.infraestructura.push({ elemento: null, cantidad: null, unidad: null, edad_anios: null, estado: null, obs: null }); render(); cambio(); }
      else if (a === 'del-row') { const [arr, i] = t.closest('[data-row]').dataset.row.split('.'); l[arr].splice(+i, 1); render(); cambio(); }
    });

    // ---------------------------------------------------------------- API
    const api = {
      /** Copia limpia de los lotes para el registro. */
      getData() {
        lotes.forEach((l) => { const f = fotosPorLote[l.id]; if (f) l.fotos = f.getData(); });
        return JSON.parse(JSON.stringify(lotes));
      },
      setData(arr) {
        lotes = Array.isArray(arr) ? JSON.parse(JSON.stringify(arr)) : [];
        // completa claves que falten (registros de versiones anteriores del esquema)
        lotes = lotes.map((l, i) => { const base = nuevoLote(l.especie || 'otro', i + 1); return fusion(base, l); });
        activo = lotes.length ? 0 : -1; tab = 'ficha'; render();
      },
      resumen() { return lotes.map((l) => { const c = K.get(l.especie); return { id: l.id, cultivo: c.nombre, lote: l.nombre_lote, ...CC.revisarLote(l, c) }; }); },
      render,
    };
    function fusion(base, l) {
      for (const k of Object.keys(l)) {
        if (l[k] && typeof l[k] === 'object' && !Array.isArray(l[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) base[k] = fusion(base[k], l[k]);
        else base[k] = l[k];
      }
      return base;
    }
    render();
    return api;
  }

  g.crearCultivos = crearCultivos;
  g.CultivosModulo = { VERSION_ESQUEMA, nuevoLote, OP };
})(typeof window !== 'undefined' ? window : globalThis);
