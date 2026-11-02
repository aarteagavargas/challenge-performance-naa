# Prueba de performance — API de productos

## Parte 1 — Pruebas recomendadas

1. **Prueba de carga normal:** simular el promedio de 1.500 ventas por día. Conviene distribuirlas por hora según el patrón real del e-commerce, ya que la carga no es constante durante las 24 horas.
2. **Prueba de pico estacional:** simular aproximadamente 7.500 ventas por día, multiplicando por cinco la carga normal. Debe reproducir las concentraciones y los picos de horas críticas en eventos como Black Friday o Navidad.
3. **Prueba de estrés:** incrementar gradualmente la carga hasta superar el pico estacional esperado, por ejemplo entre 100% y 150%. Permite identificar el punto de degradación, la saturación y el comportamiento ante demanda anormal.
4. **Prueba de resistencia:** mantener la carga normal durante varias horas o la carga de pico durante un período prolongado. Permite detectar fugas de memoria, crecimiento de conexiones, saturación de recursos y degradación acumulativa.
5. **Prueba de saturación/ruptura:** aumentar progresivamente usuarios, ventas o requests por segundo hasta que el sistema comience a fallar o deje de cumplir los objetivos de rendimiento. Permite identificar el límite máximo y establecer una capacidad operativa segura por debajo del punto de ruptura. Debe ejecutarse en un entorno de prueba autorizado y registrar cómo aparecen los errores y cómo responde el autoscaling.
6. **Prueba de recuperación:** generar primero una carga superior a lo normal y luego volver a una carga estable. Permite verificar si el sistema recupera su rendimiento sin reinicios manuales, mantiene conexiones válidas y elimina gradualmente la carga acumulada. También puede evaluar el funcionamiento del autoscaling al reducir y volver a aumentar la demanda.

## Parte 2 — Alcance ejecutado

Endpoint: `POST https://dummyjson.com/products/add`

Se ejecutaron dos escenarios de un minuto cada uno mediante k6:
- 50 TPS constantes.
- 100 TPS constantes.

Criterios de aceptación definidos:
- Menos del 5% de requests fallidas.
- p95 menor a 1 segundo.
- Más del 95% de validaciones exitosas.

## Autenticación y datos únicos

Antes de la carga, el script k6 ejecuta `POST https://dummyjson.com/auth/login` con:

```json
{"username":"emilys","password":"emilyspass"}
```

El `accessToken` obtenido se reutiliza durante la prueba como:

```text
Authorization: Bearer <accessToken>
```

Cada request envía únicamente los campos requeridos por la API:

```json
{
  "title": "valor-unico-generado-por-k6",
  "price": 1.23
}
```

El título combina la carga objetivo, VU, iteración, tiempo y valor aleatorio. Esto garantiza un valor distinto en cada request.

## Ejecución

```bash
k6 run -e TPS=50 --summary-export reports/50-tps-auth-summary.json tests/products-add-load.js
k6 run -e TPS=100 --summary-export reports/100-tps-auth-summary.json tests/products-add-load.js
```

Cada prueba crea 50 o 100 requests por segundo durante 60 segundos, con el margen de VUs configurado automáticamente para absorber variaciones.

## Author

Neila Alejandra Arteaga Vargas
