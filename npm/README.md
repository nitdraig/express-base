# Paquetes npm (monorepo)

Este directorio contiene paquetes publicables de forma **independiente** del código de `src/` de la plantilla Express.

| Paquete | Descripción |
|---------|-------------|
| [`express-business-pulse`](./express-business-pulse/) | Health & Business Pulse: `collectPulse`, router Express con Bearer, probes Mongo por defecto. |

Instalación desde el repo (desarrollo):

```bash
cd npm/express-business-pulse && npm install && npm run build
```

Publicación: ver `express-business-pulse/PUBLISH.md`.
