// Pruebas del motor de cultivos. Ejecutar:  node pruebas_calculos.js
// Cada cifra esperada está calculada a mano en el comentario de al lado.
const K = require('./cultivos_catalogo.js');
const C = require('./cultivos_calculos.js');
let ok = 0, mal = 0;
function igual(nombre, real, esperado, tol = 1e-6) {
  const pasa = (esperado === null) ? real === null
    : (typeof esperado === 'number' ? Math.abs(real - esperado) <= tol * Math.max(1, Math.abs(esperado)) : real === esperado);
  if (pasa) ok++; else { mal++; console.log('✗', nombre, '→', real, 'esperado', esperado); }
}

// ---- lectura de números
igual('num vacío', C.num(''), null);
igual('num 0', C.num('0'), 0);
igual('num 9. 02', C.num('9. 02'), 9.02);
igual('num 1.234,56', C.num('1.234,56'), 1234.56);
igual('num 12.500', C.num('12.500'), 12500);
igual('num 0.125 ha (no 125)', C.num('0.125'), 0.125);
igual('num 0,125', C.num('0,125'), 0.125);
igual('num 2,5', C.num('2,5'), 2.5);

// ---- marco
igual('densidad cuadro 1×0,4', C.densidadMarco(1, 0.4, 'surco'), 25000);
igual('densidad tresbolillo 6×6', C.densidadMarco(6, 6, 'tresbolillo'), 10000 / 36 * 2 / Math.sqrt(3));

// ---- estadística: 10, 12, 14 → media 12, desv 2, cv 16,667, t(2)=4,303, semi=4,303·2/√3=4,9687
const s = C.estadistica([10, 12, 14]);
igual('media', s.media, 12); igual('desv', s.desv, 2); igual('cv', s.cv, 100 * 2 / 12);
igual('ic95 inf', s.ic95[0], 12 - 4.303 * 2 / Math.sqrt(3));

// ---- PAPA por muestreo
const papa = K.get('papa');
const lotePapa = {
  especie: 'papa',
  geometria: { area_medida_ha: '2', area_productiva_pct: '90', dist_surcos_m: '1', dist_plantas_m: '0,4', disposicion: 'surco' },
  estado: {},
  edad: { fecha_siembra: '2026-06-01', etapa: 'llenado' },
  muestreo: { puntos: [
    { zona: 'Alta', unidades: 10, productivas: 9, valores: { tuberculos: 10, peso_tuberculo_g: 120, comercial_pct: 80 } },
    { zona: 'Alta', unidades: 10, productivas: 10, valores: { tuberculos: 12, peso_tuberculo_g: 110, comercial_pct: 90 } },
    { zona: 'Baja', unidades: 10, productivas: 8, valores: { tuberculos: 8, peso_tuberculo_g: 100, comercial_pct: 70 } },
    { zona: 'Baja', unidades: 10, productivas: 9, valores: { tuberculos: '', peso_tuberculo_g: 100 } }, // incompleto → fuera
  ] },
};
// kg/planta: 1,2 ; 1,32 ; 0,8 → media 1,10667
// área efectiva 1,8 ha ; marco 25.000/ha → 45.000 plantas ; fracción del muestreo (9+10+8+9)/40 = 0,9 → 40.500 productivas
// kg = 1,10667 × 40.500 = 44.820 ; comercial media (80+90+70)/3 = 80 % → 35.856 kg
const pf = C.produccionFisica(lotePapa, papa, 'muestreo');
igual('papa área efectiva', pf.geometria.area_efectiva_ha, 1.8);
igual('papa plantas', pf.geometria.unidades_total, 45000);
igual('papa fracción', pf.geometria.fraccion_productiva, 0.9);
igual('papa kg/planta', pf.muestreo.kg_base.media, (1.2 + 1.32 + 0.8) / 3);
igual('papa kg total', pf.kg_total, (1.2 + 1.32 + 0.8) / 3 * 40500);
igual('papa kg comercial', pf.kg_comercial, (1.2 + 1.32 + 0.8) / 3 * 40500 * 0.8);
igual('papa puntos válidos', pf.muestreo.puntos_validos, 3);
igual('papa zonas', pf.muestreo.zonas.length, 2);
igual('papa t/ha', pf.t_ha, (1.2 + 1.32 + 0.8) / 3 * 40500 / 1.8 / 1000);  // 24,9 t/ha
console.log('  papa:', Math.round(pf.kg_comercial), 'kg comerciales;', C.r(pf.t_ha, 1), 't/ha →', pf.eva && pf.eva.posicion);

