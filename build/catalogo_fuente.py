# -*- coding: utf-8 -*-
"""Fuente del catálogo de cultivos (v12).

Se edita AQUÍ y se genera cultivos_catalogo.js con construir_catalogo.py.
Así el mismo catálogo sirve a la PWA (offline) y a la plataforma.

Reglas del catálogo:
  * Toda cifra es un RANGO numérico [min, max] con su unidad en el nombre de la
    clave (_m, _ha, _meses, _anios, _g, _msnm, _c). Nada de "0,8–1,2 m" en texto:
    con texto no se puede comparar ni graficar.
  * Los rangos son REFERENCIAS DE TRABAJO (literatura técnica general de
    Colombia). Varían con variedad, patrón, sistema y clima: la ficha lo dice.
  * El rendimiento NO se escribe a mano: sale de su propia base EVA
    (nucleo.cultivos_detalle, municipios de Boyacá) en construir_catalogo.py.
  * 'eva' = nombre EXACTO del cultivo en nucleo.cultivos_detalle.cultivo, para
    cruzar sin adivinar.
  * Las claves de las variables de muestreo son snake_case, sin tildes, con la
    unidad al final: así llegan iguales al JSON, a la base y al Excel.
"""

# ---------------------------------------------------------------------------
# Bloques reutilizables
# ---------------------------------------------------------------------------
def v(k, label, unidad='', tipo='num', paso=None, opciones=None):
    d = {'k': k, 'label': label, 'u': unidad, 't': tipo}
    if paso is not None: d['paso'] = paso
    if opciones: d['op'] = opciones
    return d

CALIBRE = ['Extra', 'Primera', 'Segunda', 'Tercera', 'Mixto']
FIRMEZA = ['Firme', 'Media', 'Blanda', 'Mixta']

V_FRUTOS_PESO = [v('frutos', 'Frutos por unidad', 'n', paso=1),
                 v('peso_fruto_g', 'Peso medio del fruto', 'g', paso=0.1),
                 v('calibre', 'Calibre predominante', '', 'op', opciones=CALIBRE),
                 v('comercial_pct', 'Comerciales', '%', paso=1)]

ETAPAS_FRUTAL = [('floracion', 'Floración'), ('cuajado', 'Cuajado'),
                 ('desarrollo', 'Fruto en desarrollo'), ('maduracion', 'Maduración'),
                 ('cosechable', 'Cosechable'), ('descarte', 'Afectado / descarte')]
ETAPAS_CADUCIFOLIO = [('reposo', 'Reposo / defoliado'), ('brotacion', 'Brotación'),
                      ('floracion', 'Floración'), ('cuajado', 'Cuajado'),
                      ('desarrollo', 'Fruto en desarrollo'), ('cosechable', 'Cosechable')]
ETAPAS_CEREAL = [('vegetativo', 'Vegetativo'), ('macollamiento', 'Macollamiento'),
                 ('espigamiento', 'Espigamiento'), ('llenado', 'Llenado'),
                 ('madurez', 'Madurez'), ('acame', 'Acame / daño')]

SANO_ARBOL = [
    ('Copa', 'Equilibrada, sin ramas secas ni desgarradas; poda de formación visible.'),
    ('Follaje', 'Verde uniforme, sin defoliación generalizada ni clorosis extendida.'),
    ('Tronco y cuello', 'Firme, sin chancros, exudados, pudrición ni daño mecánico.'),
    ('Carga', 'Flores y frutos acordes con la época y la edad del árbol.'),
    ('Uniformidad', 'La mayoría de árboles del lote se parecen entre sí.'),
]

AV_PERMANENTE = [
    'La edad define la fase de vida (levante, plena, declinación): pida soporte de la fecha de siembra.',
    'Separe el valor del árbol establecido del valor de la cosecha pendiente; no los sume dos veces.',
    'Cuente árboles productivos, improductivos, resiembras y fallas por aparte.',
]
AV_TRANSITORIO = [
    'El valor cambia con la etapa: antes de cosecha pesa el costo invertido; cerca de cosecha, la producción pendiente.',
    'Mida el área realmente sembrada; descuente caminos, zanjas y fallas.',
    'Registre la fecha probable de cosecha y quién la estima.',
]

# ---------------------------------------------------------------------------
# CATÁLOGO
# Claves:
#   id, nombre, cientifico, familia, grupo, eva, eva_producto, ciclo, habito,
#   diagrama, organo, unidad (unidad biológica que se cuenta), altura_m,
#   surcos_m, plantas_m, disposicion, densidad_ha, altitud_msnm, temp_c,
#   inicio_prod_meses, ciclo_meses (transitorios) / vida_util_anios
#   (permanentes), fases [(nombre, desde, hasta, unidad 'm'|'a')],
#   peso_unidad_g (órgano cosechado), venta (unidad, kg),
#   variables (del lote), muestreo (por punto), produccion (fórmula),
#   etapas, sano, riesgos, avaluo, color (del fruto/órgano)
# ---------------------------------------------------------------------------
C = []

