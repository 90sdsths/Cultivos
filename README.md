# Valoracion de Cultivos · PWA v11

Esta versión consolida la reorganización solicitada:

- El Módulo 1 es la ficha previa al avalúo y comienza con la selección del cultivo.
- La ficha presenta referencia técnica, patrón sano, arquitectura, siembra, unidad de cosecha, fenología y consideraciones para el avalúo.
- La observación del predio está separada en un módulo posterior.
- El muestreo es dinámico según cultivo.
- El cálculo físico consume directamente los datos del muestreo cuando es posible.
- La valoración económica permanece separada del cálculo físico.
- Se incorpora manifest y service worker con caché v11 para actualizar correctamente la PWA instalada.

Importante: los rangos técnicos son referencias de trabajo y deben verificarse para el cultivo, variedad/patrón, sistema y condiciones locales antes de emplearse como parámetro definitivo.


Corrección v11: se reincorpora explícitamente el contenedor de la secuencia fenológica que faltaba en el HTML, evitando el error de JavaScript que impedía renderizar los diagramas. Se añade además un cuarto diagrama visual de cultivo sano.
