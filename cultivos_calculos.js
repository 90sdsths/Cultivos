/* cultivos_calculos.js — motor de cálculo de cultivos (v12).

   Funciones PURAS: reciben un lote (el objeto del JSON `lotes_cultivo`) y el
   cultivo del catálogo, y devuelven números con su TRAZABILIDAD (de dónde salió
   cada cifra). No tocan la pantalla. Las usa:
     · la PWA de campo, para mostrar al momento cuánto da el muestreo;
     · la plataforma (Análisis → Cultivos), para el cálculo y la valoración;
     · las pruebas (node pruebas_calculos.js).

   Convenciones:
     · Vacío = null, nunca 0. Un 0 escrito es un 0 real.
     · Áreas en ha, distancias en m, pesos en g en campo y kg en resultados.
     · Toda salida importante trae `fuente` (texto corto) para el informe.
*/
(function (g) {
  'use strict';

  // ---------------------------------------------------------------- números
  /** Lee un número escrito en campo. Mismas reglas que numeroFlexible() de la
   *  PWA ("9. 02", "1.234,56", "12.500" = doce mil quinientos), con UNA
   *  diferencia a propósito: si la parte entera es 0 ("0.125", "0,125") el
   *  separador es SIEMPRE decimal — ningún número de miles empieza por 0, y en
   *  hectáreas "0.125 ha" no puede volverse 125 ha. Vacío → null, nunca 0. */
  function num(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    let s = String(v).replace(/\s+/g, '').replace(/[^\d.,+-]/g, '');
    if (!s || !/\d/.test(s)) return null;
    const neg = /^-/.test(s); s = s.replace(/[+-]/g, '');
    const coma = s.lastIndexOf(','), punto = s.lastIndexOf('.');
    const ceroEntero = /^0[.,]/.test(s);
    if (coma > -1 && punto > -1) {
      s = coma > punto ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (coma > -1) {
      const dec = s.length - coma - 1;
      s = (ceroEntero || (dec > 0 && dec <= 2)) ? s.replace(',', '.') : s.replace(/,/g, '');
    } else if (punto > -1) {
      const dec = s.length - punto - 1;
      if (!ceroEntero && !(dec > 0 && dec <= 2) && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    }
    const partes = s.split('.');
    if (partes.length > 2) s = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
    const n = parseFloat(s);
    return Number.isFinite(n) ? (neg ? -n : n) : null;
  }
  const hay = (v) => num(v) !== null;
  const pct = (v, def) => { const n = num(v); return n === null ? def : Math.min(100, Math.max(0, n)); };
  const r = (n, d = 2) => (n === null || n === undefined || !Number.isFinite(n)) ? null : Math.round(n * 10 ** d) / 10 ** d;

  // ------------------------------------------------------------ estadística
  // t de Student bilateral al 95 % para n−1 grados de libertad (1..30); luego 1,96.
  const T95 = [0, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145,
    2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
  function estadistica(valores) {
    const a = valores.filter((x) => Number.isFinite(x));
    const n = a.length;
    if (!n) return null;
    const media = a.reduce((s, x) => s + x, 0) / n;
    const desv = n > 1 ? Math.sqrt(a.reduce((s, x) => s + (x - media) ** 2, 0) / (n - 1)) : 0;
    const t = n > 1 ? (T95[n - 1] || 1.96) : null;
    const semi = t ? t * desv / Math.sqrt(n) : null;
    return {
      n, media, desv, cv: media ? desv / media * 100 : null, min: Math.min(...a), max: Math.max(...a),
      ic95: semi === null ? null : [media - semi, media + semi],
      error_rel_pct: semi === null || !media ? null : semi / media * 100,
    };
  }
  /** Cuántos puntos harían falta para un error relativo dado (95 %), con el CV observado. */
  function puntosNecesarios(cv, errorObjetivoPct = 15) {
    if (!cv) return null;
    return Math.max(2, Math.ceil((1.96 * cv / errorObjetivoPct) ** 2));
  }
  function lecturaCV(cv) {
    if (cv === null) return 'Un solo punto: no hay medida de variabilidad.';
    if (cv <= 15) return 'Variabilidad baja: el promedio representa bien el lote.';
    if (cv <= 30) return 'Variabilidad media: revise si hay zonas distintas y anótelas como estratos.';
    return 'Variabilidad alta: el lote no es homogéneo; estratifique o aumente los puntos.';
  }

  // ---------------------------------------------------------- geometría
  /** Plantas/ha de un marco. Tresbolillo: 15,5 % más plantas que en cuadro con la misma distancia. */
  function densidadMarco(surcos_m, plantas_m, disposicion) {
    const a = num(surcos_m), b = num(plantas_m);
    if (!a || !b) return null;
    const d = 10000 / (a * b);
    return disposicion === 'tresbolillo' ? d * 2 / Math.sqrt(3) : d;
  }

  /** Área efectiva y unidades productivas del lote, con la fuente de cada una. */
  function geometria(lote, c) {
    const geo = lote.geometria || {}, est = lote.estado || {};
    const area = num(geo.area_medida_ha) ?? num(geo.area_cultivo_ha);
    const fuenteArea = hay(geo.area_medida_ha) ? 'medida en campo' : (hay(geo.area_cultivo_ha) ? 'declarada / estimada' : null);
    const prodPct = pct(geo.area_productiva_pct, 100);
    const areaEf = area === null ? null : area * prodPct / 100;

    const dens = densidadMarco(geo.dist_surcos_m, geo.dist_plantas_m, geo.disposicion);
    let total = null, fuenteU = null;
    if (hay(geo.plantas_total)) { total = num(geo.plantas_total); fuenteU = geo.base_plantas || 'conteo / declarado'; }
    else if (dens && areaEf) { total = dens * areaEf; fuenteU = 'marco observado × área efectiva'; }

    // fracción productiva: la del lote, o la que da el muestreo, o 100 %
    const m = resumenUnidadesMuestreo(lote);
    let fracProd = 1, fuenteFrac = 'sin dato (100 %)';
    if (hay(est.vivas_pct) || hay(est.productivas_pct)) {
      fracProd = pct(est.vivas_pct, 100) / 100 * pct(est.productivas_pct, 100) / 100;
      fuenteFrac = 'estado del lote (vivas × productivas)';
    } else if (m.fraccion !== null) {
      fracProd = m.fraccion; fuenteFrac = `muestreo (${m.productivas} de ${m.unidades} unidades)`;
    }
    return {
      area_ha: area, fuente_area: fuenteArea, area_productiva_pct: prodPct, area_efectiva_ha: areaEf,
      densidad_marco_ha: dens, unidades_total: total, fuente_unidades: fuenteU,
      fraccion_productiva: fracProd, fuente_fraccion: fuenteFrac,
      unidades_productivas: total === null ? null : total * fracProd,
      densidad_real_ha: total !== null && areaEf ? total / areaEf : null,
    };
  }
  function resumenUnidadesMuestreo(lote) {
    const pts = (lote.muestreo && lote.muestreo.puntos) || [];
    let u = 0, p = 0, con = 0;
    pts.forEach((x) => { if (hay(x.unidades) && hay(x.productivas)) { u += num(x.unidades); p += num(x.productivas); con++; } });
    return { unidades: u, productivas: p, puntos: con, fraccion: u > 0 ? Math.min(1, p / u) : null };
  }

  // --------------------------------------------------------------- muestreo
  /** kg por unidad base de UN punto según la fórmula del catálogo. null si falta un factor. */
  function kgPorPunto(punto, c) {
    const f = c.produccion; const vals = punto.valores || {};
    let prod = 1;
    for (const k of f.factores) { const x = num(vals[k]); if (x === null) return null; prod *= x; }
    return prod / f.divisor;
  }
  function baseEtiqueta(c) {
    const b = c.produccion.base;
    return b === 'm2' ? 'kg/m²' : `kg/${b}`;
  }

  function muestreo(lote, c) {
    const pts = (lote.muestreo && lote.muestreo.puntos) || [];
    const kg = [], com = [], porZona = {}, alertas = [];
    const pesoK = c.muestreo.find((x) => /^peso_.*_g$/.test(x.k) && x.k !== 'peso_100_granos_g');
    pts.forEach((p, i) => {
      const k = kgPorPunto(p, c);
      if (k !== null) {
        kg.push(k);
        const z = (p.zona || '').trim() || 'Sin zona';
        (porZona[z] = porZona[z] || []).push(k);
      }
      const cp = num(p.valores && p.valores.comercial_pct);
      if (cp !== null) com.push(Math.min(100, Math.max(0, cp)));
      if (pesoK && c.peso_unidad_g) {
        const w = num(p.valores && p.valores[pesoK.k]);
        const [a, b] = c.peso_unidad_g;
        if (w !== null && (w < a * 0.5 || w > b * 1.5))
          alertas.push(`Punto ${i + 1}: ${pesoK.label.toLowerCase()} ${w} g muy fuera de la referencia (${a}–${b} g). Revise la unidad.`);
      }
    });
    const st = estadistica(kg);
    const stc = estadistica(com);
    const zonas = Object.entries(porZona).map(([z, a]) => ({ zona: z, ...estadistica(a) }));
    if (st && st.n < 3) alertas.push('Menos de 3 puntos con datos completos: el resultado es solo indicativo.');
    if (st && st.cv !== null && st.cv > 30) alertas.push(`CV ${r(st.cv, 1)} %: lote heterogéneo.`);
    return {
      base: c.produccion.base, base_label: baseEtiqueta(c), puntos_registrados: pts.length,
      puntos_validos: st ? st.n : 0, kg_base: st, comercial_pct: stc ? stc.media : null,
      zonas: zonas.length > 1 ? zonas : [], lectura: st ? lecturaCV(st.cv) : 'Sin puntos completos.',
      puntos_para_15pct: st ? puntosNecesarios(st.cv, 15) : null,
      factores: c.produccion.factores, nota_formula: c.produccion.nota || null, alertas,
    };
  }

  // ------------------------------------------------------ producción física
  /**
   * metodo: 'muestreo' | 'unidad' | 'hectarea' | 'registro'
   * opts: { kg_unidad, kg_ha, kg_registro, descarte_pct }
   */
  function produccionFisica(lote, c, metodo, opts = {}) {
    const geo = geometria(lote, c);
    const m = muestreo(lote, c);
    let kg = null, fuente = '', rendHa = null;
    const areaEf = geo.area_efectiva_ha;
    if (metodo === 'muestreo') {
      const k = m.kg_base && m.kg_base.media;
      if (k !== null && k !== undefined) {
        if (m.base === 'm2') {
          if (areaEf) { kg = k * areaEf * 10000; fuente = `${r(k, 4)} kg/m² × ${r(areaEf, 4)} ha efectivas`; }
          rendHa = k * 10000;
        } else if (geo.unidades_productivas) {
          kg = k * geo.unidades_productivas;
          fuente = `${r(k, 4)} ${m.base_label} × ${Math.round(geo.unidades_productivas)} unidades productivas`;
        }
      }
    } else if (metodo === 'unidad') {
      const k = num(opts.kg_unidad);
      if (k !== null && geo.unidades_productivas) { kg = k * geo.unidades_productivas; fuente = `${k} kg/unidad × ${Math.round(geo.unidades_productivas)} unidades productivas`; }
    } else if (metodo === 'hectarea') {
      const k = num(opts.kg_ha);
      if (k !== null && areaEf) { kg = k * areaEf; rendHa = k; fuente = `${k} kg/ha × ${r(areaEf, 4)} ha efectivas`; }
    } else if (metodo === 'registro') {
      kg = num(opts.kg_registro); fuente = 'producción pendiente informada / registrada';
    }
    if (rendHa === null && kg !== null && areaEf) rendHa = kg / areaEf;

    // fracción comercial: la del muestreo; si no, el descarte escrito; si no, 100 %
    let comPct = 100, fuenteCom = 'sin dato (100 %)';
    if (metodo === 'muestreo' && m.comercial_pct !== null) { comPct = m.comercial_pct; fuenteCom = 'promedio del muestreo'; }
    else if (hay(opts.descarte_pct)) { comPct = 100 - pct(opts.descarte_pct, 0); fuenteCom = 'descarte estimado'; }
    else if (hay(lote.estado && lote.estado.descarte_pct)) { comPct = 100 - pct(lote.estado.descarte_pct, 0); fuenteCom = 'descarte del lote'; }

    const kgCom = kg === null ? null : kg * comPct / 100;
    return {
      metodo, kg_total: kg, kg_comercial: kgCom, comercial_pct: comPct, fuente_comercial: fuenteCom,
      kg_ha: rendHa, t_ha: rendHa === null ? null : rendHa / 1000, fuente, geometria: geo, muestreo: m,
      eva: compararEva(rendHa === null ? null : rendHa / 1000, c),
    };
  }

  /** Dónde cae un rendimiento (t/ha) frente a su base EVA de Boyacá. */
  function compararEva(tHa, c) {
    const b = c.eva_ref && c.eva_ref.boyaca;
    if (!b || tHa === null) return null;
    let pos = 'dentro del rango usual (p10–p90)';
    if (tHa < b.p10) pos = 'por debajo del 90 % de los municipios';
    else if (tHa > b.p90) pos = 'por encima del 90 % de los municipios';
    return { t_ha: tHa, ...b, posicion: pos, veces_mediana: b.mediana ? tHa / b.mediana : null };
  }

  // ------------------------------------------------------------- edad y fase
  function mesesEntre(a, b) {
    const d1 = new Date(a), d2 = new Date(b);
    if (isNaN(d1) || isNaN(d2)) return null;
    return (d2 - d1) / (1000 * 60 * 60 * 24 * 30.4375);
  }
  /** Edad en meses (de la siembra, o la escrita) y la fase del catálogo donde cae. */
  function edadFase(lote, c, fechaRef) {
    const e = lote.edad || {};
    let meses = null, fuente = null;
    if (e.fecha_siembra && fechaRef) { meses = mesesEntre(e.fecha_siembra, fechaRef); fuente = 'fecha de siembra'; }
    if ((meses === null || meses < 0) && hay(e.edad_meses)) { meses = num(e.edad_meses); fuente = e.base_edad || 'edad escrita'; }
    if (meses === null) return { meses: null, fase: null, fuente: null, vida_consumida_pct: null };
    let fase = null;
    for (const f of c.fases || []) {
      const k = f.u === 'a' ? 12 : 1;
      if (meses >= f.desde * k && meses <= f.hasta * k) { fase = f.nombre; }
    }
    let vida = null;
    if (c.vida_util_anios) vida = Math.min(100, meses / (c.vida_util_anios[1] * 12) * 100);
    else if (c.ciclo_meses) vida = Math.min(100, meses / c.ciclo_meses[1] * 100);
    return { meses, anios: meses / 12, fase, fuente, vida_consumida_pct: vida };
  }

  // -------------------------------------------------------------- valoración
  function sumar(lista) { return (lista || []).reduce((s, x) => s + (num(x) || 0), 0); }

  /**
   * Cinco calculadoras. Cada una devuelve { valor, lineas:[[concepto, valor, nota]] }
   * para que la pantalla y el Excel muestren la cuenta completa. No eligen el
   * método: eso es criterio del avaluador.
   */
  const valorar = {
    /** Producción pendiente: kg comerciales × precio − costos para completarla − comercialización, opcional descontada. */
    pendiente(p) {
      const kg = num(p.kg_comercial), precio = num(p.precio_kg);
      const ing = kg !== null && precio !== null ? kg * precio : null;
      const cp = num(p.costos_pendientes) || 0, cc = num(p.costos_comercializacion) || 0;
      let neto = ing === null ? null : ing - cp - cc;
      const lineas = [['Producción comercial (kg)', kg], ['Precio en finca ($/kg)', precio], ['Ingreso bruto', ing],
        ['− Costos pendientes para completar', -cp], ['− Costos de cosecha y comercialización', -cc], ['Neto sin descontar', neto]];
      const i = num(p.tasa_mensual_pct), n = num(p.meses_a_cosecha);
      if (neto !== null && i && n) {
        const f = 1 / (1 + i / 100) ** n;
        neto = neto * f;
        lineas.push([`Factor de descuento (1+${i} %)^−${n}`, r(f, 4)], ['Valor presente', neto]);
      }
      return { valor: neto, lineas };
    },
    /** Cultivo establecido por costo: lo invertido hasta hoy, ajustado por estado y, si se pide, por vida remanente. */
    establecido(p) {
      const comp = (p.componentes || []).filter((x) => hay(x.valor));
      const base = sumar(comp.map((x) => x.valor));
      const lineas = comp.map((x) => [x.concepto || 'Componente', num(x.valor)]);
      lineas.push(['Costo acumulado', base]);
      const castigo = pct(p.castigo_estado_pct, 0);
      let v = base * (1 - castigo / 100);
      if (castigo) lineas.push([`− Castigo por estado (${castigo} %)`, -base * castigo / 100]);
      if (p.vida_remanente && hay(p.vida_total_anios) && hay(p.edad_anios)) {
        const tot = num(p.vida_total_anios), ed = num(p.edad_anios);
        const prodIni = num(p.inicio_produccion_anios) || 0;
        if (ed > prodIni && tot > prodIni) {
          const f = Math.max(0, Math.min(1, (tot - ed) / (tot - prodIni)));
          lineas.push([`× Vida productiva remanente ((${tot}−${r(ed, 1)}) ÷ (${tot}−${prodIni}))`, r(f, 4)]);
          v *= f;
        }
      }
      lineas.push(['Valor del cultivo establecido', v]);
      return { valor: comp.length ? v : null, lineas };
    },
    /** Pérdida por afectación = (valor sin − valor con) + costos ADICIONALES causados por la afectación. */
    afectacion(p) {
      const a = num(p.valor_sin), d = num(p.valor_con), extra = num(p.costos_adicionales) || 0;
      if (a === null || d === null) return { valor: null, lineas: [['Faltan valores antes y después', null]] };
      const perdida = Math.max(0, a - d) + extra;
      return { valor: perdida, indicador_pct: a ? Math.max(0, a - d) / a * 100 : null, lineas: [
        ['Valor sin afectación', a], ['Valor con afectación', d], ['Diferencia', Math.max(0, a - d)],
        ['+ Costos adicionales atribuibles', extra], ['Pérdida', perdida]] };
    },
    /** Renta: perpetua (R/i) o, para un cultivo con vida finita, anualidad por los años que le quedan. */
    renta(p) {
      const R = num(p.renta_neta_anual), i = num(p.tasa_pct);
      if (R === null || !i) return { valor: null, lineas: [['Faltan renta neta anual y tasa', null]] };
      const ii = i / 100, n = num(p.anios_remanentes);
      if (n && n > 0) {
        const f = (1 - (1 + ii) ** -n) / ii;
        return { valor: R * f, lineas: [['Renta neta anual', R], ['Tasa', `${i} %`], ['Años de vida remanente', n],
          [`Factor de anualidad (1−(1+i)^−n)/i`, r(f, 4)], ['Valor (anualidad)', R * f],
          ['Referencia perpetua R/i (no aplicable a vida finita)', R / ii]] };
      }
      return { valor: R / ii, lineas: [['Renta neta anual', R], ['Tasa', `${i} %`], ['Valor R ÷ i', R / ii]] };
    },
    /** Valor de mercado unitario × cantidad. */
    mercado(p) {
      const u = num(p.valor_unitario), q = num(p.cantidad);
      const v = u !== null && q !== null ? u * q : null;
      return { valor: v, lineas: [[`Valor unitario (${p.unidad || 'unidad'})`, u], ['Cantidad', q], ['Valor', v]] };
    },
  };

  /** Costos informados en campo, separados por etapa e incurrido/pendiente. */
  function costos(lote) {
    const lista = lote.costos_informados || [];
    const out = { incurrido: 0, pendiente: 0, por_etapa: {} };
    lista.forEach((x) => {
      const e = x.etapa || 'sin etapa';
      const a = num(x.incurrido) || 0, b = num(x.pendiente) || 0;
      out.incurrido += a; out.pendiente += b;
      out.por_etapa[e] = out.por_etapa[e] || { incurrido: 0, pendiente: 0 };
      out.por_etapa[e].incurrido += a; out.por_etapa[e].pendiente += b;
    });
    return out;
  }

  /** Revisión de captura: lo que falta para que el análisis no quede cojo. */
  function revisarLote(lote, c) {
    const faltan = [], avisos = [];
    const geo = lote.geometria || {};
    if (!lote.especie) faltan.push('cultivo');
    if (!hay(geo.area_medida_ha) && !hay(geo.area_cultivo_ha)) faltan.push('área del cultivo');
    if (c.produccion.base !== 'm2' && !hay(geo.plantas_total) && !(hay(geo.dist_surcos_m) && hay(geo.dist_plantas_m)))
      faltan.push('plantas contadas o marco de siembra');
    const e = lote.edad || {};
    if (!e.fecha_siembra && !hay(e.edad_meses)) faltan.push('edad o fecha de siembra');
    if (!e.etapa) faltan.push('etapa observada');
    const m = muestreo(lote, c);
    if (m.puntos_validos === 0) faltan.push('puntos de muestreo completos');
    else if (m.puntos_validos < 3) avisos.push('menos de 3 puntos de muestreo');
    avisos.push(...m.alertas);
    const geom = geometria(lote, c);
    if (geom.densidad_real_ha && c.densidad_ha) {
      const [a, b] = c.densidad_ha;
      if (geom.densidad_real_ha < a * 0.6 || geom.densidad_real_ha > b * 1.4)
        avisos.push(`densidad ${Math.round(geom.densidad_real_ha)} plantas/ha lejos de la referencia (${a}–${b})`);
    }
    if (!lote.mercado_informado || !hay(lote.mercado_informado.precio)) avisos.push('sin precio informado en finca');
    return { completo: faltan.length === 0, faltan, avisos };
  }

  const API = { num, hay, r, estadistica, puntosNecesarios, densidadMarco, geometria, kgPorPunto, muestreo,
    produccionFisica, compararEva, edadFase, valorar, costos, revisarLote, mesesEntre };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else g.CultivosCalc = API;
})(typeof window !== 'undefined' ? window : globalThis);