# ======================= RAÍCES Y TUBÉRCULOS =======================
C.append(dict(
    id='papa', nombre='Papa', cientifico='Solanum tuberosum', familia='Solanaceae',
    grupo='Raíces y tubérculos', eva='Papa', ciclo='transitorio', habito='Herbáceo erecto',
    diagrama='tuberculo', organo='Tubérculo', unidad='planta', color='#C9965F',
    altura_m=[0.4, 1.0], surcos_m=[0.9, 1.1], plantas_m=[0.3, 0.4], disposicion='surco',
    densidad_ha=[22000, 40000], altitud_msnm=[2000, 3400], temp_c=[8, 18],
    inicio_prod_meses=[4, 6], ciclo_meses=[4, 7],
    fases=[('Siembra y emergencia', 0, 1, 'm'), ('Desarrollo foliar', 1, 2.5, 'm'),
           ('Tuberización', 2, 3.5, 'm'), ('Llenado', 3, 5, 'm'), ('Madurez y cosecha', 4.5, 7, 'm')],
    peso_unidad_g=[60, 250], venta=('bulto', 50),
    variables=[v('variedad_tipo', 'Tipo', '', 'op', opciones=['Pastusa / Parda', 'Criolla', 'R-12 / Diacol', 'Única', 'Tuquerreña', 'Otra']),
               v('aporque', 'Aporque', '', 'op', opciones=['Hecho', 'Parcial', 'No']),
               v('semilla', 'Origen de la semilla', '', 'op', opciones=['Certificada', 'Seleccionada propia', 'Comprada sin certificar', 'No se sabe'])],
    muestreo=[v('tuberculos', 'Tubérculos / planta', 'n', paso=1),
              v('peso_tuberculo_g', 'Peso medio del tubérculo', 'g', paso=1),
              v('comercial_pct', 'Comercial (1ª+2ª)', '%', paso=1),
              v('dano_pct', 'Dañados (polilla, gusano)', '%', paso=1)],
    produccion=dict(base='planta', factores=['tuberculos', 'peso_tuberculo_g'], divisor=1000),
    etapas=[('emergencia', 'Emergencia'), ('vegetativo', 'Desarrollo foliar'), ('tuberizacion', 'Tuberización'),
            ('llenado', 'Llenado'), ('madurez', 'Madurez'), ('descarte', 'Afectado')],
    sano=[('Follaje', 'Verde oscuro, cerrado entre surcos en floración, sin manchas grandes con halo.'),
          ('Tallos', 'Erectos, sin pudrición en la base ni marchitez súbita.'),
          ('Surco', 'Aporcado, sin tubérculos expuestos al sol (verdeados).'),
          ('Tubérculo', 'Firme, piel sana, sin galerías ni perforaciones al abrir una planta de muestra.')],
    riesgos=['Gota (Phytophthora infestans)', 'Polilla guatemalteca', 'Gusano blanco', 'Heladas', 'Exceso de lluvia en cosecha'],
    avaluo=AV_TRANSITORIO + ['Abra plantas en cada punto: el tubérculo no se ve desde afuera.',
                             'Convierta a bultos de 50 kg solo al final; registre en kg.'],
))
C.append(dict(
    id='yuca', nombre='Yuca', cientifico='Manihot esculenta', familia='Euphorbiaceae',
    grupo='Raíces y tubérculos', eva='Yuca', ciclo='transitorio', habito='Arbustivo',
    diagrama='yuca', organo='Raíz tuberosa', unidad='planta', color='#B98A5A',
    altura_m=[1.5, 3.0], surcos_m=[1.0, 1.2], plantas_m=[0.8, 1.0], disposicion='cuadro',
    densidad_ha=[8000, 12500], altitud_msnm=[0, 1800], temp_c=[20, 30],
    inicio_prod_meses=[8, 12], ciclo_meses=[8, 18],
    fases=[('Brotación', 0, 1, 'm'), ('Desarrollo foliar', 1, 4, 'm'),
           ('Engrosamiento de raíces', 3, 10, 'm'), ('Madurez y cosecha', 8, 18, 'm')],
    peso_unidad_g=[300, 1500], venta=('bulto', 50),
    variables=[],
    muestreo=[v('raices', 'Raíces comerciales / planta', 'n', paso=1),
              v('peso_raiz_g', 'Peso medio de la raíz', 'g', paso=10),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['raices', 'peso_raiz_g'], divisor=1000),
    etapas=[('brotacion', 'Brotación'), ('vegetativo', 'Desarrollo foliar'), ('engrosamiento', 'Engrosamiento'),
            ('madurez', 'Madurez'), ('cosecha', 'Cosecha'), ('descarte', 'Afectado')],
    sano=[('Tallo', 'Leñoso, sin pudrición basal.'), ('Follaje', 'Hojas palmeadas verdes, sin mosaico ni enrollamiento.'),
          ('Raíces', 'Firmes, sin pudrición al arrancar una planta de muestra.')],
    riesgos=['Pudrición de raíz', 'Mosca blanca / virosis', 'Gusano cachón'],
    avaluo=AV_TRANSITORIO + ['Pasado el punto de cosecha la raíz se lignifica: anote si está pasada.'],
))
C.append(dict(
    id='arracacha', nombre='Arracacha', cientifico='Arracacia xanthorrhiza', familia='Apiaceae',
    grupo='Raíces y tubérculos', eva='Arracacha', ciclo='transitorio', habito='Herbáceo en macolla',
    diagrama='raiz', organo='Raíz reservante', unidad='planta', color='#E3C77A',
    altura_m=[0.4, 1.0], surcos_m=[0.8, 1.0], plantas_m=[0.6, 0.8], disposicion='surco',
    densidad_ha=[12500, 20000], altitud_msnm=[1800, 3000], temp_c=[12, 20],
    inicio_prod_meses=[8, 12], ciclo_meses=[8, 14],
    fases=[('Establecimiento del colino', 0, 2, 'm'), ('Desarrollo foliar', 2, 6, 'm'),
           ('Engrosamiento', 5, 11, 'm'), ('Cosecha', 8, 14, 'm')],
    peso_unidad_g=[80, 300], venta=('bulto', 50),
    variables=[],
    muestreo=[v('raices', 'Raíces / planta', 'n', paso=1), v('peso_raiz_g', 'Peso medio raíz', 'g', paso=1),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['raices', 'peso_raiz_g'], divisor=1000),
    etapas=[('establecimiento', 'Establecimiento'), ('vegetativo', 'Desarrollo foliar'), ('engrosamiento', 'Engrosamiento'),
            ('cosecha', 'Cosechable'), ('pasado', 'Pasado de punto'), ('descarte', 'Afectado')],
    sano=[('Macolla', 'Hojas erguidas y verdes, sin amarillamiento basal.'), ('Cepa', 'Sin pudrición blanda.')],
    riesgos=['Pudrición basal', 'Exceso de humedad'],
    avaluo=AV_TRANSITORIO,
))
C.append(dict(
    id='zanahoria', nombre='Zanahoria', cientifico='Daucus carota', familia='Apiaceae',
    grupo='Hortalizas', eva='Zanahoria', ciclo='transitorio', habito='Roseta',
    diagrama='raiz', organo='Raíz', unidad='m2', color='#E8893A',
    altura_m=[0.3, 0.6], surcos_m=[0.2, 0.3], plantas_m=[0.04, 0.08], disposicion='cama',
    densidad_ha=[400000, 900000], altitud_msnm=[1800, 3000], temp_c=[12, 20],
    inicio_prod_meses=[3, 5], ciclo_meses=[3, 5],
    fases=[('Germinación', 0, 0.7, 'm'), ('Desarrollo foliar', 0.5, 2, 'm'), ('Engrosamiento', 1.5, 4, 'm'), ('Cosecha', 3, 5, 'm')],
    peso_unidad_g=[80, 250], venta=('bulto', 50),
    variables=[v('ancho_era_m', 'Ancho de era', 'm', paso=0.05)],
    muestreo=[v('raices_m2', 'Raíces por m²', 'n/m²', paso=1), v('peso_raiz_g', 'Peso medio raíz', 'g', paso=1),
              v('comercial_pct', 'Comercial', '%', paso=1), v('dano_pct', 'Bifurcadas / rajadas', '%', paso=1)],
    produccion=dict(base='m2', factores=['raices_m2', 'peso_raiz_g'], divisor=1000),
    etapas=[('germinacion', 'Germinación'), ('vegetativo', 'Desarrollo foliar'), ('engrosamiento', 'Engrosamiento'),
            ('cosecha', 'Cosechable'), ('descarte', 'Bifurcada / dañada'), ('falla', 'Falla de germinación')],
    sano=[('Follaje', 'Uniforme en altura y color en toda la era.'), ('Raíz', 'Recta, lisa, sin rajaduras ni bifurcación.')],
    riesgos=['Bifurcación por suelo compactado', 'Alternaria', 'Nematodos'],
    avaluo=AV_TRANSITORIO + ['Muestree con un marco de 1 m² en la era: la base de cálculo es el m², no la planta.'],
))

