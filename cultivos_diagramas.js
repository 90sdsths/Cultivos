/* cultivos_diagramas.js — diagramas SVG de la ficha de cultivos (v12).

   Cinco diagramas, todos generados desde el catálogo (sin imágenes externas,
   funcionan sin internet y pesan nada):
     1. arquitectura(c)       vista lateral con ESCALA en metros y el órgano cosechable resaltado
     2. marco(c, obs)         vista en planta A ESCALA del marco de siembra, con la densidad
     3. ciclo(c, edadMeses)   línea de tiempo de las fases; marca la edad del lote si se conoce
     4. rendimiento(c, tHa)   rango EVA de Boyacá (p10–mediana–p90) y el nacional; marca lo estimado
     5. muestreo(c)           cómo recorrer el lote y qué unidad medir en cada punto

   Colores: variables CSS con respaldo, así se ven bien en claro y en oscuro:
     --dg-ink --dg-muted --dg-line --dg-bg --dg-soil --dg-leaf --dg-leaf2 --dg-stem --dg-accent2
   El color del órgano cosechable es el del catálogo (c.color).
*/
(function (g) {
  'use strict';
  const INK = 'var(--dg-ink,#2b2b2b)', MUTED = 'var(--dg-muted,#6b6b6b)', LINE = 'var(--dg-line,#cfcfcf)',
    BG = 'var(--dg-bg,#fafafa)', SOIL = 'var(--dg-soil,#b89a72)', LEAF = 'var(--dg-leaf,#5f8f45)',
    LEAF2 = 'var(--dg-leaf2,#86ad62)', STEM = 'var(--dg-stem,#7b5a3a)', ACC2 = 'var(--dg-accent2,#c0392b)';
  /** Color legible para TEXTO: si el del cultivo es muy oscuro, se usa el de tinta. */
  function colorTexto(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return INK;
    const n = parseInt(m[1], 16), r_ = n >> 16, g_ = (n >> 8) & 255, b_ = n & 255;
    return (0.299 * r_ + 0.587 * g_ + 0.114 * b_) < 95 ? INK : hex;
  }
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = (n, d = 1) => (n === null || n === undefined) ? '—' : Number(n).toLocaleString('es-CO', { maximumFractionDigits: d });
  const mid = (a) => a ? (a[0] + a[1]) / 2 : null;
  const svg = (w, h, body, label) =>
    `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}" font-family="system-ui,Segoe UI,Roboto,Arial" style="width:100%;height:auto;display:block">${body}</svg>`;
  const txt = (x, y, t, o = {}) =>
    `<text x="${x}" y="${y}" font-size="${o.fs || 10}" fill="${o.c || INK}" text-anchor="${o.a || 'start'}"${o.w ? ` font-weight="${o.w}"` : ''}>${esc(t)}</text>`;
  const linea = (x1, y1, x2, y2, c = LINE, w = 1, dash) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  /** Etiqueta con línea guía: del punto (px,py) al texto en (tx,ty). */
  // Si el texto no cabe a la derecha, se ancla al borde (W) y la guía llega a su inicio.
  const guia = (px, py, tx, ty, t, color = INK, W = 340) => {
    const ancho = String(t).length * 5.1;
    let a = tx > px ? 'start' : 'end', x = tx;
    if (a === 'start' && x + ancho > W - 6) x = W - 6 - ancho;
    if (a === 'end' && x - ancho < 6) x = 6 + ancho;
    const lx = a === 'start' ? x - 3 : x + 3;
    return `<circle cx="${px}" cy="${py}" r="2" fill="${color}"/>${linea(px, py, lx, ty - 3, MUTED, 0.8)}` +
      txt(x, ty, t, { a, fs: 9.5, c: color });
  };

  // ===================================================== 1. ARQUITECTURA
  // Lienzo 340×230. Suelo en y=178. La planta mide H px = altura media × escala.
  const W1 = 340, H1 = 230, SUELO = 178, X0 = 170;

  function hoja(x, y, largo, ang, color = LEAF, ancho = 0.32) {
    const rad = ang * Math.PI / 180, dx = Math.cos(rad) * largo, dy = Math.sin(rad) * largo;
    const nx = -Math.sin(rad) * largo * ancho, ny = Math.cos(rad) * largo * ancho;
    return `<path d="M${x} ${y} Q${x + dx / 2 + nx} ${y + dy / 2 + ny} ${x + dx} ${y + dy} Q${x + dx / 2 - nx} ${y + dy / 2 - ny} ${x} ${y}Z" fill="${color}"/>`;
  }
  function copa(cx, cy, rx, ry, color = LEAF) {
    let s = '';
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      s += `<ellipse cx="${cx + Math.cos(a) * rx * 0.55}" cy="${cy + Math.sin(a) * ry * 0.5}" rx="${rx * 0.55}" ry="${ry * 0.55}" fill="${i % 2 ? LEAF : LEAF2}"/>`;
    }
    return s + `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.6}" ry="${ry * 0.6}" fill="${color}" opacity=".9"/>`;
  }
  const raices = (x, y, w = 30, d = 22) =>
    `<path d="M${x} ${y} q-${w * 0.4} ${d * 0.5} -${w} ${d} M${x} ${y} q-${w * 0.1} ${d * 0.6} -${w * 0.35} ${d * 1.1} M${x} ${y} q${w * 0.1} ${d * 0.6} ${w * 0.35} ${d * 1.1} M${x} ${y} q${w * 0.4} ${d * 0.5} ${w} ${d}" stroke="${MUTED}" stroke-width="1.1" fill="none" opacity=".7"/>`;

  const FORMAS = {
    tuberculo(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0} ${SUELO} V${top + 8}" stroke="${LEAF}" stroke-width="4"/>`;
      for (let i = 0; i < 6; i++) { const y = SUELO - H * (0.35 + i * 0.11); s += hoja(X0, y, H * 0.42, i % 2 ? -25 - i * 8 : 205 + i * 8); }
      s += `<path d="M${X0} ${SUELO} q-26 8 -38 22 M${X0} ${SUELO} q25 10 36 24 M${X0} ${SUELO} q-4 14 -6 30" stroke="${MUTED}" stroke-width="1.4" fill="none"/>`;
      [[X0 - 40, SUELO + 26, 13, 9], [X0 + 38, SUELO + 28, 12, 9], [X0 - 6, SUELO + 36, 14, 10], [X0 + 16, SUELO + 18, 9, 7]]
        .forEach(([x, y, a, b]) => { s += `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${c.color}" stroke="${STEM}" stroke-width=".8"/>`; });
      return { s, org: [X0 + 38, SUELO + 28], tallo: [X0, SUELO - H * 0.5], copaP: [X0 - H * 0.3, top + H * 0.25] };
    },
    raiz(H, c) {
      const top = SUELO - H; let s = '';
      for (let i = 0; i < 7; i++) s += hoja(X0, SUELO - 2, H * (0.8 + (i % 3) * 0.1), -90 + (i - 3) * 16, i % 2 ? LEAF : LEAF2, 0.22);
      s += `<path d="M${X0 - 9} ${SUELO} Q${X0 - 8} ${SUELO + 30} ${X0} ${SUELO + 46} Q${X0 + 8} ${SUELO + 30} ${X0 + 9} ${SUELO}Z" fill="${c.color}" stroke="${STEM}" stroke-width=".8"/>`;
      return { s, org: [X0 + 6, SUELO + 24], tallo: null, copaP: [X0 - H * 0.35, top + H * 0.3] };
    },
    bulbo(H, c) {
      const top = SUELO - H; let s = '';
      for (let i = 0; i < 6; i++) s += `<path d="M${X0 + (i - 2.5) * 2} ${SUELO - 12} Q${X0 + (i - 2.5) * 9} ${top + H * 0.4} ${X0 + (i - 2.5) * 16} ${top + (i % 2) * 10}" stroke="${i % 2 ? LEAF : LEAF2}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${X0} ${SUELO - 16} C${X0 + 24} ${SUELO - 10} ${X0 + 22} ${SUELO + 14} ${X0} ${SUELO + 14} C${X0 - 22} ${SUELO + 14} ${X0 - 24} ${SUELO - 10} ${X0} ${SUELO - 16}Z" fill="${c.color}" stroke="${STEM}" stroke-width=".9"/>`;
      s += raices(X0, SUELO + 14, 20, 14);
      return { s, org: [X0 + 18, SUELO], tallo: [X0, SUELO - 24], copaP: [X0 - 30, top + 12] };
    },
    macolla(H, c) {
      const top = SUELO - H; let s = '';
      for (let i = 0; i < 7; i++) {
        const x = X0 + (i - 3) * 6;
        s += `<path d="M${x} ${SUELO} L${x + (i - 3) * 4} ${top + (i % 2) * 14}" stroke="${i % 2 ? LEAF : LEAF2}" stroke-width="5" stroke-linecap="round"/>`;
        s += `<path d="M${x} ${SUELO} L${x} ${SUELO - H * 0.22}" stroke="${c.color === '#8DB05A' ? '#EDEBD8' : '#eee'}" stroke-width="5.5" stroke-linecap="round" opacity=".85"/>`;
      }
      s += raices(X0, SUELO, 26, 16);
      return { s, org: [X0 + 14, SUELO - H * 0.12], tallo: [X0 + 8, SUELO - H * 0.6], copaP: [X0 - 24, top + 10] };
    },
    cereal(H, c) {
      const top = SUELO - H; let s = '';
      [-40, -20, 0, 20, 40].forEach((dx, i) => {
        const x = X0 + dx, t = top + (i % 2) * 8;
        s += `<path d="M${x} ${SUELO} Q${x + 2} ${(SUELO + t) / 2} ${x + 3} ${t + 18}" stroke="${LEAF}" stroke-width="2.2" fill="none"/>`;
        s += hoja(x + 1, SUELO - H * 0.35, H * 0.35, i % 2 ? -40 : 220, LEAF2, 0.15);
        s += `<ellipse cx="${x + 3}" cy="${t + 9}" rx="4.5" ry="12" fill="${c.color}" stroke="${STEM}" stroke-width=".6"/>`;
      });
      s += raices(X0, SUELO, 50, 14);
      return { s, org: [X0 + 43, top + 14], tallo: [X0 + 21, SUELO - H * 0.45], copaP: [X0 - 40, SUELO - H * 0.35] };
    },
    maiz(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0} ${SUELO} V${top + 6}" stroke="${LEAF}" stroke-width="5"/>`;
      for (let i = 0; i < 7; i++) s += hoja(X0, SUELO - H * (0.15 + i * 0.11), H * 0.38, i % 2 ? -18 : 198, i % 2 ? LEAF : LEAF2, 0.12);
      s += `<path d="M${X0} ${top + 6} l-6 -10 M${X0} ${top + 6} l6 -10 M${X0} ${top + 6} l0 -12" stroke="${'#C9A64A'}" stroke-width="1.6"/>`;
      s += `<ellipse cx="${X0 + 12}" cy="${SUELO - H * 0.5}" rx="6" ry="17" fill="${c.color}" stroke="${LEAF}" stroke-width="2.5" transform="rotate(18 ${X0 + 12} ${SUELO - H * 0.5})"/>`;
      s += raices(X0, SUELO, 30, 16);
      return { s, org: [X0 + 16, SUELO - H * 0.5], tallo: [X0, SUELO - H * 0.25], copaP: [X0 - H * 0.3, SUELO - H * 0.7] };
    },
    mata(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0} ${SUELO} V${top + 12}" stroke="${LEAF}" stroke-width="3"/>`;
      for (let i = 0; i < 8; i++) { const y = SUELO - H * (0.2 + i * 0.1); s += hoja(X0, y, H * 0.28, i % 2 ? -30 : 210, i % 2 ? LEAF : LEAF2, 0.38); }
      [[X0 + 14, SUELO - H * 0.4], [X0 - 16, SUELO - H * 0.55], [X0 + 12, SUELO - H * 0.7]].forEach(([x, y]) => {
        s += `<path d="M${x} ${y} q8 6 4 20 q-6 -4 -4 -20Z" fill="${c.color}" stroke="${STEM}" stroke-width=".6"/>`;
      });
      s += raices(X0, SUELO, 24, 14);
      return { s, org: [X0 + 18, SUELO - H * 0.32], tallo: [X0, SUELO - H * 0.15], copaP: [X0 - H * 0.25, top + 20] };
    },
    tutorado(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0 - 46} ${SUELO} V${top - 4} M${X0 + 46} ${SUELO} V${top - 4}" stroke="${STEM}" stroke-width="4"/>` +
        `<path d="M${X0 - 46} ${top + 4} H${X0 + 46}" stroke="${MUTED}" stroke-width="1.2"/>` + linea(X0, top + 4, X0, SUELO, MUTED, 0.8, '3 2');
      s += `<path d="M${X0} ${SUELO} C${X0 - 6} ${SUELO - H * 0.4} ${X0 + 6} ${SUELO - H * 0.7} ${X0} ${top + 6}" stroke="${LEAF}" stroke-width="3" fill="none"/>`;
      for (let i = 0; i < 8; i++) s += hoja(X0, SUELO - H * (0.12 + i * 0.1), H * 0.2, i % 2 ? -20 : 200, i % 2 ? LEAF : LEAF2);
      [0.25, 0.42, 0.6].forEach((f, i) => {
        const y = SUELO - H * f;
        for (let j = 0; j < 3; j++) s += `<circle cx="${X0 + (i % 2 ? -14 : 14) + (j - 1) * 6}" cy="${y + j * 4}" r="${4.5 - i * 0.6}" fill="${c.color}" stroke="${STEM}" stroke-width=".5"/>`;
      });
      s += raices(X0, SUELO, 24, 14);
      return { s, org: [X0 + 20, SUELO - H * 0.25], tallo: [X0 - 46, SUELO - H * 0.7], copaP: [X0 - 14, SUELO - H * 0.55], soporte: true };
    },
    espaldera(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0 - 70} ${SUELO} V${top} M${X0 + 70} ${SUELO} V${top}" stroke="${STEM}" stroke-width="4"/>`;
      [0.45, 0.8].forEach((f) => { s += linea(X0 - 70, SUELO - H * f, X0 + 70, SUELO - H * f, MUTED, 1.2); });
      for (let i = 0; i < 5; i++) {
        const ang = -150 + i * 30;
        const rad = ang * Math.PI / 180;
        s += `<path d="M${X0} ${SUELO} Q${X0 + Math.cos(rad) * H * 0.4} ${SUELO - H * 0.6} ${X0 + Math.cos(rad) * H * 0.75} ${SUELO - H * (0.75 + (i % 2) * 0.1)}" stroke="${LEAF}" stroke-width="2.2" fill="none"/>`;
        s += hoja(X0 + Math.cos(rad) * H * 0.55, SUELO - H * 0.68, 14, ang + 40, LEAF2);
        s += `<circle cx="${X0 + Math.cos(rad) * H * 0.7}" cy="${SUELO - H * 0.74}" r="3.6" fill="${c.color}"/><circle cx="${X0 + Math.cos(rad) * H * 0.62}" cy="${SUELO - H * 0.66}" r="3" fill="${c.color}"/>`;
      }
      s += raices(X0, SUELO, 22, 14);
      return { s, org: [X0 + H * 0.36, SUELO - H * 0.7], tallo: [X0 - 70, SUELO - H * 0.45], copaP: [X0 - H * 0.3, SUELO - H * 0.55], soporte: true };
    },
    emparrado(H, c) {
      const top = SUELO - H; let s = '';
      [-110, -10, 90].forEach((dx) => { s += `<path d="M${X0 + dx} ${SUELO} V${top}" stroke="${STEM}" stroke-width="4"/>`; });
      s += linea(X0 - 120, top + 2, X0 + 100, top + 2, MUTED, 1.4);
      s += `<path d="M${X0 - 40} ${SUELO} C${X0 - 44} ${SUELO - H * 0.5} ${X0 - 30} ${top + 20} ${X0 - 40} ${top + 4}" stroke="${LEAF}" stroke-width="2.6" fill="none"/>`;
      for (let i = 0; i < 9; i++) s += hoja(X0 - 110 + i * 24, top + 6, 14, 70 + (i % 2) * 40, i % 2 ? LEAF : LEAF2, 0.5);
      [X0 - 80, X0 - 20, X0 + 30, X0 + 70].forEach((x) => { s += `<ellipse cx="${x}" cy="${top + 22}" rx="7" ry="8.5" fill="${c.color}" stroke="${STEM}" stroke-width=".6"/>${linea(x, top + 4, x, top + 14, LEAF, 1)}`; });
      s += raices(X0 - 40, SUELO, 22, 14);
      return { s, org: [X0 + 30, top + 26], tallo: [X0 + 90, SUELO - H * 0.5], copaP: [X0 - 100, top + 8], soporte: true };
    },
    arbusto(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0} ${SUELO} V${top + H * 0.2}" stroke="${STEM}" stroke-width="5"/>`;
      for (let i = 0; i < 7; i++) {
        const y = SUELO - H * (0.25 + i * 0.1), largo = H * (0.42 - i * 0.04);
        s += `<path d="M${X0} ${y} l${-largo} ${largo * 0.25} M${X0} ${y} l${largo} ${largo * 0.25}" stroke="${STEM}" stroke-width="1.6"/>`;
        for (let j = 1; j <= 3; j++) {
          s += hoja(X0 - largo * j / 3.3, y + largo * 0.25 * j / 3.3, 9, 110, j % 2 ? LEAF : LEAF2, 0.45) + hoja(X0 + largo * j / 3.3, y + largo * 0.25 * j / 3.3, 9, 70, j % 2 ? LEAF2 : LEAF, 0.45);
          if (i < 5 && j > 1) s += `<circle cx="${X0 + largo * j / 3.3}" cy="${y + largo * 0.25 * j / 3.3 + 3}" r="2.6" fill="${c.color}"/><circle cx="${X0 - largo * j / 3.3}" cy="${y + largo * 0.25 * j / 3.3 + 3}" r="2.6" fill="${c.color}"/>`;
        }
      }
      s += raices(X0, SUELO, 30, 18);
      return { s, org: [X0 + H * 0.3, SUELO - H * 0.33], tallo: [X0, SUELO - H * 0.12], copaP: [X0 - H * 0.42, SUELO - H * 0.3] };
    },
    // yuca: arbusto de tallos leñosos SIN fruto aéreo; lo cosechable son raíces bajo el suelo
    yuca(H, c) {
      const top = SUELO - H; let s = '';
      [-10, 0, 10].forEach((dx, i) => { s += `<path d="M${X0 + dx * 0.4} ${SUELO} Q${X0 + dx} ${SUELO - H * 0.5} ${X0 + dx * 2.2} ${top + 18 + i * 4}" stroke="${STEM}" stroke-width="3.4" fill="none"/>`; });
      [[-22, 0.08], [0, 0], [22, 0.06]].forEach(([dx, dy]) => {
        const cx = X0 + dx, cy = top + 18 + dy * H;
        for (let k = 0; k < 7; k++) s += hoja(cx, cy, H * 0.16, -180 + k * 30, k % 2 ? LEAF : LEAF2, 0.22);
      });
      [[-26, 26, -24], [0, 34, 0], [24, 28, 22]].forEach(([dx, dy, rot]) => {
        s += `<ellipse cx="${X0 + dx}" cy="${SUELO + dy * 0.6}" rx="5.5" ry="${dy * 0.55}" fill="${c.color}" stroke="${STEM}" stroke-width=".7" transform="rotate(${rot} ${X0 + dx} ${SUELO + dy * 0.6})"/>`;
      });
      return { s, org: [X0 + 26, SUELO + 18], tallo: [X0 + 4, SUELO - H * 0.3], copaP: [X0 - 30, top + 22] };
    },
    arbol(H, c, citrico) {
      const top = SUELO - H, cy = top + H * 0.36;
      let s = `<path d="M${X0 - 5} ${SUELO} L${X0 - 3} ${cy + H * 0.15} M${X0 + 5} ${SUELO} L${X0 + 3} ${cy + H * 0.15}" stroke="${STEM}" stroke-width="7" stroke-linecap="round"/>`;
      s += `<path d="M${X0} ${cy + H * 0.2} l-${H * 0.2} -${H * 0.15} M${X0} ${cy + H * 0.2} l${H * 0.22} -${H * 0.17}" stroke="${STEM}" stroke-width="3"/>`;
      s += copa(X0, cy, H * 0.42, H * 0.34);
      const fr = citrico ? 4.6 : 4;
      [[-0.25, 0.05], [0.18, -0.1], [0.28, 0.12], [-0.05, 0.2], [-0.32, -0.12], [0.05, -0.22]].forEach(([fx, fy]) => {
        s += `<circle cx="${X0 + fx * H}" cy="${cy + fy * H}" r="${fr}" fill="${c.color}" stroke="${STEM}" stroke-width=".5"/>`;
      });
      s += raices(X0, SUELO, 38, 18);
      return { s, org: [X0 + 0.28 * H, cy + 0.12 * H], tallo: [X0, SUELO - H * 0.12], copaP: [X0 - H * 0.42, cy - H * 0.2] };
    },
    citrico(H, c) { return FORMAS.arbol(H, c, true); },
    cacao(H, c) {
      const r0 = FORMAS.arbol(H, c);
      const top = SUELO - H; let s = r0.s;
      [[X0 + 6, SUELO - H * 0.3], [X0 - 7, SUELO - H * 0.42], [X0 + 7, SUELO - H * 0.5]].forEach(([x, y]) => {
        s += `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="9" fill="${c.color}" stroke="${STEM}" stroke-width=".7"/>`;
      });
      return { s, org: [X0 + 8, SUELO - H * 0.3], tallo: [X0, SUELO - H * 0.12], copaP: r0.copaP, top };
    },
    musacea(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0 - 7} ${SUELO} L${X0 - 5} ${SUELO - H * 0.55} L${X0 + 5} ${SUELO - H * 0.55} L${X0 + 7} ${SUELO}Z" fill="${LEAF}" stroke="${STEM}" stroke-width=".6"/>`;
      [-150, -120, -60, -30, -95].forEach((a, i) => { s += hoja(X0, SUELO - H * 0.55, H * 0.5, a, i % 2 ? LEAF : LEAF2, 0.2); });
      s += `<path d="M${X0 + 4} ${SUELO - H * 0.55} q24 10 26 34" stroke="${LEAF}" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="M${X0 + 22} ${SUELO - H * 0.45 + i * 7} q10 -2 14 4" stroke="${c.color}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      s += `<ellipse cx="${X0 + 32}" cy="${SUELO - H * 0.2}" rx="4" ry="7" fill="${ACC2}"/>`;
      s += `<path d="M${X0 + 26} ${SUELO} L${X0 + 26} ${SUELO - H * 0.2}" stroke="${LEAF2}" stroke-width="4"/>` + hoja(X0 + 26, SUELO - H * 0.2, 18, -60, LEAF2, 0.25);
      s += raices(X0, SUELO, 34, 16);
      return { s, org: [X0 + 38, SUELO - H * 0.42], tallo: [X0 - 6, SUELO - H * 0.3], copaP: [X0 - H * 0.4, top + H * 0.2], hijo: [X0 + 28, SUELO - H * 0.1] };
    },
    cana(H, c) {
      const top = SUELO - H; let s = '';
      [-30, -15, 0, 15, 30].forEach((dx, i) => {
        const x = X0 + dx;
        s += `<path d="M${x} ${SUELO} L${x + dx * 0.15} ${top + 20 + (i % 2) * 10}" stroke="${c.color}" stroke-width="5"/>`;
        for (let k = 1; k < 7; k++) s += linea(x - 3 + dx * 0.15 * k / 7, SUELO - (SUELO - top - 20) * k / 7, x + 3 + dx * 0.15 * k / 7, SUELO - (SUELO - top - 20) * k / 7, STEM, 0.8);
        s += hoja(x + dx * 0.15, top + 22 + (i % 2) * 10, H * 0.3, i % 2 ? -40 : 220, LEAF2, 0.1) + hoja(x + dx * 0.15, top + 24, H * 0.25, -90 + (i - 2) * 10, LEAF, 0.1);
      });
      s += raices(X0, SUELO, 40, 16);
      return { s, org: [X0 + 34, SUELO - H * 0.45], tallo: null, copaP: [X0 - 40, top + 18] };
    },
    fresa(H, c) {
      let s = `<rect x="${X0 - 70}" y="${SUELO - 6}" width="140" height="10" rx="3" fill="${MUTED}" opacity=".45"/>`;
      for (let i = 0; i < 7; i++) s += hoja(X0, SUELO - 8, 30, -90 + (i - 3) * 26, i % 2 ? LEAF : LEAF2, 0.5);
      [[X0 - 30, SUELO - 4], [X0 + 26, SUELO - 2], [X0 + 42, SUELO - 6]].forEach(([x, y]) => {
        s += `<path d="M${x} ${y - 10} q8 2 6 10 q-4 8 -6 9 q-2 -1 -6 -9 q-2 -8 6 -10Z" fill="${c.color}" stroke="${STEM}" stroke-width=".5"/>`;
      });
      s += raices(X0, SUELO + 4, 22, 12);
      return { s, org: [X0 + 26, SUELO - 6], tallo: [X0 - 64, SUELO - 1], copaP: [X0 - 22, SUELO - 34], camaP: true };
    },
    cactus(H, c) {
      const top = SUELO - H; let s = `<path d="M${X0 - 34} ${SUELO} V${top} M${X0 - 34} ${top + 4} h-26 M${X0 - 34} ${top + 4} h26" stroke="${STEM}" stroke-width="4"/>`;
      s += `<path d="M${X0 - 30} ${SUELO} C${X0 - 26} ${SUELO - H * 0.6} ${X0 - 20} ${top + 12} ${X0 - 4} ${top + 8}" stroke="${LEAF}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${X0 - 4} ${top + 8} C${X0 + 20} ${top + 4} ${X0 + 30} ${top + 24} ${X0 + 34} ${top + 46}" stroke="${LEAF2}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${X0 - 60} ${top + 6} C${X0 - 70} ${top + 20} ${X0 - 74} ${top + 34} ${X0 - 72} ${top + 52}" stroke="${LEAF2}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      s += `<ellipse cx="${X0 + 36}" cy="${top + 58}" rx="9" ry="12" fill="${c.color}" stroke="${STEM}" stroke-width=".8"/>`;
      s += raices(X0 - 30, SUELO, 22, 14);
      return { s, org: [X0 + 44, top + 60], tallo: [X0 - 34, SUELO - H * 0.3], copaP: [X0 - 74, top + 40], soporte: true };
    },
    generico(H, c) { return FORMAS.mata(H, c); },
  };

  function arquitectura(c) {
    const alt = c.altura_m || [0.5, 1.5];
    const hm = mid(alt), maxM = alt[1];
    // escala: la altura máxima ocupa 140 px (cultivos rastreros, al menos 40 px)
    const esc_ = 140 / maxM;
    let H = Math.max(c.diagrama === 'fresa' ? 30 : 42, hm * esc_);
    const f = (FORMAS[c.diagrama] || FORMAS.generico)(H, c);
    let s = `<rect x="0" y="0" width="${W1}" height="${H1}" rx="10" fill="${BG}"/>`;
    s += `<rect x="0" y="${SUELO}" width="${W1}" height="${H1 - SUELO}" fill="${SOIL}" opacity=".35"/>` + linea(0, SUELO, W1, SUELO, SOIL, 1.5);
    // escala vertical en metros
    const paso = maxM <= 0.6 ? 0.1 : maxM <= 1.5 ? 0.25 : maxM <= 3.5 ? 0.5 : maxM <= 6 ? 1 : 2;
    s += linea(26, SUELO, 26, SUELO - maxM * esc_, MUTED, 1);
    for (let m = 0; m <= maxM + 1e-9; m += paso) {
      const y = SUELO - m * esc_;
      s += linea(22, y, 30, y, MUTED, 1) + txt(19, y + 3, fmt(m, 2), { a: 'end', fs: 8, c: MUTED });
    }
    s += txt(8, 14, 'm', { fs: 8, c: MUTED });
    // banda de altura de referencia
    s += `<rect x="31" y="${SUELO - alt[1] * esc_}" width="4" height="${(alt[1] - alt[0]) * esc_}" fill="${c.color}" opacity=".75"/>`;
    s += f.s;
    // etiquetas
    s += guia(f.org[0], f.org[1], Math.min(W1 - 10, f.org[0] + 34), Math.min(H1 - 8, f.org[1] + (f.org[1] > SUELO ? 14 : -10)), c.organo || 'Producto', colorTexto(c.color));
    if (f.copaP) s += guia(f.copaP[0], f.copaP[1], 60, Math.max(16, f.copaP[1] - 12), c.diagrama === 'raiz' || c.diagrama === 'bulbo' ? 'Follaje' : 'Follaje / copa');
    if (f.soporte && f.tallo) s += guia(f.tallo[0], f.tallo[1], W1 - 12, f.tallo[1] - 16, 'Soporte / tutor');
    else if (f.tallo) s += guia(f.tallo[0], f.tallo[1], W1 - 12, f.tallo[1] + 4, c.diagrama === 'musacea' ? 'Pseudotallo' : 'Tallo / tronco');
    if (f.hijo) s += guia(f.hijo[0], f.hijo[1], W1 - 12, SUELO - 6, 'Hijo de sucesión');
    s += txt(W1 - 8, 14, `Altura de referencia ${fmt(alt[0], 2)}–${fmt(alt[1], 2)} m`, { a: 'end', fs: 9, c: MUTED });
    s += txt(10, H1 - 8, 'Zona radicular', { fs: 9, c: MUTED });
    return svg(W1, H1, s, `Arquitectura de ${c.nombre}`);
  }

  // ===================================================== 2. MARCO DE SIEMBRA
  /** obs = {surcos_m, plantas_m, disposicion} observado en campo (opcional). */
  function marco(c, obs) {
    const W = 340, H = 200;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="${BG}"/>`;
    const disp = (obs && obs.disposicion) || c.disposicion || 'cuadro';
    const a = (obs && obs.surcos_m) || mid(c.surcos_m), b = (obs && obs.plantas_m) || mid(c.plantas_m);
    if (disp === 'voleo' || !a || !b) {
      // siembra al voleo: puntos aleatorios deterministas y un marco de 1 m²
      let seed = 7;
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < 260; i++) s += `<circle cx="${20 + rnd() * 200}" cy="${20 + rnd() * 160}" r="1.6" fill="${LEAF}"/>`;
      s += `<rect x="90" y="70" width="60" height="60" fill="none" stroke="${c.color}" stroke-width="2"/>` + txt(120, 145, 'Marco 1 m²', { a: 'middle', fs: 9.5, c: INK, w: 600 });
      s += txt(236, 40, 'Siembra al voleo', { fs: 11, w: 700 }) + txt(236, 56, 'o en chorrillo.', { fs: 9.5, c: MUTED }) +
        txt(236, 84, 'No hay marco: la base', { fs: 9.5 }) + txt(236, 97, 'de cálculo es el m².', { fs: 9.5 }) +
        txt(236, 122, 'Cuente dentro', { fs: 9.5, c: MUTED }) + txt(236, 135, 'del marco en', { fs: 9.5, c: MUTED }) + txt(236, 148, 'cada punto.', { fs: 9.5, c: MUTED });
      return svg(W, H, s, 'Siembra al voleo');
    }
    // dibujo a escala: cabe una ventana de ~3 surcos × 4 plantas
    const nx = 4, ny = 3;
    const escala = Math.min(200 / (b * (nx - 1) + b), 150 / (a * (ny - 1) + a));
    const ox = 24 + (200 - escala * b * (nx - 1)) / 2, oy = 26 + (150 - escala * a * (ny - 1)) / 2;
    const rr = Math.max(3, Math.min(14, escala * Math.min(a, b) * 0.28));
    for (let j = 0; j < ny; j++) {
      const y = oy + j * a * escala;
      if (disp === 'surco' || disp === 'cama') s += `<rect x="16" y="${y - rr - 2}" width="216" height="${(rr + 2) * 2}" rx="3" fill="${SOIL}" opacity=".35"/>`;
      for (let i = 0; i < nx; i++) {
        const x = ox + i * b * escala + (disp === 'tresbolillo' && j % 2 ? b * escala / 2 : 0);
        if (x > 236) continue;
        s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="${LEAF2}" stroke="${LEAF}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="${Math.max(1.4, rr * 0.25)}" fill="${c.color}"/>`;
      }
    }
    // cotas
    const y0 = oy, y1 = oy + a * escala, x0 = ox, x1 = ox + b * escala;
    s += linea(x0 - 14, y0, x0 - 14, y1, INK, 1) + linea(x0 - 18, y0, x0 - 10, y0, INK, 1) + linea(x0 - 18, y1, x0 - 10, y1, INK, 1);
    s += `<text x="${x0 - 18}" y="${(y0 + y1) / 2}" font-size="9.5" fill="${INK}" text-anchor="middle" transform="rotate(-90 ${x0 - 18} ${(y0 + y1) / 2})" dy="-2">${esc(fmt(a, 2))} m</text>`;
    const yc = oy + (ny - 1) * a * escala + rr + 12;
    s += linea(x0, yc, x1, yc, INK, 1) + linea(x0, yc - 4, x0, yc + 4, INK, 1) + linea(x1, yc - 4, x1, yc + 4, INK, 1) + txt((x0 + x1) / 2, yc + 12, `${fmt(b, 2)} m`, { a: 'middle', fs: 9.5 });
    // texto
    const dens = 10000 / (a * b) * (disp === 'tresbolillo' ? 2 / Math.sqrt(3) : 1);
    const nombreDisp = { cuadro: 'En cuadro', tresbolillo: 'Tres bolillo', surco: 'En surcos', cama: 'En camas / eras' }[disp] || disp;
    s += txt(248, 34, nombreDisp, { fs: 11, w: 700 });
    s += txt(248, 54, obs ? 'Marco observado' : 'Marco de referencia', { fs: 9, c: MUTED });
    s += txt(248, 72, `${fmt(a, 2)} × ${fmt(b, 2)} m`, { fs: 11 });
    s += txt(248, 96, 'Densidad', { fs: 9, c: MUTED }) + txt(248, 112, `${fmt(dens, 0)} /ha`, { fs: 12, w: 700, c: INK });
    if (c.densidad_ha) s += txt(248, 132, `Ref. ${fmt(c.densidad_ha[0], 0)}–${fmt(c.densidad_ha[1], 0)}`, { fs: 9, c: MUTED });
    s += txt(248, 152, disp === 'tresbolillo' ? '10.000 ÷ (a×b) × 1,155' : '10.000 ÷ (a × b)', { fs: 8.5, c: MUTED });
    s += txt(248, 186, 'Planta, a escala', { fs: 8.5, c: MUTED });
    return svg(W, H, s, `Marco de siembra de ${c.nombre}`);
  }

  // ===================================================== 3. CICLO / FASES
  function ciclo(c, edadMeses) {
    const fases = c.fases || [];
    const W = 340, filas = Math.max(1, fases.length), H = 50 + filas * 22 + 24;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="${BG}"/>`;
    if (!fases.length) return svg(W, H, s + txt(16, 30, 'Sin fases cargadas para este cultivo.', { c: MUTED }), 'Ciclo');
    const enAnios = fases.some((f) => f.u === 'a');
    const fin = Math.max(...fases.map((f) => f.hasta));
    const L = 124, R = W - 14, sx = (R - L) / fin;
    // eje
    const paso = enAnios ? (fin > 20 ? 5 : fin > 8 ? 2 : 1) : (fin > 60 ? 12 : fin > 24 ? 6 : fin > 10 ? 2 : 1);
    for (let t = 0; t <= fin + 1e-9; t += paso) {
      const x = L + t * sx;
      s += linea(x, 30, x, H - 22, LINE, 0.8, '2 3') + txt(x, H - 10, fmt(t, 1), { a: 'middle', fs: 8.5, c: MUTED });
    }
    s += txt(R, 18, enAnios ? 'años desde la siembra' : 'meses desde la siembra', { a: 'end', fs: 8.5, c: MUTED });
    s += txt(14, 18, c.ciclo === 'transitorio' ? 'Ciclo del cultivo' : 'Vida del cultivo', { fs: 11, w: 700 });
    const prodRe = /(cosecha|producci|corte|llenado|madurez|cosechas)/i;
    fases.forEach((f, i) => {
      const y = 36 + i * 22;
      const nom = f.nombre.length > 24 ? f.nombre.slice(0, 23) + '…' : f.nombre;
      s += `<g><title>${esc(f.nombre)}</title>${txt(L - 6, y + 11, nom, { a: 'end', fs: f.nombre.length > 20 ? 8.4 : 9.2 })}</g>`;
      const prod = prodRe.test(f.nombre);
      s += `<rect x="${L + f.desde * sx}" y="${y + 2}" width="${Math.max(3, (f.hasta - f.desde) * sx)}" height="13" rx="4" fill="${prod ? c.color : LEAF2}" opacity="${prod ? 0.9 : 0.75}"/>`;
    });
    // inicio de producción
    if (c.inicio_prod_meses) {
      const t = (c.inicio_prod_meses[0]) / (enAnios ? 12 : 1);
      const x = L + t * sx;
      s += linea(x, 28, x, H - 22, ACC2, 1.2, '4 2') + txt(x + 3, 28, 'inicio de producción', { fs: 8, c: ACC2 });
    }
    if (edadMeses !== null && edadMeses !== undefined && Number.isFinite(edadMeses)) {
      const t = edadMeses / (enAnios ? 12 : 1);
      const x = L + Math.min(fin, t) * sx;
      s += `<path d="M${x - 5} ${H - 24} L${x + 5} ${H - 24} L${x} ${H - 16}Z" fill="${INK}"/>` + linea(x, 30, x, H - 24, INK, 1.6);
      s += txt(x, H - 26 - filas * 0, '', {});
      s += `<rect x="${Math.min(R - 74, x + 4)}" y="${30}" width="70" height="14" rx="3" fill="${INK}"/>` +
        txt(Math.min(R - 74, x + 4) + 35, 40, `lote: ${fmt(t, 1)} ${enAnios ? 'años' : 'meses'}`, { a: 'middle', fs: 8.5, c: 'var(--dg-bg,#fff)' });
    }
    return svg(W, H, s, `Fases de ${c.nombre}`);
  }

  // ===================================================== 4. RENDIMIENTO EVA
  function rendimiento(c, tHaEstimado) {
    const W = 340, H = 132;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="${BG}"/>`;
    const e = c.eva_ref;
    if (!e || (!e.boyaca && !e.nacional)) return svg(W, H, s + txt(16, 30, 'Sin datos EVA para este cultivo.', { c: MUTED }), 'Rendimiento');
    const vals = [e.boyaca && e.boyaca.p90, e.nacional && e.nacional.p90, tHaEstimado].filter((x) => Number.isFinite(x));
    const maxV = Math.max(...vals) * 1.12 || 1;
    const L = 92, R = W - 30, sx = (R - L) / maxV;
    s += txt(14, 18, 'Rendimiento municipal (EVA)', { fs: 11, w: 700 }) + txt(R, 18, 't/ha/año', { a: 'end', fs: 8.5, c: MUTED });
    const fila = (y, nombre, d, color) => {
      if (!d) return txt(L - 6, y + 4, nombre, { a: 'end', fs: 9.5, c: MUTED }) + txt(L, y + 4, 'sin dato', { fs: 9, c: MUTED });
      return txt(L - 6, y + 4, nombre, { a: 'end', fs: 9.5 }) +
        `<rect x="${L + d.p10 * sx}" y="${y - 6}" width="${Math.max(2, (d.p90 - d.p10) * sx)}" height="12" rx="6" fill="${color}" opacity=".35"/>` +
        linea(L + d.mediana * sx, y - 9, L + d.mediana * sx, y + 9, color, 3) +
        txt(L + d.p10 * sx - 4, y + 3, fmt(d.p10), { a: 'end', fs: 8, c: MUTED }) +
        txt(L + d.mediana * sx, y + 19, 'med. ' + fmt(d.mediana), { a: 'middle', fs: 8.6, w: 700 }) +
        txt(L + d.p90 * sx + 4, y + 3, fmt(d.p90), { a: 'start', fs: 8, c: MUTED });
    };
    s += fila(50, 'Boyacá', e.boyaca, c.color) + fila(94, 'Colombia', e.nacional, MUTED);
    if (Number.isFinite(tHaEstimado)) {
      const x = L + tHaEstimado * sx;
      s += linea(x, 32, x, 104, ACC2, 1.6, '4 2') + `<circle cx="${x}" cy="32" r="3.5" fill="${ACC2}"/>` +
        txt(x > R - 80 ? x - 6 : x + 6, 35, `estimado ${fmt(tHaEstimado)}`, { a: x > R - 80 ? 'end' : 'start', fs: 9, c: ACC2, w: 700 });
    }
    s += txt(14, H - 6, `Barra: 80 % central (p10–p90) · línea: mediana · ${e.boyaca ? e.boyaca.municipios + ' municipios de Boyacá' : ''}`, { fs: 8, c: MUTED });
    return svg(W, H, s, `Rendimiento EVA de ${c.nombre}`);
  }

  // ===================================================== 5. CÓMO MUESTREAR
  function muestreo(c) {
    const W = 340, H = 170;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="${BG}"/>`;
    // lote
    s += `<path d="M16 22 L196 14 L206 150 L22 156Z" fill="${LEAF2}" opacity=".22" stroke="${LEAF}" stroke-width="1.4"/>`;
    for (let i = 0; i < 9; i++) s += linea(24 + i * 20, 22 - i * 0.8, 28 + i * 20, 154 - i * 0.6, LEAF, 0.6, '2 4');
    // recorrido en W
    const pts = [[36, 40], [70, 136], [108, 52], [146, 138], [184, 40]];
    s += `<path d="M${pts.map((p) => p.join(' ')).join(' L')}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="5 3"/>`;
    pts.forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="8" fill="${c.color}" stroke="${INK}" stroke-width="1"/>` + txt(x, y + 3.5, i + 1, { a: 'middle', fs: 9, w: 700, c: '#fff' }); });
    s += txt(16, H - 2, 'Recorrido en W: evite bordes (2–3 surcos) y caminos', { fs: 8.5, c: MUTED });
    // unidad
    const base = c.produccion && c.produccion.base;
    const ux = 222;
    s += txt(ux, 26, 'En cada punto', { fs: 11, w: 700 });
    if (base === 'm2') {
      s += `<rect x="${ux + 8}" y="38" width="56" height="56" fill="none" stroke="${c.color}" stroke-width="2.2"/>`;
      for (let i = 0; i < 30; i++) s += `<circle cx="${ux + 14 + (i * 37) % 46}" cy="${44 + (i * 23) % 46}" r="1.6" fill="${LEAF}"/>`;
      s += txt(ux + 36, 106, 'marco 1 × 1 m', { a: 'middle', fs: 9 });
      s += txt(ux, 122, 'Cuente dentro del', { fs: 9 }) + txt(ux, 134, 'marco; pese o mida', { fs: 9 }) + txt(ux, 146, 'una submuestra.', { fs: 9 });
    } else {
      for (let i = 0; i < 5; i++) s += `<circle cx="${ux + 12 + i * 22}" cy="62" r="8" fill="${LEAF2}" stroke="${LEAF}"/>`;
      s += `<rect x="${ux + 2}" y="50" width="${4 * 22 + 20}" height="24" rx="6" fill="none" stroke="${c.color}" stroke-width="2"/>`;
      s += txt(ux, 90, `${(c.unidad || 'planta')}s seguidas`, { fs: 9 });
      s += txt(ux, 108, 'Cuente unidades y', { fs: 9 }) + txt(ux, 120, 'productivas; mida', { fs: 9 }) + txt(ux, 132, 'en las productivas.', { fs: 9 });
    }
    s += txt(ux, 158, 'Mínimo 5 puntos', { fs: 9, c: MUTED, w: 700 });
    return svg(W, H, s, 'Cómo muestrear');
  }

  const API = { arquitectura, marco, ciclo, rendimiento, muestreo };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.CultivosDiagramas = API;
})(typeof window !== 'undefined' ? window : globalThis);
