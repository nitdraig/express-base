# express-business-pulse

**Health & Business Pulse** para aplicaciones **Express** (y reutilizable en **Next.js** u otros runtimes vía `collectPulse`).

- JSON estable (`pulse_version: "1"`), métricas técnicas, KPIs de negocio opcionales, texto `ai_context`, infraestructura con probes enchufables.
- Protección **`Authorization: Bearer`** (comparación resistente a timing).
- Probe por defecto **MongoDB** (`ping` + manejo de estados transitorios).
- Router opcional con **rate limit** por IP.

## Instalación

```bash
npm install express-business-pulse express mongoose
```

(`mongoose` es *peer* requerido si usas los probes por defecto; puedes sustituir `getProbes` y no depender de Mongoose.)

## Express: montar el endpoint

```ts
import express from "express";
import { createPulseExpressRouter } from "express-business-pulse";

const app = express();

const pulse = createPulseExpressRouter({
  bearerToken: process.env.PULSE_BEARER_TOKEN,
  productName: process.env.PULSE_PRODUCT_NAME ?? "mi-app",
  environment: process.env.NODE_ENV,
  aiContext: process.env.PULSE_AI_CONTEXT ?? "",
  businessMetricsJson: process.env.PULSE_BUSINESS_METRICS_JSON,
  relativePath: "pulse", // GET /internal/pulse
});

if (pulse) {
  app.use("/internal", pulse);
}
```

Sin `bearerToken` válido, `createPulseExpressRouter` devuelve **`null`** (no se expone ruta).

## Next.js / agregador (solo datos)

```ts
import { collectPulse } from "express-business-pulse";

export async function GET() {
  const body = await collectPulse({
    productName: "web",
    businessMetricsJson: process.env.PULSE_BUSINESS_METRICS_JSON,
  });
  return Response.json(body);
}
```

(Ajusta auth: este ejemplo no incluye Bearer; en producción protege la ruta con tu propia capa.)

## API exportada

| Export | Uso |
|--------|-----|
| `createPulseExpressRouter` | Router Express listo. |
| `collectPulse` | Construir el JSON sin Express. |
| `createPulseBearerAuthMiddleware` | Solo auth Bearer sobre rutas propias. |
| `getDefaultPulseProbes`, `createMongooseDatabaseProbe` | Extender infraestructura. |
| Tipos (`PulsePayload`, `PulseProbe`, …) | Contrato TypeScript. |

## Variables de entorno (referencia)

Las mismas ideas que en la plantilla `express-base`: token largo, JSON de negocio en una línea, timeouts opcionales (`probeTimeoutMs`, `collectionTimeoutMs` en opciones de código o env leído por tu app).

## Licencia

ISC — ver `LICENSE`.