# ============================ HORTALIZAS ============================
C.append(dict(
    id='cebolla_bulbo', nombre='Cebolla de bulbo', cientifico='Allium cepa', familia='Amaryllidaceae',
    grupo='Hortalizas', eva='Cebolla de bulbo', ciclo='transitorio', habito='Roseta con bulbo',
    diagrama='bulbo', organo='Bulbo', unidad='m2', color='#C98A4B',
    altura_m=[0.4, 0.7], surcos_m=[0.25, 0.4], plantas_m=[0.08, 0.12], disposicion='cama',
    densidad_ha=[250000, 450000], altitud_msnm=[1800, 3000], temp_c=[12, 22],
    inicio_prod_meses=[4, 6], ciclo_meses=[4, 6],
    fases=[('Trasplante', 0, 0.5, 'm'), ('Desarrollo foliar', 0.5, 2.5, 'm'), ('Bulbificación', 2, 4.5, 'm'),
           ('Madurez (volcamiento)', 4, 5.5, 'm'), ('Curado', 5, 6, 'm')],
    peso_unidad_g=[80, 300], venta=('bulto', 50),
    variables=[v('color_bulbo', 'Color', '', 'op', opciones=['Roja', 'Blanca', 'Amarilla'])],
    muestreo=[v('bulbos_m2', 'Bulbos por m²', 'n/m²', paso=1), v('peso_bulbo_g', 'Peso medio bulbo', 'g', paso=1),
              v('diametro_cm', 'Diámetro medio', 'cm', paso=0.1), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='m2', factores=['bulbos_m2', 'peso_bulbo_g'], divisor=1000),
    etapas=[('vegetativo', 'Desarrollo foliar'), ('bulbificacion', 'Bulbificación'), ('madurez', 'Madurez / cuello doblado'),
            ('curado', 'En curado'), ('cosecha', 'Cosechado'), ('descarte', 'Afectado')],
    sano=[('Hojas', 'Erguidas, cerosas, sin manchas púrpuras ni puntas secas generalizadas.'),
          ('Bulbo', 'Firme, cuello delgado al madurar, sin pudrición basal.')],
    riesgos=['Mancha púrpura', 'Mildeo velloso', 'Trips', 'Pudrición basal'],
    avaluo=AV_TRANSITORIO + ['El calibre define el precio: registre la proporción por calibre.'],
))
C.append(dict(
    id='cebolla_rama', nombre='Cebolla de rama (junca)', cientifico='Allium fistulosum', familia='Amaryllidaceae',
    grupo='Hortalizas', eva='Cebolla de rama', ciclo='semipermanente', habito='Macolla',
    diagrama='macolla', organo='Tallo / macolla', unidad='macolla', color='#8DB05A',
    altura_m=[0.4, 0.8], surcos_m=[0.4, 0.6], plantas_m=[0.25, 0.35], disposicion='surco',
    densidad_ha=[45000, 90000], altitud_msnm=[2500, 3200], temp_c=[10, 16],
    inicio_prod_meses=[4, 6], vida_util_anios=[2, 4],
    fases=[('Establecimiento', 0, 4, 'm'), ('Primer corte', 4, 6, 'm'), ('Cortes sucesivos', 6, 30, 'm'), ('Renovación', 24, 48, 'm')],
    peso_unidad_g=[400, 1500], venta=('atado / arroba', 12.5),
    variables=[v('cortes_acumulados', 'Cortes realizados', 'n', paso=1), v('meses_entre_cortes', 'Meses entre cortes', 'meses', paso=0.5)],
    muestreo=[v('tallos', 'Tallos por macolla', 'n', paso=1), v('peso_macolla_g', 'Peso de la macolla cosechable', 'g', paso=10),
              v('altura_m', 'Altura', 'm', paso=0.01), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='macolla', factores=['peso_macolla_g'], divisor=1000),
    etapas=[('rebrote', 'Rebrote'), ('macollamiento', 'Macollamiento'), ('engrosamiento', 'Engrosamiento'),
            ('corte', 'Lista para corte'), ('pasada', 'Pasada / florecida'), ('descarte', 'Afectada')],
    sano=[('Tallos', 'Gruesos, blancos en la base, verdes y firmes arriba.'), ('Macolla', 'Cerrada, sin tallos amarillos ni pudrición del cuello.')],
    riesgos=['Mancha púrpura', 'Pudrición blanca', 'Trips'],
    avaluo=['Producción por cortes: registre cortes hechos y meses entre cortes.',
            'Valor por corte pendiente, no por ciclo único.'],
))
C.append(dict(
    id='ajo', nombre='Ajo', cientifico='Allium sativum', familia='Amaryllidaceae',
    grupo='Hortalizas', eva='Ajo', ciclo='transitorio', habito='Roseta con bulbo',
    diagrama='bulbo', organo='Bulbo (cabeza)', unidad='m2', color='#E6DCC8',
    altura_m=[0.4, 0.7], surcos_m=[0.2, 0.3], plantas_m=[0.1, 0.15], disposicion='cama',
    densidad_ha=[220000, 450000], altitud_msnm=[2200, 3000], temp_c=[10, 18],
    inicio_prod_meses=[5, 7], ciclo_meses=[5, 7],
    fases=[('Siembra del diente', 0, 0.7, 'm'), ('Desarrollo foliar', 0.5, 3, 'm'), ('Bulbificación', 2.5, 5.5, 'm'), ('Madurez y curado', 5, 7, 'm')],
    peso_unidad_g=[30, 80], venta=('kg', 1),
    variables=[],
    muestreo=[v('bulbos_m2', 'Bulbos por m²', 'n/m²', paso=1), v('peso_bulbo_g', 'Peso medio bulbo', 'g', paso=1),
              v('dientes', 'Dientes por bulbo', 'n', paso=1), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='m2', factores=['bulbos_m2', 'peso_bulbo_g'], divisor=1000),
    etapas=[('vegetativo', 'Desarrollo foliar'), ('bulbificacion', 'Bulbificación'), ('madurez', 'Madurez'),
            ('curado', 'Curado'), ('cosecha', 'Cosechado'), ('descarte', 'Afectado')],
    sano=[('Hojas', 'Verdes y erguidas hasta la bulbificación.'), ('Bulbo', 'Cerrado, dientes bien formados, sin pudrición.')],
    riesgos=['Roya', 'Pudrición blanca', 'Ácaros'],
    avaluo=AV_TRANSITORIO,
))
C.append(dict(
    id='tomate', nombre='Tomate', cientifico='Solanum lycopersicum', familia='Solanaceae',
    grupo='Hortalizas', eva='Tomate', ciclo='transitorio', habito='Tutorado',
    diagrama='tutorado', organo='Fruto', unidad='planta', color='#D9483B',
    altura_m=[1.5, 3.0], surcos_m=[1.0, 1.5], plantas_m=[0.3, 0.5], disposicion='surco',
    densidad_ha=[15000, 30000], altitud_msnm=[800, 2400], temp_c=[16, 26],
    inicio_prod_meses=[2.5, 3.5], ciclo_meses=[6, 10],
    fases=[('Trasplante', 0, 0.5, 'm'), ('Vegetativo', 0.5, 1.5, 'm'), ('Floración y cuajado', 1.2, 6, 'm'),
           ('Cosechas sucesivas', 2.5, 9, 'm'), ('Fin de ciclo', 8, 10, 'm')],
    peso_unidad_g=[80, 250], venta=('canastilla', 22),
    variables=[v('sistema_tomate', 'Sistema', '', 'op', opciones=['Invernadero', 'Campo abierto']),
               v('racimos_cosechados', 'Racimos ya cosechados / planta', 'n', paso=1),
               v('tipo_tomate', 'Tipo', '', 'op', opciones=['Chonto', 'Larga vida', 'Milano', 'Cherry', 'Otro'])],
    muestreo=[v('racimos', 'Racimos con fruto / planta', 'n', paso=1), v('frutos_racimo', 'Frutos / racimo', 'n', paso=0.5),
              v('peso_fruto_g', 'Peso medio fruto', 'g', paso=1), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['racimos', 'frutos_racimo', 'peso_fruto_g'], divisor=1000),
    etapas=[('vegetativo', 'Vegetativo'), ('floracion', 'Floración'), ('cuajado', 'Cuajado'),
            ('llenado', 'Llenado'), ('maduracion', 'Pintón / maduro'), ('descarte', 'Afectado')],
    sano=[('Tallo guía', 'Recto, amarrado al tutor, entrenudos cortos.'), ('Hojas', 'Verdes, sin manchas concéntricas ni mosaico.'),
          ('Racimos', 'Escalonados de abajo arriba: maduros abajo, flores arriba.'), ('Fruto', 'Liso, sin pudrición apical ni perforaciones.')],
    riesgos=['Gota', 'Pasador del fruto (Neoleucinodes)', 'Mosca blanca / virosis', 'Pudrición apical'],
    avaluo=AV_TRANSITORIO + ['Cuente solo racimos pendientes por cosechar; los ya cosechados van como dato aparte.'],
))
C.append(dict(
    id='arveja', nombre='Arveja', cientifico='Pisum sativum', familia='Fabaceae',
    grupo='Leguminosas', eva='Arveja', ciclo='transitorio', habito='Trepador tutorado',
    diagrama='tutorado', organo='Vaina verde / grano', unidad='planta', color='#79A84C',
    altura_m=[1.0, 2.0], surcos_m=[1.0, 1.4], plantas_m=[0.1, 0.25], disposicion='surco',
    densidad_ha=[40000, 100000], altitud_msnm=[2200, 3000], temp_c=[10, 18],
    inicio_prod_meses=[3, 4], ciclo_meses=[4, 5],
    fases=[('Emergencia', 0, 0.5, 'm'), ('Vegetativo', 0.5, 2, 'm'), ('Floración', 1.8, 3, 'm'),
           ('Llenado de vaina', 2.5, 4, 'm'), ('Cosecha en verde', 3, 5, 'm')],
    peso_unidad_g=[4, 10], venta=('bulto', 50),
    variables=[v('destino', 'Destino', '', 'op', opciones=['Vaina verde', 'Grano seco'])],
    muestreo=[v('vainas', 'Vainas / planta', 'n', paso=1), v('peso_vaina_g', 'Peso medio vaina', 'g', paso=0.1),
              v('granos_vaina', 'Granos / vaina', 'n', paso=0.5), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['vainas', 'peso_vaina_g'], divisor=1000),
    etapas=[('vegetativo', 'Vegetativo'), ('floracion', 'Floración'), ('llenado', 'Llenado de vaina'),
            ('cosechable', 'Cosechable'), ('sobremadura', 'Sobremadura'), ('descarte', 'Afectada')],
    sano=[('Tutorado', 'Firme, plantas trepando sin caerse.'), ('Follaje', 'Verde, sin polvillo blanco ni manchas.'), ('Vainas', 'Llenas y lisas.')],
    riesgos=['Ascochyta', 'Oídio', 'Heladas en floración'],
    avaluo=AV_TRANSITORIO,
))
C.append(dict(
    id='frijol', nombre='Fríjol', cientifico='Phaseolus vulgaris', familia='Fabaceae',
    grupo='Leguminosas', eva='Frijol', ciclo='transitorio', habito='Arbustivo o voluble',
    diagrama='mata', organo='Grano', unidad='planta', color='#8E3B2E',
    altura_m=[0.4, 2.0], surcos_m=[0.6, 1.0], plantas_m=[0.1, 0.3], disposicion='surco',
    densidad_ha=[60000, 200000], altitud_msnm=[1200, 2600], temp_c=[14, 24],
    inicio_prod_meses=[3, 5], ciclo_meses=[3, 6],
    fases=[('Emergencia', 0, 0.4, 'm'), ('Vegetativo', 0.4, 1.5, 'm'), ('Floración', 1.3, 2.5, 'm'), ('Llenado', 2, 4, 'm'), ('Madurez', 3, 6, 'm')],
    peso_unidad_g=[0.3, 0.7], venta=('kg', 1),
    variables=[v('habito_frijol', 'Hábito', '', 'op', opciones=['Arbustivo', 'Voluble con tutor', 'Asociado con maíz'])],
    muestreo=[v('vainas', 'Vainas / planta', 'n', paso=1), v('granos_vaina', 'Granos / vaina', 'n', paso=0.5),
              v('peso_100_granos_g', 'Peso de 100 granos', 'g', paso=0.5), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['vainas', 'granos_vaina', 'peso_100_granos_g'], divisor=100000),
    etapas=[('vegetativo', 'Vegetativo'), ('floracion', 'Floración'), ('llenado', 'Llenado'),
            ('madurez', 'Madurez'), ('cosecha', 'Cosechado'), ('descarte', 'Afectado')],
    sano=[('Plantas', 'Uniformes, sin amarillamiento generalizado.'), ('Vainas', 'Sin manchas hundidas (antracnosis).')],
    riesgos=['Antracnosis', 'Roya', 'Mosca blanca'],
    avaluo=AV_TRANSITORIO,
))
C.append(dict(
    id='haba', nombre='Haba', cientifico='Vicia faba', familia='Fabaceae',
    grupo='Leguminosas', eva='Haba', ciclo='transitorio', habito='Herbáceo erecto',
    diagrama='mata', organo='Vaina / grano', unidad='planta', color='#86A74E',
    altura_m=[0.8, 1.5], surcos_m=[0.8, 1.0], plantas_m=[0.3, 0.4], disposicion='surco',
    densidad_ha=[25000, 40000], altitud_msnm=[2500, 3300], temp_c=[8, 16],
    inicio_prod_meses=[4, 6], ciclo_meses=[5, 7],
    fases=[('Emergencia', 0, 0.7, 'm'), ('Vegetativo', 0.7, 2.5, 'm'), ('Floración', 2.5, 4, 'm'), ('Llenado', 3.5, 5.5, 'm'), ('Cosecha', 4.5, 7, 'm')],
    peso_unidad_g=[15, 40], venta=('bulto', 50),
    variables=[],
    muestreo=[v('vainas', 'Vainas / planta', 'n', paso=1), v('peso_vaina_g', 'Peso medio vaina', 'g', paso=0.5),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['vainas', 'peso_vaina_g'], divisor=1000),
    etapas=[('vegetativo', 'Vegetativo'), ('floracion', 'Floración'), ('llenado', 'Llenado'),
            ('cosechable', 'Cosechable'), ('sobremadura', 'Seca'), ('descarte', 'Afectada')],
    sano=[('Tallos', 'Erectos, sin manchas chocolate.'), ('Vainas', 'Llenas, distribuidas a lo largo del tallo.')],
    riesgos=['Mancha de chocolate (Botrytis)', 'Heladas'],
    avaluo=AV_TRANSITORIO,
))

