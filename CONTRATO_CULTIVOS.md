# Cultivos v12: contrato de datos e integración

> Léalo antes de integrar los cultivos a la PWA de campo o a la plataforma.
> Versión del esquema: `version_esquema = 1` · catálogo `2026-10-23`.

## 1. Qué hay en la carpeta

| Archivo | Va a | Qué es |
|---|---|---|
| `cultivos_catalogo.js` | PWA **y** plataforma | Catálogo de 43 cultivos con rangos numéricos, variables, muestreo, fórmula, fases, riesgos y la referencia EVA de Boyacá. **Generado**: no se edita a mano. |
| `cultivos_calculos.js` | PWA **y** plataforma | Motor de cálculo puro: lectura de números, geometría, estadística del muestreo, producción física, edad y fase, cinco calculadoras de valoración y revisión de la captura. |
| `cultivos_diagramas.js` | PWA **y** plataforma | Cinco diagramas SVG: arquitectura a escala, marco de siembra a escala, fases, rendimiento EVA y cómo muestrear. |
| `cultivos_modulo.js` | PWA | La sección de captura (`crearCultivos`), con el mismo patrón que `crearFotos` y `crearMapaCampo`. |
| `cultivos.html` | Solo prueba | Página para probar el módulo sola. Guarda en el navegador y exporta un `_Db.json`. |
| `analisis_cultivos.html` | Solo prueba | Prototipo del módulo de Análisis. Abre el `_Db.json`, calcula y valora. |
| `pruebas_calculos.js` | — | `node pruebas_calculos.js`: 128 pruebas con las cifras calculadas a mano. |
| `build/catalogo_fuente.py` | — | **Aquí se edita el catálogo.** |
| `build/construir_catalogo.py` | — | Regenera el catálogo a partir del fuente y de `cultivos_detalle.csv`. Revisa la coherencia entre marco y densidad, y entre fórmula y muestreo. |
| `sql/propuesta_14_lote_cultivo.sql` | Base | Propuesta de vista. **No aplicada.** |
| `tema.js`, `fotos.js` | — | Copias de la PWA, solo para que la prueba funcione sola. |

Para regenerar el catálogo después de editar el fuente:
`python build/construir_catalogo.py "D:\0000 Megasincro Completo\Compartida PC\Sig y SQl\SQL\datos\cultivos_detalle.csv" cultivos_catalogo.js`

## 2. Nombres y choques

En la base ya existen, y **no se tocan**:
- Las tablas `nucleo.cultivos` y `nucleo.cultivos_detalle` (estadísticas EVA por municipio, hojas 7 y 8).
- Las columnas `encargo_rural.tipo_de_cultivo`, `area_del_cultivo`, `distancia_de_siembra` y la ya retirada `cultivos_permanentes`.
- `municipio.descripcion_cultivos` y `detalle_rural.productividad_cultivos`.
- Las claves del JSON rural `cultivos_actuales` y `cultivos_permanentes`, que siguen como resumen textual de la tarjeta «Entorno».

Todo lo nuevo usa la raíz **`lote_cultivo`**:
- La clave del JSON es `lotes_cultivo`.
- La vista propuesta es `nucleo.v_lote_cultivo`.
- El tipo de análisis es `cultivo` (prefijo propuesto **LFV**, porque LFC ya es Costo).

La tabla EVA no choca: **se usa**. Cada cultivo del catálogo lleva `eva` con el nombre exacto de `cultivos_detalle.cultivo` (por ejemplo `Caña`, `Durazno o albaricoque`, `Gulupa o cholupa`). Así el cruce es directo, sin adivinar nombres.

## 3. Forma del dato (`lotes_cultivo[]` dentro del `_Db.json` rural)

Reglas que evitan problemas en el análisis:
1. **Vacío = `null`, nunca 0.** Es la misma lección del `||0` de las medidas (pendiente 6 del CONTEXTO).
2. **Números como número.** Se leen con las reglas de `numeroFlexible()`, con una excepción: un valor con entero 0 («0.125») es siempre decimal, para que 0,125 ha no se vuelva 125 ha.
3. **La unidad va en el nombre de la clave** (`_ha`, `_m`, `_pct`, `_g`, `_kg`, `_meses`).
4. **Todo lo que se filtra o agrupa es lista cerrada** (objeto, sistema, etapa, estado, riego…), no texto libre.
5. **Lo medido y lo informado van por separado.** `muestreo` y `geometria` son lo medido. `produccion_informada`, `mercado_informado` y `costos_informados` son lo que dicen el productor o los documentos.
6. **Claves con nombre**, nunca posiciones. La v11 guardaba las etapas como `stage_1…6` (que cambiaban de significado según el cultivo) y los costos como arreglos sueltos.

