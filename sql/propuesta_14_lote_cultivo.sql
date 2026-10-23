-- =============================================================================
--  14_lote_cultivo.sql  —  PROPUESTA (NO APLICADA). Revísela antes de correrla.
--
--  Opción A de CONTRATO_CULTIVOS.md: NO crea tablas. Los lotes de cultivo llegan
--  dentro del _Db.json rural (clave `lotes_cultivo`) y nucleo.importar_pwa ya
--  guarda ese JSON completo en nucleo.importacion_pwa.payload. Esta vista los
--  abre como filas, tomando SIEMPRE la importación más reciente de cada id_pwa.
--
--  Nombres: raíz `lote_cultivo`, para no tocar ni confundirse con lo que ya
--  existe:  nucleo.cultivos y nucleo.cultivos_detalle (EVA por municipio),
--  encargo_rural.tipo_de_cultivo / area_del_cultivo / distancia_de_siembra,
--  municipio.descripcion_cultivos, detalle_rural.productividad_cultivos y las
--  claves del JSON cultivos_actuales / cultivos_permanentes.
--
--  Un valor que no sea número (p. ej. texto que no se pudo leer en campo) sale
--  NULL en vez de romper la vista entera.
--
--  Solo lectura: si algún día quiere editar los lotes en la oficina (Edición de
--  encargos), eso es la opción B (tabla nucleo.lote_cultivo) — consultar antes.
-- =============================================================================

CREATE OR REPLACE VIEW nucleo.v_lote_cultivo AS
WITH ultima AS (
  SELECT DISTINCT ON (i.id_pwa) i.id_pwa, i.payload, i.encargo_rural_id, i.recibido_en
  FROM nucleo.importacion_pwa i
  WHERE i.tipo = 'RURAL' AND jsonb_typeof(i.payload->'lotes_cultivo') = 'array'
  ORDER BY i.id_pwa, i.recibido_en DESC, i.id DESC
)
SELECT
  u.encargo_rural_id,
  u.id_pwa,
  er.codigo_dane,
  l->>'id'                                             AS lote_id,
  l->>'nombre_lote'                                    AS nombre_lote,
  l->>'especie'                                        AS especie,
  l->>'especie_nombre'                                 AS especie_nombre,
  l->>'eva_nombre'                                     AS eva_nombre,
  (SELECT string_agg(x, ', ') FROM jsonb_array_elements_text(l->'objeto') x) AS objeto,
  l#>>'{identificacion,variedad}'                      AS variedad,
  l#>>'{identificacion,sistema}'                       AS sistema,
  CASE WHEN l#>>'{edad,fecha_siembra}' ~ '^\d{4}-\d{2}-\d{2}$' THEN (l#>>'{edad,fecha_siembra}')::date END         AS fecha_siembra,
  CASE WHEN l#>>'{edad,edad_meses}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{edad,edad_meses}')::numeric END                   AS edad_meses,
  l#>>'{edad,etapa}'                                   AS etapa,
  coalesce(CASE WHEN l#>>'{geometria,area_medida_ha}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,area_medida_ha}')::numeric END,
           CASE WHEN l#>>'{geometria,area_cultivo_ha}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,area_cultivo_ha}')::numeric END) AS area_ha,
  CASE WHEN l#>>'{geometria,area_productiva_pct}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,area_productiva_pct}')::numeric END     AS area_productiva_pct,
  l#>>'{geometria,disposicion}'                        AS disposicion,
  CASE WHEN l#>>'{geometria,dist_surcos_m}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,dist_surcos_m}')::numeric END           AS dist_surcos_m,
  CASE WHEN l#>>'{geometria,dist_plantas_m}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,dist_plantas_m}')::numeric END          AS dist_plantas_m,
  CASE WHEN l#>>'{geometria,plantas_total}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,plantas_total}')::numeric END           AS plantas_total,
  CASE WHEN l#>>'{geometria,lat}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,lat}')::numeric END                     AS lat,
  CASE WHEN l#>>'{geometria,lng}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{geometria,lng}')::numeric END                     AS lng,
  l#>>'{estado,estado_general}'                        AS estado_general,
  l#>>'{sanidad,intensidad}'                           AS afectacion,
  jsonb_array_length(coalesce(l#>'{muestreo,puntos}', '[]'))  AS puntos_muestreo,
  CASE WHEN l#>>'{mercado_informado,precio}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{mercado_informado,precio}')::numeric END          AS precio_informado,
  l#>>'{mercado_informado,unidad_venta}'               AS unidad_venta,
  CASE WHEN l#>>'{mercado_informado,kg_por_unidad}' ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (l#>>'{mercado_informado,kg_por_unidad}')::numeric END   AS kg_por_unidad,
  l                                                    AS lote_json,
  u.recibido_en
FROM ultima u
CROSS JOIN LATERAL jsonb_array_elements(u.payload->'lotes_cultivo') l
LEFT JOIN nucleo.encargo_rural er ON er.id = u.encargo_rural_id;

COMMENT ON VIEW nucleo.v_lote_cultivo IS
  'Lotes de cultivo capturados en la PWA (clave lotes_cultivo del _Db.json rural), '
  'leídos de la importación más reciente de cada id_pwa. No es tabla: no se edita. '
  'Cruza con nucleo.cultivos_detalle por (codigo_dane, eva_nombre = cultivo).';

-- Referencia EVA del MISMO municipio para cada lote (lo que usa el análisis).
CREATE OR REPLACE VIEW nucleo.v_lote_cultivo_eva AS
SELECT v.encargo_rural_id, v.lote_id, v.especie_nombre, v.area_ha,
       d.rendimiento_t_ha       AS eva_rend_municipio_t_ha,
       d.area_sembrada_ha_anio  AS eva_area_municipio_ha,
       d.puesto_por_area        AS eva_puesto_area
FROM nucleo.v_lote_cultivo v
LEFT JOIN nucleo.cultivos_detalle d
       ON d.codigo_dane = v.codigo_dane AND d.cultivo = v.eva_nombre;