# ============================= CEREALES =============================
def cereal(id_, nombre, cient, eva, alt, pmg, extra=None):
    d = dict(id=id_, nombre=nombre, cientifico=cient, familia='Poaceae', grupo='Cereales', eva=eva,
             ciclo='transitorio', habito='Herbáceo en macollas', diagrama='cereal', organo='Grano',
             unidad='m2', color='#D4B25A', altura_m=alt, surcos_m=[0.15, 0.2], plantas_m=[0.0, 0.0],
             disposicion='voleo', densidad_ha=None, altitud_msnm=[2400, 3200], temp_c=[8, 16],
             inicio_prod_meses=[5, 7], ciclo_meses=[5, 7],
             fases=[('Emergencia', 0, 0.5, 'm'), ('Macollamiento', 0.5, 2, 'm'), ('Encañado', 1.8, 3, 'm'),
                    ('Espigamiento', 2.8, 3.8, 'm'), ('Llenado', 3.5, 5, 'm'), ('Madurez y cosecha', 4.8, 7, 'm')],
             peso_unidad_g=[pmg[0] / 1000, pmg[1] / 1000], venta=('bulto', 50),
             variables=[v('humedad_grano_pct', 'Humedad del grano', '%', paso=0.5)],
             muestreo=[v('espigas_m2', 'Espigas por m²', 'n/m²', paso=1), v('granos_espiga', 'Granos / espiga', 'n', paso=1),
                       v('pmg_g', 'Peso de mil granos', 'g', paso=0.5), v('acame_pct', 'Acame', '%', paso=1)],
             produccion=dict(base='m2', factores=['espigas_m2', 'granos_espiga', 'pmg_g'], divisor=1000000),
             etapas=ETAPAS_CEREAL,
             sano=[('Lote', 'Color y altura parejos; sin manchones amarillos.'), ('Tallos', 'Firmes, sin acame (volcamiento).'),
                   ('Espiga', 'Llena, granos formados en toda su longitud.')],
             riesgos=['Roya', 'Acame', 'Heladas en floración', 'Lluvia en madurez'],
             avaluo=AV_TRANSITORIO + ['Use marco de 1 m² (o 0,25 m² × 4) por punto: cuente espigas dentro del marco.'],
             pmg_g=pmg)
    if extra: d.update(extra)
    return d
C.append(cereal('cebada', 'Cebada', 'Hordeum vulgare', 'Cebada', [0.6, 1.1], [35, 50]))
C.append(cereal('trigo', 'Trigo', 'Triticum aestivum', 'Trigo', [0.7, 1.2], [30, 45]))
C.append(cereal('avena', 'Avena', 'Avena sativa', 'Avena', [0.8, 1.5], [25, 40],
                dict(organo='Grano o forraje', riesgos=['Roya', 'Acame'],
                     avaluo=AV_TRANSITORIO + ['Defina si se valora como grano o como forraje: cambia la unidad de producción.'])))
C.append(dict(
    id='quinua', nombre='Quinua', cientifico='Chenopodium quinoa', familia='Amaranthaceae',
    grupo='Cereales', eva='Quinua', ciclo='transitorio', habito='Herbáceo erecto con panoja',
    diagrama='cereal', organo='Grano', unidad='planta', color='#C9A06A',
    altura_m=[1.0, 2.0], surcos_m=[0.6, 0.8], plantas_m=[0.1, 0.2], disposicion='surco',
    densidad_ha=[60000, 160000], altitud_msnm=[2500, 3300], temp_c=[8, 16],
    inicio_prod_meses=[5, 7], ciclo_meses=[5, 7],
    fases=[('Emergencia', 0, 0.5, 'm'), ('Ramificación', 0.5, 2, 'm'), ('Panojamiento', 2, 3.5, 'm'), ('Floración y llenado', 3, 5, 'm'), ('Madurez', 4.5, 7, 'm')],
    peso_unidad_g=[0.002, 0.004], venta=('kg', 1),
    variables=[],
    muestreo=[v('peso_panoja_g', 'Peso de grano por planta', 'g', paso=0.5), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['peso_panoja_g'], divisor=1000),
    etapas=[('vegetativo', 'Vegetativo'), ('panojamiento', 'Panojamiento'), ('floracion', 'Floración'), ('llenado', 'Llenado'),
            ('madurez', 'Madurez'), ('descarte', 'Afectada')],
    sano=[('Panoja', 'Compacta y llena.'), ('Planta', 'Erecta, sin mildeo en el envés de la hoja.')],
    riesgos=['Mildeo velloso', 'Aves', 'Lluvia en madurez'],
    avaluo=AV_TRANSITORIO,
))
C.append(dict(
    id='maiz', nombre='Maíz', cientifico='Zea mays', familia='Poaceae', grupo='Cereales', eva='Maíz',
    ciclo='transitorio', habito='Herbáceo erecto', diagrama='maiz', organo='Mazorca / grano', unidad='planta',
    color='#E2C14E', altura_m=[1.5, 3.0], surcos_m=[0.8, 1.0], plantas_m=[0.2, 0.4], disposicion='surco',
    densidad_ha=[30000, 62500], altitud_msnm=[0, 2800], temp_c=[12, 30],
    inicio_prod_meses=[4, 8], ciclo_meses=[4, 9],
    fases=[('Emergencia', 0, 0.5, 'm'), ('Vegetativo', 0.5, 3, 'm'), ('Floración (espiga y jilote)', 2.5, 4, 'm'),
           ('Choclo', 3.5, 5.5, 'm'), ('Madurez fisiológica', 5, 9, 'm')],
    peso_unidad_g=[150, 350], venta=('bulto', 50),
    variables=[v('destino_maiz', 'Destino', '', 'op', opciones=['Choclo (mazorca verde)', 'Grano seco', 'Forraje / ensilaje'])],
    muestreo=[v('mazorcas', 'Mazorcas / planta', 'n', paso=0.1), v('peso_mazorca_g', 'Peso medio mazorca', 'g', paso=1),
              v('comercial_pct', 'Comercial', '%', paso=1), v('acame_pct', 'Volcamiento', '%', paso=1)],
    produccion=dict(base='planta', factores=['mazorcas', 'peso_mazorca_g'], divisor=1000),
    etapas=[('vegetativo', 'Vegetativo'), ('floracion', 'Floración'), ('choclo', 'Choclo'), ('llenado', 'Llenado de grano'),
            ('madurez', 'Madurez'), ('acame', 'Volcamiento / daño')],
    sano=[('Plantas', 'Altura pareja, tallo firme.'), ('Mazorca', 'Bien cubierta por el capacho, grano lleno hasta la punta.')],
    riesgos=['Gusano cogollero', 'Volcamiento', 'Mancha de asfalto'],
    avaluo=AV_TRANSITORIO + ['Diga si el peso es de mazorca verde (choclo) o de grano seco: cambia todo.'],
))

