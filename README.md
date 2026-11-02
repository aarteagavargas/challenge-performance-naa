# Prueba de performance — API de productos

## Parte 1 — Pruebas recomendadas

1. **Prueba de carga normal:** 1.500 ventas/día equivalen a aproximadamente 0.017 ventas por segundo promedio. Dado que las ventas generan varios servicios por operación, una simulación basada en el flujo completo debe calibrarse con la mezcla real de requests por pedido.
2. **Prueba de pico estacional:** Multiplicar por cinco la carga normal (≈7.500 ventas/día), considerando concentraciones horarias y picos superiores al promedio.
3. **Prueba de estrés:** Incrementar gradualmente la carga hasta 100–150% por encima del pico esperado para identificar el punto de degradación y saturación.
4. **Prueba de resistencia:** Mantener la carga normal o de pico durante varias horas para detectar fugas de memoria, crecimiento de conexiones o degradación acumulativa.
5. **Prueba de saturación/ruptura:** Aumentar la tasa hasta observar fallos, registrar capacidad máxima, tiempos de recuperación y comportamiento del autoscaling.

Para cada prueba conviene medir disponibilidad, porcentaje de errores, p95/p99 de duración, TPS sostenido, throughput, CPU, memoria, conexiones, cola de base de datos y autoscaling.

## Parte 2 — Alcance ejecutado

Endpoint: `POST https://dummyjson.com/products/add`

Se ejecutaron dos escenarios de un minuto cada uno mediante k6:
- 50 TPS constantes.
- 100 TPS constantes.

Criterios de aceptación definidos:
- Menos del 5% de requests fallidas.
- p95 menor a 1 segundo.
- Más del 95% de validaciones exitosas.

Nota: El endpoint público DummyJSON aplica protección por límite de solicitudes y puede responder 429 cuando se supera su cuota. Por ello, los resultados representan la capacidad del servicio externo observado, no la infraestructura propia de una aplicación de e-commerce.

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
k6 run -e TPS=50 --summary-export reports/50-tps-summary.json tests/products-add-load.js
k6 run -e TPS=100 --summary-export reports/100-tps-summary.json tests/products-add-load.js
```

La prueba crea 50 o 100 requests por segundo durante 60 segundos, con un margin de VUs automáticos para absorber variaciones.

## Author

Neila Alejandra Arteaga Vargas