// ---- CEBADA por m²: 400 espigas × 20 granos × 45 g/1000 = 360 g/m² = 0,36 kg/m² → 3.600 kg/ha ; 3 ha → 10.800 kg
const ceb = K.get('cebada');
const loteCeb = { especie: 'cebada', geometria: { area_cultivo_ha: 3 }, muestreo: { puntos: [
  { valores: { espigas_m2: 400, granos_espiga: 20, pmg_g: 45 } }] } };
const pc = C.produccionFisica(loteCeb, ceb, 'muestreo');
igual('cebada kg/m²', pc.muestreo.kg_base.media, 0.36);
igual('cebada kg/ha', pc.kg_ha, 3600);
igual('cebada kg', pc.kg_total, 10800);

// ---- FRÍJOL: 12 vainas × 5 granos × 40 g/100 granos = 24 g = 0,024 kg/planta
igual('frijol kg/planta', C.kgPorPunto({ valores: { vainas: 12, granos_vaina: 5, peso_100_granos_g: 40 } }, K.get('frijol')), 0.024);

// ---- valoración
const vp = C.valorar.pendiente({ kg_comercial: 10000, precio_kg: 1500, costos_pendientes: 2000000, costos_comercializacion: 500000 });
igual('pendiente neto', vp.valor, 12500000);
const vpd = C.valorar.pendiente({ kg_comercial: 10000, precio_kg: 1500, costos_pendientes: 2000000, costos_comercializacion: 500000, tasa_mensual_pct: 1, meses_a_cosecha: 2 });
igual('pendiente VP', vpd.valor, 12500000 / 1.01 ** 2);
const va = C.valorar.afectacion({ valor_sin: 10000000, valor_con: 6000000, costos_adicionales: 500000 });
igual('afectación suma costos (v11 los restaba)', va.valor, 4500000);
igual('afectación %', va.indicador_pct, 40);
const vr = C.valorar.renta({ renta_neta_anual: 1000000, tasa_pct: 10, anios_remanentes: 5 });
igual('renta anualidad 5 años', vr.valor, 1000000 * (1 - 1.1 ** -5) / 0.1);  // 3.790.787
igual('renta perpetua', C.valorar.renta({ renta_neta_anual: 1000000, tasa_pct: 10 }).valor, 10000000);
const ve = C.valorar.establecido({ componentes: [{ concepto: 'Establecimiento', valor: 8000000 }, { concepto: 'Sostenimiento', valor: 2000000 }],
  castigo_estado_pct: 10, vida_remanente: true, vida_total_anios: 20, edad_anios: 8, inicio_produccion_anios: 3 });
// 10 M × 0,9 = 9 M ; f = (20−8)/(20−3) = 0,70588 → 6.352.941
igual('establecido', ve.valor, 9000000 * 12 / 17);

// ---- edad y fase (café 4 años → plena producción)
const ef = C.edadFase({ edad: { edad_meses: 48 } }, K.get('cafe'), null);
igual('café fase', ef.fase, 'Plena producción');

// ---- revisión de captura
const rev = C.revisarLote({ especie: 'papa', geometria: {}, edad: {}, muestreo: { puntos: [] } }, papa);
igual('revisión faltan', rev.faltan.length, 5);

// ---- catálogo: toda fórmula usa claves del muestreo
for (const c of K.CULTIVOS) {
  const ks = new Set(c.muestreo.map((x) => x.k));
  c.produccion.factores.forEach((f) => igual(`${c.id} factor ${f}`, ks.has(f), true));
}

console.log(`\n${ok} pruebas bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