# ================= INDUSTRIALES Y TROPICALES TRADICIONALES =================
C.append(dict(
    id='cana_panelera', nombre='Caña panelera', cientifico='Saccharum officinarum', familia='Poaceae',
    grupo='Cultivos tropicales tradicionales', eva='Caña', eva_producto='Verifique si EVA reporta caña o panela en ese municipio.',
    ciclo='semipermanente', habito='Macolla de tallos', diagrama='cana', organo='Tallo', unidad='cepa', color='#7E9C4A',
    altura_m=[2.0, 4.0], surcos_m=[1.2, 1.5], plantas_m=[0.5, 1.0], disposicion='surco',
    densidad_ha=[7000, 16000], altitud_msnm=[700, 2000], temp_c=[18, 28],
    inicio_prod_meses=[12, 18], vida_util_anios=[5, 15],
    fases=[('Plantilla (primer corte)', 0, 1.5, 'a'), ('Socas', 1.5, 10, 'a'), ('Renovación', 8, 15, 'a')],
    peso_unidad_g=[1000, 2500], venta=('t de caña', 1000),
    variables=[v('numero_soca', 'Número de soca', 'n', paso=1), v('meses_desde_corte', 'Meses desde el último corte', 'meses', paso=1),
               v('corte', 'Sistema de corte', '', 'op', opciones=['Parejo', 'Entresaque'])],
    muestreo=[v('tallos_cepa', 'Tallos molibles / cepa', 'n', paso=1), v('peso_tallo_g', 'Peso medio tallo', 'g', paso=10),
              v('altura_m', 'Altura del tallo', 'm', paso=0.05), v('diametro_cm', 'Diámetro', 'cm', paso=0.1)],
    produccion=dict(base='cepa', factores=['tallos_cepa', 'peso_tallo_g'], divisor=1000),
    etapas=[('macollamiento', 'Macollamiento'), ('elongacion', 'Elongación'), ('madurez', 'Madurez'), ('sobremadura', 'Sobremadura'),
            ('cortado', 'Recién cortado'), ('descarte', 'Volcada / afectada')],
    sano=[('Cepa', 'Con muchos tallos, sin fallas largas en el surco.'), ('Tallos', 'Rectos, sin perforaciones (diatraea) ni rajaduras.')],
    riesgos=['Barrenador (Diatraea)', 'Carbón', 'Volcamiento'],
    avaluo=['La plantilla y cada soca rinden distinto: registre el número de soca.',
            'En entresaque se cosecha tallo maduro de forma continua: estime por cosecha anual.'],
))
C.append(dict(
    id='cafe', nombre='Café', cientifico='Coffea arabica', familia='Rubiaceae',
    grupo='Cultivos tropicales tradicionales', eva='Café', eva_producto='EVA reporta café pergamino seco (CPS).',
    ciclo='permanente', habito='Arbustivo', diagrama='arbusto', organo='Cereza (fruto)', unidad='árbol', color='#B3262E',
    altura_m=[1.8, 3.0], surcos_m=[1.3, 2.0], plantas_m=[1.0, 1.5], disposicion='cuadro',
    densidad_ha=[4000, 10000], altitud_msnm=[1200, 2000], temp_c=[17, 23],
    inicio_prod_meses=[18, 24], vida_util_anios=[6, 20],
    fases=[('Levante', 0, 1.5, 'a'), ('Producción creciente', 1.5, 3, 'a'), ('Plena producción', 3, 6, 'a'),
           ('Declinación / zoca', 6, 9, 'a')],
    peso_unidad_g=[1.5, 2.2], venta=('arroba CPS', 12.5),
    variables=[v('variedad_cafe', 'Variedad', '', 'op', opciones=['Castillo', 'Cenicafé 1', 'Colombia', 'Caturra', 'Típica', 'Tabi', 'Otra']),
               v('sombrio', 'Sombrío', '', 'op', opciones=['Libre exposición', 'Semisombra', 'Sombra']),
               v('zoqueado', 'Última renovación', '', 'op', opciones=['Siembra nueva', 'Zoca', 'Sin renovar'])],
    muestreo=[v('ramas_productivas', 'Ramas productivas / árbol', 'n', paso=1), v('frutos_rama', 'Frutos / rama', 'n', paso=1),
              v('peso_fruto_g', 'Peso medio de la cereza', 'g', paso=0.1), v('dano_pct', 'Frutos brocados', '%', paso=0.5)],
    produccion=dict(base='árbol', factores=['ramas_productivas', 'frutos_rama', 'peso_fruto_g'], divisor=1000,
                    nota='Resultado en kg de café cereza. Para pergamino seco, el factor usual es ~5 kg cereza : 1 kg CPS (verificar).'),
    etapas=[('floracion', 'Floración'), ('fruto_verde', 'Fruto verde'), ('llenado', 'Llenado'), ('pinton', 'Pintón'),
            ('maduro', 'Maduro (cereza)'), ('descarte', 'Brocado / seco')],
    sano=[('Árbol', 'Bandolas (ramas) completas desde abajo, sin paloteo.'), ('Hojas', 'Verde oscuro brillante, sin polvillo naranja (roya) en el envés.'),
          ('Fruto', 'Sin perforación en la corona (broca).'), ('Lote', 'Edades parejas por lote.')],
    riesgos=['Roya', 'Broca', 'Mancha de hierro', 'Llaga macana'],
    avaluo=AV_PERMANENTE + ['Distinga café cereza de pergamino seco al hablar de producción y precio.'],
))
C.append(dict(
    id='cacao', nombre='Cacao', cientifico='Theobroma cacao', familia='Malvaceae',
    grupo='Cultivos tropicales tradicionales', eva='Cacao', eva_producto='EVA reporta grano seco.',
    ciclo='permanente', habito='Arbóreo bajo sombra', diagrama='cacao', organo='Mazorca / grano', unidad='árbol', color='#C4772F',
    altura_m=[3.0, 6.0], surcos_m=[3.0, 4.0], plantas_m=[3.0, 4.0], disposicion='cuadro',
    densidad_ha=[625, 1100], altitud_msnm=[0, 1200], temp_c=[22, 30],
    inicio_prod_meses=[24, 36], vida_util_anios=[20, 40],
    fases=[('Levante', 0, 2.5, 'a'), ('Producción creciente', 2.5, 6, 'a'), ('Plena producción', 6, 25, 'a'), ('Declinación', 25, 40, 'a')],
    peso_unidad_g=[400, 900], venta=('kg grano seco', 1),
    variables=[v('clon', 'Clon / material', '', 'txt'), v('sombra_pct', 'Sombra', '%', paso=5)],
    muestreo=[v('mazorcas', 'Mazorcas sanas / árbol', 'n', paso=1), v('peso_grano_mazorca_g', 'Grano seco por mazorca', 'g', paso=1),
              v('enfermas_pct', 'Mazorcas enfermas', '%', paso=1)],
    produccion=dict(base='árbol', factores=['mazorcas', 'peso_grano_mazorca_g'], divisor=1000,
                    nota='Grano seco por mazorca: típicamente 30–50 g (verificar con el productor).'),
    etapas=[('floracion', 'Floración'), ('cherelle', 'Cherelle (fruto pequeño)'), ('llenado', 'Llenado'), ('maduracion', 'Maduración'),
            ('cosechable', 'Cosechable'), ('descarte', 'Monilia / escoba')],
    sano=[('Copa', 'Abierta, podada, luz al tronco.'), ('Mazorcas', 'En tronco y ramas, sin manchas ni polvo blanco.'), ('Sombrío', 'Regulado, sin cerrar el lote.')],
    riesgos=['Monilia', 'Escoba de bruja', 'Mazorca negra'],
    avaluo=AV_PERMANENTE,
))

# ============================= MUSÁCEAS =============================
C.append(dict(
    id='platano', nombre='Plátano', cientifico='Musa AAB', familia='Musaceae', grupo='Frutales', eva='Plátano',
    ciclo='permanente', habito='Herbáceo gigante (cepa)', diagrama='musacea', organo='Racimo', unidad='planta', color='#9EB44A',
    altura_m=[2.5, 5.0], surcos_m=[2.5, 3.5], plantas_m=[2.0, 3.0], disposicion='cuadro',
    densidad_ha=[1100, 2000], altitud_msnm=[0, 2000], temp_c=[18, 30],
    inicio_prod_meses=[10, 14], vida_util_anios=[4, 10],
    fases=[('Establecimiento', 0, 4, 'm'), ('Crecimiento', 4, 9, 'm'), ('Floración (bellota)', 8, 11, 'm'), ('Llenado del racimo', 9, 14, 'm'),
           ('Ciclos de hijos', 12, 96, 'm')],
    peso_unidad_g=[10000, 25000], venta=('racimo', 15),
    variables=[v('clon_platano', 'Clon', '', 'op', opciones=['Dominico hartón', 'Hartón', 'Dominico', 'Africa', 'Otro']),
               v('ciclo_productivo', 'Ciclo (madre, hijo, nieto…)', 'n', paso=1)],
    muestreo=[v('racimos', 'Racimos por cepa (pendientes)', 'n', paso=1), v('peso_racimo_kg', 'Peso del racimo', 'kg', paso=0.5),
              v('manos', 'Manos / racimo', 'n', paso=1), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['racimos', 'peso_racimo_kg'], divisor=1),
    etapas=[('vegetativo', 'Vegetativo'), ('bellota', 'Bellota / floración'), ('llenado', 'Llenado'), ('corte', 'Para corte'),
            ('cortado', 'Recién cortado'), ('descarte', 'Volcado / enfermo')],
    sano=[('Hojas', 'Al menos 8–10 hojas funcionales al florecer, sin rayas negras extendidas.'),
          ('Pseudotallo', 'Firme, sin rajaduras ni pudrición.'), ('Cepa', 'Con hijo de sucesión bien ubicado.')],
    riesgos=['Sigatoka negra', 'Moko (vigilancia ICA)', 'Picudo', 'Volcamiento'],
    avaluo=AV_PERMANENTE + ['Cuente por cepa (unidad productiva), no por pseudotallo.'],
))
C.append(dict(
    id='banano', nombre='Banano / guineo', cientifico='Musa AAA', familia='Musaceae', grupo='Frutales', eva='Banano',
    ciclo='permanente', habito='Herbáceo gigante (cepa)', diagrama='musacea', organo='Racimo', unidad='planta', color='#E1C947',
    altura_m=[2.5, 5.0], surcos_m=[2.5, 3.0], plantas_m=[2.0, 3.0], disposicion='cuadro',
    densidad_ha=[1200, 2000], altitud_msnm=[0, 1800], temp_c=[18, 30],
    inicio_prod_meses=[9, 13], vida_util_anios=[4, 10],
    fases=[('Establecimiento', 0, 4, 'm'), ('Crecimiento', 4, 8, 'm'), ('Floración', 7, 10, 'm'), ('Llenado', 8, 13, 'm'), ('Ciclos de hijos', 12, 96, 'm')],
    peso_unidad_g=[8000, 25000], venta=('racimo', 15),
    variables=[],
    muestreo=[v('racimos', 'Racimos por cepa (pendientes)', 'n', paso=1), v('peso_racimo_kg', 'Peso del racimo', 'kg', paso=0.5),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['racimos', 'peso_racimo_kg'], divisor=1),
    etapas=[('vegetativo', 'Vegetativo'), ('bellota', 'Floración'), ('llenado', 'Llenado'), ('corte', 'Para corte'),
            ('cortado', 'Cortado'), ('descarte', 'Afectado')],
    sano=[('Hojas', 'Funcionales, sin necrosis extendida.'), ('Pseudotallo', 'Firme.')],
    riesgos=['Sigatoka', 'Moko', 'Picudo'],
    avaluo=AV_PERMANENTE,
))