```text
lote
├─ id ("lc_…"), version_esquema, catalogo_version
├─ especie (id del catálogo), especie_nombre, eva_nombre, nombre_lote
├─ objeto[]            establecido | pendiente | afectacion | lucro | infraestructura
├─ identificacion      variedad, patron, sistema
├─ edad                fecha_siembra, fecha_trasplante, fecha_primera_cosecha, edad_meses, base_edad, etapa (clave de c.etapas)
├─ geometria           area_medida_ha, area_cultivo_ha, fuente_area, area_productiva_pct, disposicion,
│                      dist_surcos_m, dist_plantas_m, plantas_total, base_plantas, lat, lng, precision_m
├─ estado              vivas_pct, productivas_pct, descarte_pct, uniformidad, vigor, estado_general, renovacion, vida_remanente_meses
├─ arquitectura        altura_m, copa_m, tronco_cm, soporte_estado
├─ variables{}         las del cultivo (por ejemplo numero_soca, variedad_cafe, patron)
├─ muestreo            metodo, criterio, puntos[]
│     └─ punto         id, zona, unidades, productivas, valores{k: número}, estado, obs, lat, lng, precision_m
├─ etapas_pct{}        {clave_etapa: %}; la suma debe dar 100
├─ manejo              riego, fertirriego, sombra_pct, suelo, drenaje, malezas, nutricion, poda, fuente, notas
├─ sanidad             intensidad, area_afectada_pct, unidades_afectadas_pct, parte_afectada, riesgos_observados[], signos, factor, fuente
├─ produccion_informada cosechado_kg, cosechas_n, frecuencia, fecha_proxima_cosecha, rendimiento_valor, rendimiento_unidad, produccion_anual_kg, informante
├─ mercado_informado   precio, unidad_venta, kg_por_unidad, precio_min, precio_max, comprador, fecha_precio, notas
├─ costos_informados[] concepto, etapa (establecimiento|sostenimiento|cosecha|comercializacion), incurrido, pendiente, soporte
├─ infraestructura[]   elemento, cantidad, unidad, edad_anios, estado, obs
├─ fotos[]             como fotos.js: nombre, fecha, lat, lng, alt, origen (solo referencias, no la imagen)
├─ documentos          plano, costos, ventas, tecnicos, contratos (sí/no), detalle
└─ observaciones, limitaciones, creado, actualizado
```

**Cómo se lee el muestreo.** En cada punto se anotan las `unidades` vistas y cuántas son `productivas`. Las variables se miden en las productivas. El kg por unidad base del punto es `producto(factores) ÷ divisor`, con la fórmula del catálogo. La base es planta, árbol, cepa o macolla, o m² en cebolla de bulbo, ajo, zanahoria y cereales, que se muestrean con un marco de 1 m².

## 4. Qué va a la PWA y qué va a la plataforma

| PWA de campo (`cultivos_modulo.js`) | Plataforma, Análisis → Cultivos |
|---|---|
| Ficha de consulta, también antes de la visita | La misma ficha, con la EVA **del municipio del encargo** |
| Identificación, edad, área, marco, estado y manejo | Base física, con la fuente de cada cifra |
| Muestreo por puntos, con promedio, CV, IC 95 % y puntos que faltan | Producción física por 4 métodos: muestreo, unidad, hectárea, registro |
| Lo informado: producción, precio, costos, infraestructura | 5 calculadoras: pendiente, establecido, afectación, renta, mercado |
| Revisión: qué falta para que el análisis no quede cojo | Valor adoptado, justificación, copia congelada del lote |

En campo **no se valora**: la cuenta definitiva es del análisis. El cálculo en la PWA solo sirve para saber si el muestreo alcanza.

## 5. Base de datos: dos opciones (decide usted)

**Opción A (recomendada ahora): ninguna tabla nueva.**
- `nucleo.importar_pwa` ya guarda el JSON completo en `nucleo.importacion_pwa.payload`. La clave nueva no le estorba: la ignora.
- La vista `nucleo.v_lote_cultivo` abre los lotes como filas, una por lote, con la importación más reciente de cada `id_pwa`.
- `nucleo.v_lote_cultivo_eva` cruza cada lote con la EVA de su municipio.
- El análisis se guarda en `public.analisis` con `tipo = 'cultivo'`, igual que Lotes, Costo o Renta. Basta agregar `"cultivo"` a `TIPOS` en `analisis.py`.
- Probado en un PostgreSQL 16 de prueba con su esquema de `importacion_pwa`: una fila por lote, y un valor mal escrito sale NULL sin romper la vista.
- Límite: es **solo lectura**. Lo que falte se completa en la PWA y se reimporta.

