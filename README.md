# Prueba de performance — API de creación de productos

Proyecto de pruebas de carga desarrollado con [k6](https://k6.io/) para evaluar el endpoint `POST https://dummyjson.com/products/add` a 50 y 100 TPS durante un minuto.

> **Author:** Neila Alejandra Arteaga Vargas

## Contenido

- [Objetivo](#objetivo)
- [Pruebas de performance recomendadas](#pruebas-de-performance-recomendadas)
- [Requisitos](#requisitos)
- [Instalación de k6](#instalación-de-k6)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Configuración de la prueba](#configuración-de-la-prueba)
- [Ejecución](#ejecución)
- [Interpretación de resultados](#interpretación-de-resultados)
- [Reporte ejecutivo](#reporte-ejecutivo)

## Objetivo

Evaluar el comportamiento del endpoint público DummyJSON al crear productos mediante solicitudes autenticadas:

- 50 TPS constantes durante 60 segundos.
- 100 TPS constantes durante 60 segundos.
- Login previo mediante autenticación JWT.
- Valor único en el campo `title` de cada request.

## Pruebas de performance recomendadas

### 1. Prueba de carga normal

Simular aproximadamente 1.500 ventas por día. La carga debe distribuirse según las horas reales de actividad; no es necesario distribuirla uniformemente durante las 24 horas si los datos históricos muestran concentraciones.

### 2. Prueba de pico estacional

Simular aproximadamente 7.500 ventas por día, equivalente a quintuplicar la carga normal. Debe reproducir concentraciones propias de eventos como Black Friday, Navidad y promociones especiales.

### 3. Prueba de estrés

Incrementar gradualmente la carga por encima del pico estacional esperado. Permite identificar el punto de degradación, la pérdida de estabilidad y los recursos que se convierten primero en cuello de botella.

### 4. Prueba de resistencia

Mantener la carga normal o de pico durante varias horas. Permite detectar fugas de memoria, crecimiento de conexiones, saturación de recursos o degradación acumulativa.

### 5. Prueba de saturación/ruptura

Aumentar progresivamente usuarios o TPS hasta que el sistema deje de cumplir los objetivos de rendimiento. Permite identificar el límite máximo observable y establecer una capacidad operativa segura por debajo del punto de ruptura. Debe ejecutarse únicamente con autorización y en un entorno preparado para pruebas.

### 6. Prueba de recuperación

Generar una carga superior a lo normal y luego volver a una carga estable. Permite verificar si el sistema recupera su rendimiento sin reinicio manual, si elimina la carga acumulada y si el autoscaling escala hacia arriba y hacia abajo correctamente.

## Instalación de k6

### macOS con Homebrew

```bash
brew install k6
```

### Linux

En Ubuntu o Debian, puede instalarse con los paquetes oficiales de k6:

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69

echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list

sudo apt-get update
sudo apt-get install k6
```

### Windows con Chocolatey

Ejecutar en PowerShell o terminal administrador:

```powershell
choco install k6
```

También puede instalarse con Winget:

```powershell
winget install k6 --source winget
```

### Verificar la instalación

```bash
k6 version
```

## Estructura del proyecto

```text
challenge_performance/
├── README.md
├── tests/
│   ├── products-add-load.js
│   └── utils/
│       └── auth.js
└── reports/
    └── Reporte-performance.html
```

### Script principal

`tests/products-add-load.js` define el escenario de carga, los umbrales y las solicitudes al endpoint de creación de productos.

### Utility de autenticación

`tests/utils/auth.js` contiene funciones reutilizables:

- `login(username, password)`: obtiene el `accessToken` mediante `POST /auth/login`.
- `bearerHeaders(token)`: genera los headers `Authorization` y `Content-Type`.

## Configuración de la prueba

Antes de iniciar la carga, k6 ejecuta automáticamente la función `setup()` una sola vez. Esta función llama al utility de autenticación y devuelve el token.

```javascript
export function setup() {
  const token = login();
  return { token };
}
```

K6 pasa el objeto resultante a cada iteración de la función principal mediante el parámetro `auth`.

### Endpoint de login

```text
POST https://dummyjson.com/auth/login
```

```json
{
  "username": "emilys",
  "password": "emilyspass"
}
```

### Endpoint bajo prueba

```text
POST https://dummyjson.com/products/add
```

Headers enviados:

```text
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Body enviado en cada solicitud:

```json
{
  "title": "valor-unico-generado-por-k6",
  "price": 1.23
}
```

El título combina VU, iteración, fecha y valor aleatorio para garantizar que cada request tenga un valor diferente.

### Escenario configurado

El escenario utiliza el ejecutor `constant-arrival-rate`:

- `rate`: tasa objetivo configurable mediante la variable de entorno `TPS`.
- `timeUnit`: `1s`, por lo que la tasa se interpreta como solicitudes por segundo.
- `duration`: `1m`, equivalente a un minuto.
- `preAllocatedVUs`: cantidad inicial preasignada de usuarios virtuales.
- `maxVUs`: máximo de usuarios virtuales disponibles para mantener la tasa objetivo.

### Umbrales definidos

Los umbrales son criterios de aceptación propuestos para el ejercicio:

```javascript
thresholds: {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<1000'],
  checks: ['rate>0.95'],
}
```

Significado:

- Menos del 5% de requests HTTP puede fallar.
- El 95% de las solicitudes debe finalizar en menos de 1 segundo.
- Más del 95% de las comprobaciones debe ser exitoso.

Estos umbrales fueron establecidos para el ejercicio y deben ser validados o ajustados con los responsables de negocio y tecnología antes de considerarlos requisitos definitivos.

## Ejecución

Abrir una terminal, ubicarse en la raíz del proyecto y ejecutar los escenarios.

```bash
cd /Users/alejandraarteaga/challenge_performance
```

### Ejecutar 50 TPS durante un minuto

```bash
k6 run -e TPS=50 \
  --summary-export reports/50-tps-auth-summary.json \
  tests/products-add-load.js
```

### Ejecutar 100 TPS durante un minuto

```bash
k6 run -e TPS=100 \
  --summary-export reports/100-tps-auth-summary.json \
  tests/products-add-load.js
```

### Guardar también la salida completa en texto

```bash
k6 run -e TPS=50 \
  --summary-export reports/50-tps-auth-summary.json \
  tests/products-add-load.js \
  2>&1 | tee reports/50-tps-auth-output.txt
```

```bash
k6 run -e TPS=100 \
  --summary-export reports/100-tps-auth-summary.json \
  tests/products-add-load.js \
  2>&1 | tee reports/100-tps-auth-output.txt
```

La ejecución produce resúmenes JSON e incluye el tiempo de ejecución, tasa real, duration P95, tasa de fallos y resultado de los checks.

## Interpretación de resultados

K6 muestra métricas como:

- `http_reqs`: cantidad y tasa de solicitudes HTTP.
- `http_req_failed`: porcentaje de solicitudes fallidas.
- `http_req_duration`: tiempo total de respuesta. Para el percentil P95, el 95% de las solicitudes respondió en ese tiempo o menos.
- `checks_succeeded`: porcentaje de validaciones exitosas.
- `iterations`: iteraciones completadas.
- `dropped_iterations`: iteraciones que no pudieron iniciarse con la tasa configurada.
- `vus`: usuarios virtuales utilizados durante la prueba.

Un código de salida distinto de cero puede indicar que algún umbral fue superado. Por ejemplo, K6 puede finalizar con el código `99` si los thresholds `checks` o `http_req_failed` no se cumplen. Esto indica que la prueba produjo resultados fuera del criterio configurado, no que el script haya tenido un error de sintaxis.

## Reporte ejecutivo

El informe diseñado para personas no técnicas se encuentra en:

```text
reports/Reporte-performance.html
```

Puede abrirse directamente desde VS Code, desde el navegador o mediante:

```bash
open reports/Reporte-performance.html
```