# ============================== FRUTALES ==============================
def frutal(**k):
    base = dict(ciclo='permanente', unidad='árbol', disposicion='cuadro', variables=[],
                muestreo=V_FRUTOS_PESO, etapas=ETAPAS_FRUTAL, sano=SANO_ARBOL, avaluo=AV_PERMANENTE,
                produccion=dict(base='árbol', factores=['frutos', 'peso_fruto_g'], divisor=1000),
                venta=('kg', 1))
    base.update(k)
    return base

C.append(frutal(
    id='tomate_arbol', nombre='Tomate de árbol', cientifico='Solanum betaceum', familia='Solanaceae', grupo='Frutales',
    eva='Tomate de árbol', habito='Arbustivo-arbóreo', diagrama='arbol', organo='Fruto', color='#C2412F',
    altura_m=[2.0, 3.5], surcos_m=[2.5, 3.0], plantas_m=[2.0, 2.5], densidad_ha=[1300, 2000],
    altitud_msnm=[1600, 2800], temp_c=[14, 20], inicio_prod_meses=[10, 14], vida_util_anios=[3, 6],
    fases=[('Levante', 0, 1, 'a'), ('Producción creciente', 1, 1.8, 'a'), ('Plena producción', 1.8, 4, 'a'), ('Declinación', 4, 6, 'a')],
    peso_unidad_g=[60, 130], venta=('canastilla', 25),
    variables=[v('injertado', 'Injertado', '', 'op', opciones=['Sí', 'No', 'No se sabe'])],
    riesgos=['Antracnosis', 'Virosis', 'Nematodos', 'Gusano del fruto'],
    avaluo=AV_PERMANENTE + ['Vida corta (3–6 años): la edad pesa mucho en el valor remanente.'],
))
C.append(frutal(
    id='mora', nombre='Mora de Castilla', cientifico='Rubus glaucus', familia='Rosaceae', grupo='Frutales',
    eva='Mora', habito='Arbustivo en espaldera', diagrama='espaldera', organo='Fruto (agregado)', unidad='planta', color='#5B1F3A',
    altura_m=[1.5, 2.5], surcos_m=[2.5, 3.0], plantas_m=[1.5, 2.5], disposicion='surco', densidad_ha=[1300, 2700],
    altitud_msnm=[1800, 2800], temp_c=[12, 19], inicio_prod_meses=[8, 12], vida_util_anios=[6, 12],
    fases=[('Establecimiento', 0, 0.7, 'a'), ('Primera producción', 0.7, 1.5, 'a'), ('Plena producción', 1.5, 8, 'a'), ('Renovación', 8, 12, 'a')],
    peso_unidad_g=[4, 9], venta=('kg', 1),
    variables=[v('sin_espinas', 'Material', '', 'op', opciones=['Con espinas', 'Sin espinas', 'Mixto'])],
    muestreo=[v('ramas_productivas', 'Ramas productivas / planta', 'n', paso=1), v('frutos_rama', 'Frutos / rama (todas las etapas)', 'n', paso=1),
              v('peso_fruto_g', 'Peso medio fruto', 'g', paso=0.1), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['ramas_productivas', 'frutos_rama', 'peso_fruto_g'], divisor=1000,
                    nota='La mora produce todo el año: el cálculo da la carga presente, no la producción anual.'),
    sano=[('Espaldera', 'Alambres tensos, ramas amarradas.'), ('Ramas', 'Renovadas: sin ramas viejas secas acumuladas.'),
          ('Fruto', 'Sin moho gris ni frutos momificados.')],
    riesgos=['Antracnosis', 'Moho gris (Botrytis)', 'Mildeo'],
))
C.append(frutal(
    id='uchuva', nombre='Uchuva', cientifico='Physalis peruviana', familia='Solanaceae', grupo='Frutales', eva='Uchuva',
    habito='Arbustivo tutorado', diagrama='espaldera', organo='Baya con capacho', unidad='planta', color='#E59A2A',
    altura_m=[1.0, 2.0], surcos_m=[2.0, 3.0], plantas_m=[1.5, 2.5], disposicion='surco', densidad_ha=[1300, 3300],
    altitud_msnm=[1800, 2800], temp_c=[13, 18], inicio_prod_meses=[5, 8], vida_util_anios=[1.5, 3],
    fases=[('Establecimiento', 0, 0.5, 'a'), ('Producción', 0.5, 2, 'a'), ('Declinación', 1.8, 3, 'a')],
    peso_unidad_g=[4, 10],
    muestreo=[v('ramas_productivas', 'Ramas productivas / planta', 'n', paso=1), v('frutos_rama', 'Frutos / rama', 'n', paso=1),
              v('peso_fruto_g', 'Peso medio fruto (sin capacho)', 'g', paso=0.1), v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['ramas_productivas', 'frutos_rama', 'peso_fruto_g'], divisor=1000),
    riesgos=['Fusarium (marchitez)', 'Rajado del fruto', 'Phoma'],
))
C.append(frutal(
    id='lulo', nombre='Lulo', cientifico='Solanum quitoense', familia='Solanaceae', grupo='Frutales', eva='Lulo',
    habito='Arbustivo', diagrama='arbusto', organo='Fruto', unidad='planta', color='#E69A2E',
    altura_m=[1.5, 2.5], surcos_m=[2.0, 3.0], plantas_m=[2.0, 2.5], densidad_ha=[1300, 2500],
    altitud_msnm=[1500, 2500], temp_c=[16, 22], inicio_prod_meses=[8, 12], vida_util_anios=[2, 4],
    fases=[('Levante', 0, 0.8, 'a'), ('Producción', 0.8, 3, 'a'), ('Declinación', 2.5, 4, 'a')],
    peso_unidad_g=[60, 150],
    riesgos=['Pasador del fruto', 'Antracnosis', 'Nematodos'],
))
C.append(frutal(
    id='fresa', nombre='Fresa', cientifico='Fragaria × ananassa', familia='Rosaceae', grupo='Frutales', eva='Fresa',
    habito='Roseta rastrera', diagrama='fresa', organo='Fruto', unidad='planta', color='#D4313D',
    altura_m=[0.15, 0.3], surcos_m=[0.3, 0.4], plantas_m=[0.25, 0.35], disposicion='cama', densidad_ha=[50000, 80000],
    altitud_msnm=[1800, 2800], temp_c=[12, 18], inicio_prod_meses=[3, 4], vida_util_anios=[1, 2],
    fases=[('Establecimiento', 0, 3, 'm'), ('Producción', 3, 18, 'm'), ('Renovación', 15, 24, 'm')],
    peso_unidad_g=[10, 25],
    variables=[v('cobertura', 'Cama con plástico', '', 'op', opciones=['Sí', 'No'])],
    muestreo=[v('frutos', 'Frutos / planta (pendientes)', 'n', paso=1), v('peso_fruto_g', 'Peso medio fruto', 'g', paso=0.5),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['frutos', 'peso_fruto_g'], divisor=1000),
    etapas=[('floracion', 'Floración'), ('fruto_verde', 'Fruto verde'), ('blanco', 'Blanco / pintón'), ('maduro', 'Maduro'),
            ('cosechable', 'Cosechable'), ('descarte', 'Afectado')],
    sano=[('Corona', 'Compacta, hojas nuevas saliendo del centro.'), ('Fruto', 'Sin moho gris; separado del suelo por el plástico.')],
    riesgos=['Moho gris (Botrytis)', 'Ácaros', 'Antracnosis'],
))
C.append(frutal(
    id='pitahaya', nombre='Pitahaya amarilla', cientifico='Selenicereus megalanthus', familia='Cactaceae', grupo='Frutales', eva='Pitahaya',
    habito='Cactácea trepadora', diagrama='cactus', organo='Fruto', unidad='planta', color='#E5C13A',
    altura_m=[1.5, 2.5], surcos_m=[3.0, 4.0], plantas_m=[2.5, 3.0], densidad_ha=[800, 1300],
    altitud_msnm=[1200, 2000], temp_c=[16, 24], inicio_prod_meses=[18, 30], vida_util_anios=[10, 20],
    fases=[('Levante', 0, 2, 'a'), ('Producción creciente', 2, 4, 'a'), ('Plena producción', 4, 15, 'a')],
    peso_unidad_g=[200, 400],
    variables=[v('tutor', 'Tutor', '', 'op', opciones=['Poste en T', 'Espaldera', 'Árbol vivo', 'Otro'])],
    riesgos=['Pudrición del cladodio', 'Mosca del botón floral'],
))
C.append(frutal(
    id='pera', nombre='Pera', cientifico='Pyrus communis', familia='Rosaceae', grupo='Frutales caducifolios', eva='Pera',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#B8B24A',
    altura_m=[3.0, 5.0], surcos_m=[4.0, 5.0], plantas_m=[3.0, 4.0], densidad_ha=[500, 830],
    altitud_msnm=[2200, 2900], temp_c=[12, 16], inicio_prod_meses=[36, 60], vida_util_anios=[25, 40],
    fases=[('Levante', 0, 4, 'a'), ('Producción creciente', 4, 8, 'a'), ('Plena producción', 8, 30, 'a'), ('Declinación', 30, 40, 'a')],
    peso_unidad_g=[120, 250], etapas=ETAPAS_CADUCIFOLIO,
    variables=[v('patron', 'Patrón / portainjerto', '', 'txt'), v('cosecha_epoca', 'Cosechas al año', 'n', paso=1)],
    riesgos=['Roña', 'Fuego bacteriano (vigilancia ICA)', 'Mosca de la fruta'],
))
C.append(frutal(
    id='manzana', nombre='Manzana', cientifico='Malus domestica', familia='Rosaceae', grupo='Frutales caducifolios', eva='Manzana',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#C9343A',
    altura_m=[2.5, 4.5], surcos_m=[3.5, 5.0], plantas_m=[2.5, 4.0], densidad_ha=[500, 1100],
    altitud_msnm=[2200, 2900], temp_c=[12, 16], inicio_prod_meses=[30, 48], vida_util_anios=[20, 35],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 7, 'a'), ('Plena producción', 7, 25, 'a'), ('Declinación', 25, 35, 'a')],
    peso_unidad_g=[100, 220], etapas=ETAPAS_CADUCIFOLIO,
    variables=[v('patron', 'Patrón / portainjerto', '', 'txt'), v('variedad_manzana', 'Variedad', '', 'op', opciones=['Anna', 'Gala', 'Royal', 'Otra'])],
    riesgos=['Roña', 'Oídio', 'Mosca de la fruta'],
))
C.append(frutal(
    id='durazno', nombre='Durazno', cientifico='Prunus persica', familia='Rosaceae', grupo='Frutales caducifolios', eva='Durazno o albaricoque',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#E58B4E',
    altura_m=[2.5, 4.0], surcos_m=[4.0, 5.0], plantas_m=[3.0, 4.0], densidad_ha=[500, 830],
    altitud_msnm=[1800, 2800], temp_c=[13, 19], inicio_prod_meses=[24, 36], vida_util_anios=[12, 20],
    fases=[('Levante', 0, 2.5, 'a'), ('Producción creciente', 2.5, 5, 'a'), ('Plena producción', 5, 15, 'a'), ('Declinación', 15, 20, 'a')],
    peso_unidad_g=[80, 180], etapas=ETAPAS_CADUCIFOLIO,
    variables=[v('patron', 'Patrón / portainjerto', '', 'txt'), v('variedad_durazno', 'Variedad', '', 'op', opciones=['Gran Jarillo', 'Rubidoux', 'Dorado', 'Otra'])],
    riesgos=['Mosca de la fruta', 'Torque (enrollamiento)', 'Roya', 'Monilia'],
))
C.append(frutal(
    id='ciruela', nombre='Ciruela', cientifico='Prunus domestica / P. salicina', familia='Rosaceae', grupo='Frutales caducifolios', eva='Ciruela',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#7A2F5B',
    altura_m=[2.5, 4.5], surcos_m=[4.0, 5.0], plantas_m=[3.0, 4.0], densidad_ha=[500, 830],
    altitud_msnm=[1800, 2800], temp_c=[13, 19], inicio_prod_meses=[24, 42], vida_util_anios=[15, 25],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 6, 'a'), ('Plena producción', 6, 20, 'a'), ('Declinación', 20, 25, 'a')],
    peso_unidad_g=[30, 80], etapas=ETAPAS_CADUCIFOLIO,
    variables=[v('patron', 'Patrón / portainjerto', '', 'txt')],
    riesgos=['Mosca de la fruta', 'Roya', 'Gomosis'],
))
C.append(frutal(
    id='feijoa', nombre='Feijoa', cientifico='Acca sellowiana', familia='Myrtaceae', grupo='Frutales', eva='Feijoa',
    habito='Arbustivo-arbóreo', diagrama='arbusto', organo='Fruto', color='#6F9442',
    altura_m=[2.0, 4.0], surcos_m=[3.0, 4.0], plantas_m=[2.5, 3.5], densidad_ha=[700, 1300],
    altitud_msnm=[1800, 2700], temp_c=[13, 18], inicio_prod_meses=[30, 48], vida_util_anios=[20, 30],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 6, 'a'), ('Plena producción', 6, 25, 'a')],
    peso_unidad_g=[30, 90],
    riesgos=['Mosca de la fruta', 'Antracnosis'],
))
C.append(frutal(
    id='aguacate', nombre='Aguacate', cientifico='Persea americana', familia='Lauraceae', grupo='Frutales', eva='Aguacate',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#3F6B2D',
    altura_m=[4.0, 10.0], surcos_m=[6.0, 8.0], plantas_m=[5.0, 8.0], disposicion='tresbolillo', densidad_ha=[156, 330],
    altitud_msnm=[800, 2500], temp_c=[14, 26], inicio_prod_meses=[30, 48], vida_util_anios=[25, 40],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 7, 'a'), ('Plena producción', 7, 30, 'a'), ('Declinación', 30, 40, 'a')],
    peso_unidad_g=[180, 600],
    variables=[v('variedad_aguacate', 'Variedad', '', 'op', opciones=['Hass', 'Lorena', 'Choquette', 'Criollo', 'Otra']),
               v('patron', 'Patrón', '', 'txt'), v('registro_ica', 'Predio registrado ICA (exportación)', '', 'op', opciones=['Sí', 'No', 'No se sabe'])],
    riesgos=['Phytophthora (pudrición de raíz)', 'Marceño / trips', 'Barrenadores (vigilancia ICA)'],
))
C.append(frutal(
    id='naranja', nombre='Naranja', cientifico='Citrus sinensis', familia='Rutaceae', grupo='Cítricos', eva='Naranja',
    habito='Arbóreo', diagrama='citrico', organo='Fruto', color='#E8922A',
    altura_m=[3.0, 6.0], surcos_m=[5.0, 7.0], plantas_m=[4.0, 6.0], disposicion='tresbolillo', densidad_ha=[240, 500],
    altitud_msnm=[0, 1800], temp_c=[18, 30], inicio_prod_meses=[30, 48], vida_util_anios=[20, 30],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 7, 'a'), ('Plena producción', 7, 20, 'a'), ('Declinación', 20, 30, 'a')],
    peso_unidad_g=[150, 280], variables=[v('patron', 'Patrón', '', 'txt')],
    riesgos=['HLB / Diaphorina (vigilancia ICA)', 'Gomosis', 'Mosca de la fruta'],
    avaluo=AV_PERMANENTE + ['Cítricos: anote cualquier síntoma compatible con HLB (moteado asimétrico, frutos deformes); es de reporte al ICA.'],
))
C.append(frutal(
    id='mandarina', nombre='Mandarina', cientifico='Citrus reticulata', familia='Rutaceae', grupo='Cítricos', eva='Mandarina',
    habito='Arbóreo', diagrama='citrico', organo='Fruto', color='#EE8A1F',
    altura_m=[2.5, 5.0], surcos_m=[5.0, 6.0], plantas_m=[4.0, 5.0], disposicion='tresbolillo', densidad_ha=[330, 500],
    altitud_msnm=[0, 1800], temp_c=[18, 30], inicio_prod_meses=[30, 42], vida_util_anios=[20, 30],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 6, 'a'), ('Plena producción', 6, 20, 'a'), ('Declinación', 20, 30, 'a')],
    peso_unidad_g=[80, 160], variables=[v('patron', 'Patrón', '', 'txt')],
    riesgos=['HLB / Diaphorina (vigilancia ICA)', 'Gomosis', 'Mosca de la fruta'],
    avaluo=AV_PERMANENTE + ['Cítricos: anote cualquier síntoma compatible con HLB; es de reporte al ICA.'],
))
C.append(frutal(
    id='limon', nombre='Limón', cientifico='Citrus × latifolia / C. limon', familia='Rutaceae', grupo='Cítricos', eva='Limón',
    habito='Arbóreo', diagrama='citrico', organo='Fruto', color='#9DBB3A',
    altura_m=[3.0, 5.0], surcos_m=[5.0, 6.0], plantas_m=[4.0, 5.0], disposicion='tresbolillo', densidad_ha=[330, 500],
    altitud_msnm=[0, 1800], temp_c=[18, 30], inicio_prod_meses=[24, 36], vida_util_anios=[15, 25],
    fases=[('Levante', 0, 2.5, 'a'), ('Producción creciente', 2.5, 5, 'a'), ('Plena producción', 5, 18, 'a'), ('Declinación', 18, 25, 'a')],
    peso_unidad_g=[50, 120],
    variables=[v('tipo_limon', 'Tipo', '', 'op', opciones=['Tahití', 'Común (pajarito)', 'Mandarino', 'Otro']), v('patron', 'Patrón', '', 'txt')],
    riesgos=['HLB / Diaphorina (vigilancia ICA)', 'Gomosis', 'Ácaros'],
    avaluo=AV_PERMANENTE + ['Cítricos: anote cualquier síntoma compatible con HLB; es de reporte al ICA.'],
))
C.append(frutal(
    id='guayaba', nombre='Guayaba', cientifico='Psidium guajava', familia='Myrtaceae', grupo='Frutales', eva='Guayaba',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#B9C85A',
    altura_m=[3.0, 6.0], surcos_m=[5.0, 6.0], plantas_m=[4.0, 5.0], densidad_ha=[330, 500],
    altitud_msnm=[0, 2000], temp_c=[18, 30], inicio_prod_meses=[24, 36], vida_util_anios=[15, 30],
    fases=[('Levante', 0, 2.5, 'a'), ('Producción creciente', 2.5, 5, 'a'), ('Plena producción', 5, 25, 'a')],
    peso_unidad_g=[60, 200],
    riesgos=['Picudo de la guayaba', 'Antracnosis', 'Mosca de la fruta'],
))
C.append(frutal(
    id='guanabana', nombre='Guanábana', cientifico='Annona muricata', familia='Annonaceae', grupo='Frutales', eva='Guanábana',
    habito='Arbóreo', diagrama='arbol', organo='Fruto', color='#5E8A3B',
    altura_m=[3.0, 6.0], surcos_m=[5.0, 6.0], plantas_m=[4.0, 5.0], densidad_ha=[330, 500],
    altitud_msnm=[0, 1500], temp_c=[22, 30], inicio_prod_meses=[30, 42], vida_util_anios=[15, 25],
    fases=[('Levante', 0, 3, 'a'), ('Producción creciente', 3, 6, 'a'), ('Plena producción', 6, 20, 'a')],
    peso_unidad_g=[1000, 3500],
    riesgos=['Perforador del fruto', 'Antracnosis'],
))
C.append(frutal(
    id='arandano', nombre='Arándano', cientifico='Vaccinium corymbosum', familia='Ericaceae', grupo='Frutales', eva='Arándano',
    habito='Arbustivo', diagrama='arbusto', organo='Baya', unidad='planta', color='#3E4C8A',
    altura_m=[1.0, 2.0], surcos_m=[2.5, 3.0], plantas_m=[0.8, 1.2], disposicion='surco', densidad_ha=[2800, 5000],
    altitud_msnm=[2000, 2800], temp_c=[12, 18], inicio_prod_meses=[12, 24], vida_util_anios=[10, 20],
    fases=[('Levante', 0, 1.5, 'a'), ('Producción creciente', 1.5, 4, 'a'), ('Plena producción', 4, 15, 'a')],
    peso_unidad_g=[1.2, 3.0],
    variables=[v('sustrato', 'Siembra', '', 'op', opciones=['Suelo', 'Matera / sustrato']), v('cubierta', 'Cubierta', '', 'op', opciones=['Campo abierto', 'Macrotúnel', 'Invernadero'])],
    muestreo=[v('frutos', 'Frutos / planta (pendientes)', 'n', paso=1), v('peso_fruto_g', 'Peso medio baya', 'g', paso=0.1),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['frutos', 'peso_fruto_g'], divisor=1000),
    riesgos=['Botrytis', 'Pudrición de raíz por pH / encharcamiento'],
))

