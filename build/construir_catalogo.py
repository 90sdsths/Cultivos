# -*- coding: utf-8 -*-
"""Genera cultivos_catalogo.js desde catalogo_fuente.py + cultivos_detalle.csv.

Uso:  python construir_catalogo.py <ruta cultivos_detalle.csv> <salida.js>

El rendimiento de referencia sale de SU base (la misma tabla
nucleo.cultivos_detalle, exportada como cultivos_detalle.csv): mediana y
percentiles 10/90 del rendimiento municipal en Boyacá (DANE 15xxx), y la
mediana nacional como contraste. Nada se escribe a mano.
"""
import csv, json, sys, statistics, datetime
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalogo_fuente import C

def pct(vals, p):
    s = sorted(vals)
    if not s: return None
    k = (len(s) - 1) * p
    f = int(k); c = min(f + 1, len(s) - 1)
    return round(s[f] + (s[c] - s[f]) * (k - f), 2)

def main(csv_path, out_path):
    rows = list(csv.DictReader(open(csv_path, encoding='utf-8-sig')))
    avisos = []
    for c in C:
        eva = c.get('eva')
        if not eva:
            c['eva_ref'] = None; continue
        b = [float(r['rendimiento_t_ha']) for r in rows
             if r['cultivo'] == eva and r['codigo_dane'].startswith('15') and r['rendimiento_t_ha']]
        n = [float(r['rendimiento_t_ha']) for r in rows if r['cultivo'] == eva and r['rendimiento_t_ha']]
        area_b = sum(float(r['area_sembrada_ha_anio'] or 0) for r in rows
                     if r['cultivo'] == eva and r['codigo_dane'].startswith('15'))
        if not n:
            avisos.append(f'{c["id"]}: «{eva}» no está en cultivos_detalle')
        c['eva_ref'] = dict(
            boyaca=dict(p10=pct(b, .1), mediana=pct(b, .5), p90=pct(b, .9), municipios=len(b),
                        area_ha=round(area_b)) if b else None,
            nacional=dict(p10=pct(n, .1), mediana=pct(n, .5), p90=pct(n, .9), municipios=len(n)) if n else None,
            unidad='t/ha/año')
        # coherencia marco ↔ densidad
        s, p, d = c.get('surcos_m'), c.get('plantas_m'), c.get('densidad_ha')
        if s and p and d and p[0] > 0:
            dmin, dmax = 10000 / (s[1] * p[1]), 10000 / (s[0] * p[0])
            if c.get('disposicion') == 'tresbolillo':
                dmin, dmax = dmin * 1.155, dmax * 1.155
            if d[1] < dmin * 0.7 or d[0] > dmax * 1.3:
                avisos.append(f'{c["id"]}: densidad {d} lejos del marco ({dmin:.0f}–{dmax:.0f})')
        # coherencia muestreo ↔ fórmula
        ks = {x['k'] for x in c['muestreo']}
        for f in c['produccion']['factores']:
            if f not in ks: avisos.append(f'{c["id"]}: factor {f} no está en el muestreo')
    for c in C:
        c['venta'] = dict(unidad=c['venta'][0], kg=c['venta'][1])
        c['fases'] = [dict(nombre=f[0], desde=f[1], hasta=f[2], u=f[3]) for f in c.get('fases', [])]
        c['etapas'] = [dict(k=e[0], label=e[1]) for e in c['etapas']]
        c['sano'] = [dict(t=s[0], d=s[1]) for s in c['sano']]
    meta = dict(version=datetime.date.today().isoformat(), cultivos=len(C),
                fuente_rendimiento='nucleo.cultivos_detalle (EVA, Agronet/UPRA) — rendimiento municipal; Boyacá = códigos DANE 15xxx',
                advertencia='Rangos técnicos de referencia. Verificar según variedad, patrón, sistema y clima del predio.')
    js = ('/* cultivos_catalogo.js — GENERADO por build/construir_catalogo.py. No editar a mano:\n'
          '   editar build/catalogo_fuente.py y volver a generar.\n'
          '   Lo usan la PWA de campo (cultivos.html) y la plataforma (módulo Cultivos). */\n'
          '(function(g){\n'
          f'const META={json.dumps(meta, ensure_ascii=False)};\n'
          f'const CULTIVOS={json.dumps(C, ensure_ascii=False, separators=(",", ":"))};\n'
          'const POR_ID={};CULTIVOS.forEach(c=>POR_ID[c.id]=c);\n'
          'const API={META,CULTIVOS,get:id=>POR_ID[id]||POR_ID.otro,'
          'grupos:()=>[...new Set(CULTIVOS.map(c=>c.grupo))]};\n'
          'if(typeof module!=="undefined"&&module.exports)module.exports=API;else g.CultivosCatalogo=API;\n'
          '})(typeof window!=="undefined"?window:globalThis);\n')
    open(out_path, 'w', encoding='utf-8').write(js)
    print(f'{len(C)} cultivos → {out_path} ({len(js)//1024} KB)')
    for a in avisos: print('AVISO', a)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