**Opción B: tabla `nucleo.lote_cultivo`**, llenada por `importar_pwa`.
- Solo si quiere completar los lotes en la oficina, en Edición de encargos, como hace hoy con los rurales.
- Cuesta una tabla, ampliar `importar_pwa` y otro grupo en el formulario.
- Por su regla de no ampliar la base sin razón, propongo esperar a ver si de verdad le hace falta.

## 6. Integración (cuando lo decida)

**PWA (`avaluos_app`):**
1. Copiar los 4 archivos `cultivos_*.js` (sin `cultivos.html`) a la raíz de la PWA.
2. En `rural.html`, agregar una tarjeta igual a «Fotos de la visita»: `<div class="card"><div class="card-header"><span>🌱 Cultivos</span></div><div class="card-body"><div id="cultivosContainer"></div></div></div>`.
3. Cargar los scripts antes del `<script>` principal: catálogo, cálculos, diagramas y módulo.
4. `const cultivosMod = crearCultivos('cultivosContainer', { fechaVisita: () => document.getElementById('f_fecha_visita').value });`
5. En `construirRegistro()`, agregar `lotes_cultivo: cultivosMod ? cultivosMod.getData() : [],`.
6. En `cargarEdicion()`, agregar `if (cultivosMod) cultivosMod.setData(d.lotes_cultivo || []);`.
7. En `sw.js`, agregar los 4 archivos a la caché y **subir la versión** (`avaluos-v43`); si no, la tableta se queda con la copia vieja.
8. Opcional: pasar el autoguardado de borrador (`borrador.js`) al `onChange` del módulo.

**Plataforma:**
1. Copiar los 3 archivos compartidos (catálogo, cálculos, diagramas) junto a `calculos.js`.
2. Aplicar la opción A (o B).
3. Portar `analisis_cultivos.html` como pestaña «🌱 Cultivos» de `analisis_ui.js`, tipo `cultivo`, prefijo LFV.
4. En la exportación a Excel (`analisis_excel.py`), una hoja LFV con las líneas de la calculadora como fórmulas vivas, como en Renta.

## 7. Qué se corrigió de la v11

- **Fotos en base64 dentro de localStorage**: se llenaba a los ~5 MB y se perdía el expediente sin aviso. Ahora se guardan solo referencias, como en `fotos.js`.
- **Afectación**: los costos adicionales causados por el daño se **restaban** de la pérdida; ahora se suman.
- **Descarte perdido**: el valor pasaba con «comercial 100 %» por defecto e ignoraba el descarte. Ahora el porcentaje comercial sale del muestreo o del descarte, y queda dicho de dónde salió.
- **Producción duplicada**: había tres sitios con cifras distintas (Producción, Cálculo físico y Cierre). Ahora hay un solo motor.
- **Renta perpetua**: R ÷ i para un cultivo de vida finita sobrevalora. Ahora se puede usar anualidad por los años remanentes, y la perpetua se muestra solo como referencia.
- **Ceros por defecto**: campos vacíos que valían 0 (cosechado = 0, comercial = 100). Ahora quedan en `null`.
- **Guardado indiscriminado**: `collect()` guardaba todos los campos de la pantalla, incluso los calculados, y las versiones iban mezcladas (v8, v10, v11). Ahora hay un esquema explícito y versionado.
- **Rangos como texto** («0,80–1,20 x 0,25–0,40 m»), que no se podían comparar ni graficar. Ahora son números.
- **Diagramas**: dibujos genéricos sin escala. Ahora hay escala en metros, marco a escala (con el observado si existe), fases con la edad del lote, la EVA real de Boyacá y la guía de muestreo.
- **Cobertura del catálogo**: de 26 a 43 cultivos. Se agregaron los de más área en Boyacá según su propia base: yuca, arracacha, naranja, mandarina, aguacate, guayaba, guanábana, curuba, gulupa, granadilla, feijoa, arándano, haba, avena, quinua, banano y cebolla de rama.

## 8. Límites que debe conocer

- **Los rangos técnicos** (altura, marco, altitud, fases, peso del órgano) son referencias generales de trabajo, no de una fuente única verificada cultivo por cultivo. El catálogo lo advierte. Lo que **sí es dato verificable** es el rendimiento EVA, que sale de su base.
- **La EVA de café** es pergamino seco. **La de cacao** es grano seco. **La de caña** puede ser caña o panela, según el municipio. Las fichas lo avisan, porque comparar cereza contra pergamino da cinco veces de diferencia.
- **En los permanentes**, el muestreo da la **carga presente**, no la producción anual. La comparación con la EVA (anual) es orientativa.
- **No hay fotos reales** de los cultivos: son esquemas. Fotos reales pedirían descargarlas (igual que las de tipologías, que dejó en pausa) y harían pesar la PWA.
- **La norma**: no pude verificar si la Res. 941 de 2026 trae un artículo específico de cultivos. Las calculadoras hacen la aritmética; la escogencia del método y su cita son suyas.