# ---- Pasifloras (emparrado) ----
def pasiflora(**k):
    base = frutal(habito='Trepadora en emparrado', diagrama='emparrado', unidad='planta', disposicion='cuadro',
                  muestreo=[v('frutos', 'Frutos / planta (pendientes)', 'n', paso=1), v('peso_fruto_g', 'Peso medio fruto', 'g', paso=1),
                            v('comercial_pct', 'Comercial', '%', paso=1)],
                  produccion=dict(base='planta', factores=['frutos', 'peso_fruto_g'], divisor=1000),
                  sano=[('Emparrado', 'Postes firmes y alambres tensos; ramas distribuidas sin amontonarse.'),
                        ('Ramas', 'Podadas, sin ramas secas colgando.'), ('Fruto', 'Sin manchas ni arrugas prematuras.'),
                        ('Cuello', 'Sin pudrición ni marchitez de la planta entera.')],
                  avaluo=AV_PERMANENTE + ['El emparrado es infraestructura: regístrelo aparte en Infraestructura.'])
    base.update(k)
    return base
C.append(pasiflora(
    id='gulupa', nombre='Gulupa', cientifico='Passiflora edulis f. edulis', familia='Passifloraceae', grupo='Frutales', eva='Gulupa o cholupa',
    organo='Fruto', color='#5A2A4E', altura_m=[1.8, 2.2], surcos_m=[3.0, 4.0], plantas_m=[3.0, 5.0], densidad_ha=[500, 1100],
    altitud_msnm=[1600, 2400], temp_c=[15, 20], inicio_prod_meses=[8, 12], vida_util_anios=[3, 6],
    fases=[('Establecimiento', 0, 0.8, 'a'), ('Producción', 0.8, 4, 'a'), ('Declinación', 3.5, 6, 'a')],
    peso_unidad_g=[60, 110], riesgos=['Fusarium (secadera)', 'Mancha de aceite', 'Virosis']))
C.append(pasiflora(
    id='granadilla', nombre='Granadilla', cientifico='Passiflora ligularis', familia='Passifloraceae', grupo='Frutales', eva='Granadilla',
    organo='Fruto', color='#E6A33A', altura_m=[1.8, 2.2], surcos_m=[4.0, 6.0], plantas_m=[4.0, 6.0], densidad_ha=[280, 625],
    altitud_msnm=[1700, 2500], temp_c=[15, 20], inicio_prod_meses=[9, 12], vida_util_anios=[5, 10],
    fases=[('Establecimiento', 0, 0.9, 'a'), ('Producción creciente', 0.9, 2, 'a'), ('Plena producción', 2, 8, 'a')],
    peso_unidad_g=[90, 150], riesgos=['Secadera (Nectria)', 'Roña', 'Virosis']))
C.append(pasiflora(
    id='curuba', nombre='Curuba', cientifico='Passiflora tripartita var. mollissima', familia='Passifloraceae', grupo='Frutales', eva='Curuba',
    organo='Fruto', color='#E9B44C', altura_m=[1.8, 2.2], surcos_m=[3.0, 4.0], plantas_m=[3.0, 4.0], densidad_ha=[600, 1100],
    altitud_msnm=[2200, 3000], temp_c=[12, 16], inicio_prod_meses=[9, 12], vida_util_anios=[5, 8],
    fases=[('Establecimiento', 0, 0.9, 'a'), ('Producción', 0.9, 6, 'a'), ('Declinación', 5, 8, 'a')],
    peso_unidad_g=[60, 120], riesgos=['Antracnosis', 'Mosca del ovario', 'Heladas']))

# ============================ OTRO ============================
C.append(dict(
    id='otro', nombre='Otro / no catalogado', cientifico='', familia='', grupo='Otros', eva='',
    ciclo='', habito='', diagrama='generico', organo='', unidad='planta', color='#8A9A5B',
    altura_m=None, surcos_m=None, plantas_m=None, disposicion='cuadro', densidad_ha=None,
    altitud_msnm=None, temp_c=None, inicio_prod_meses=None, fases=[], peso_unidad_g=None, venta=('kg', 1),
    variables=[v('cultivo_nombre', 'Nombre del cultivo', '', 'txt')],
    muestreo=[v('unidades_producto', 'Unidades de producto / planta', 'n', paso=1), v('peso_unidad_g', 'Peso medio por unidad', 'g', paso=0.1),
              v('comercial_pct', 'Comercial', '%', paso=1)],
    produccion=dict(base='planta', factores=['unidades_producto', 'peso_unidad_g'], divisor=1000),
    etapas=[('vegetativo', 'Vegetativo'), ('floracion', 'Floración'), ('desarrollo', 'Desarrollo'), ('maduracion', 'Maduración'),
            ('cosechable', 'Cosechable'), ('descarte', 'Afectado')],
    sano=[('Uniformidad', 'Plantas parecidas entre sí.'), ('Follaje', 'Funcional, sin daño generalizado.')],
    riesgos=[], avaluo=['Registre a mano la referencia técnica y su fuente.'],
))
