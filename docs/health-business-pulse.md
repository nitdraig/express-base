# Health & Business Pulse — Estrategia

Este documento describe la estrategia del endpoint **Health & Business Pulse** para esta base **Express + TypeScript**, pensada como **plantilla open source** reutilizable en distintos proyectos. Aquí no hay implementación de código: solo contrato conceptual, seguridad, extensibilidad y criterios de calidad.

---

## 1. Qué es y en qué se diferencia de un health check clásico

| Concepto | Health check tradicional (DevOps) | Health & Business Pulse |
|----------|-------------------------------------|-------------------------|
| Audiencia | Orquestadores, balanceadores, Kubernetes | Agregadores, automatización (p. ej. Skipy), backends de asistentes / IA |
| Contenido | Principalmente técnico (proceso vivo, DB conectada) | **Técnico + negocio + texto para contexto de IA** |
| Seguridad | Suele ser **público** en rutas `/health`, `/ready`, `/live` | Debe ser **restringido**: métricas y narrativa no son públicas por defecto |
| Objetivo | “¿Puedo enviar tráfico?” | “¿Qué está pasando **y** qué valor está entregando el producto?” |

El Pulse actúa como **traductor de estados**: sintetiza el ecosistema (backend, datos, integraciones) en un **informe JSON estable y semántico** que una IA o un agregador puede procesar en milisegundos.

**Principio para esta base:** las rutas de **liveness/readiness** existentes para operaciones **no se sustituyen** por el Pulse. El Pulse es un **contrato adicional**, enrutado y protegido de forma explícita.

---

## 2. Objetivo funcional

1. Exponer un único recurso REST (p. ej. `GET` bajo un prefijo acordado) con respuesta **siempre estructurada igual** (evolución por versionado del contrato, no por campos improvisados).
2. Incluir un **nodo de contexto para IA**: texto plano en lenguaje humano que describe el estado actual del producto (sin sustituir a las métricas estructuradas).
3. Incluir **métricas de impacto (KPIs de negocio)** con nombres de campo **estables** para “context engineering” (ejemplos ilustrativos: mejora en matching, velocidad de backlog / time-to-market — cada fork define qué KPIs aplica).
4. Incluir **infraestructura crítica**: al menos la base de datos y, opcionalmente, integraciones de terceros con estado por dependencia.
5. Cumplir **baja latencia** como objetivo de diseño (p. ej. &lt; 200 ms en condiciones normales), midiendo en el entorno real y ajustando timeouts y fuentes de datos.

---

## 3. Forma semántica sugerida del JSON (contrato)

Los nombres exactos pueden fijarse en la implementación; la estrategia pide **tres familias claras** más metadatos:

- **`status`**: estado global derivado por reglas (p. ej. `ok`, `degraded`, `down`).
- **`metrics`**: subobjetos separando **técnico** y **negocio**; unidades y tendencias explícitas cuando existan datos.
- **`context`**: metadatos del producto (nombre, versión, entorno, instante de generación del informe).
- **`ai_context`** (o nombre equivalente fijado en el contrato): **string** en texto plano, curado o generado bajo reglas estrictas, sin datos personales innecesarios.
- **`infrastructure`** (o bajo `metrics` / sección dedicada): lista o mapa de **dependencias** (DB, APIs externas) con `status`, latencia opcional y mensajes **seguros** hacia el cliente.

Opcional pero recomendable en bases reutilizables: campo **`pulse_version`** para evolucionar el esquema sin romper consumidores.

---

## 4. Limitar quién puede ver esta información

En una plantilla open source conviene **defensa en capas**; cada proyecto activa las que su despliegue permite.

### 4.1 Capas recomendadas

| Capa | Descripción | Nota para forks |
|------|-------------|-------------------|
| **Credencial de servicio** | Header tipo `Authorization: Bearer <token>` (o header dedicado) comparado de forma segura con un secreto de entorno | No reutilizar el JWT de usuarios finales: distinto ciclo de vida y alcance |
| **Red y descubrimiento** | Ruta bajo prefijo “interno”, no enlazada en docs públicas del producto; idealmente solo red interna, VPN o proxy | Documentar: “no exponer este path a Internet abierta” |
| **Rate limiting** | Límite estricto solo en el Pulse | Mitiga abuso si el token se filtra parcialmente |
| **Opcional avanzado** | Peticiones firmadas (p. ej. HMAC + timestamp), mTLS entre servicios | Patrones documentados; no obligatorio en el núcleo mínimo |

### 4.2 Errores y filtrado

- Respuestas **401/403** uniformes sin filtrar detalles del secreto.
- Detalles técnicos de fallos (stack, URLs internas) solo en **logs** estructurados, no en el cuerpo JSON del Pulse.

### 4.3 “Quién” en sentido de negocio

El consumidor típico es un **backend de confianza** (agregador, cron, herramienta de automatización). Si en el futuro se necesitan **varios emisores** con distintos permisos, la estrategia es un mapa **token → alcance/tenant** mantenido fuera del “core” genérico o como extensión documentada, sin acoplar la plantilla a un producto concreto.

---

## 5. Adaptabilidad a cualquier base de datos (y otras dependencias)

Esta base pretende servir a proyectos con **MongoDB, PostgreSQL, MySQL, Redis**, etc. El Pulse **no debe acoplarse** a un solo driver en su núcleo conceptual.

### 5.1 Patrón de probes (enchufable)

1. **Contrato del Pulse** (JSON final): **fijo y estable** en lo posible.
2. **Probes** (o adaptadores de salud): piezas pequeñas que implementan una **interfaz común** del estilo: identificador, ejecución de chequeo con timeout, resultado normalizado (`up` / `down` / `degraded` / `unknown`, latencia, mensaje seguro).
3. **Orquestador**: recibe una **lista configurable** de probes al arranque; ejecuta chequeos **en paralelo** con presupuesto de tiempo por probe; agrega resultados en `infrastructure` y calcula `status` global según reglas declaradas.

### 5.2 Open source y dependencias opcionales

- **Núcleo conceptual**: interfaz + orquestación + endpoint protegido + documentación.
- **Implementaciones concretas** (Mongo, Postgres, …): como **adaptadores de ejemplo** o módulos opcionales, con dependencias npm **documentadas** para no forzar a todos los clones a instalar todos los drivers.
- **README / tabla de configuración**: por cada probe, variables de entorno esperadas y timeouts recomendados.

### 5.3 KPIs de negocio y texto `ai_context`

- **Fase inicial**: valores y textos desde configuración (entorno) o snapshot actualizado por otro proceso.
- **Fase avanzada**: lecturas rápidas de almacenes pre-agregados; evitar agregaciones pesadas **dentro** del request del Pulse para no romper el objetivo de latencia.

---

## 6. Latencia y degradación elegante

1. Medir **duración total** del Pulse y, si es útil, por probe (en logs).
2. **Timeouts independientes** por dependencia; un fallo o timeout de una integración **no crítica** debería llevar a `degraded` en lugar de tumbar todo el informe (salvo política explícita para dependencias críticas).
3. Si un probe supera su tiempo, devolver estado `unknown` o `stale` para ese ítem sin bloquear el resto.

---

## 7. Compatibilidad multi-stack

- Mismo **contrato JSON** y mismos headers de autenticación pueden implementarse en **Next.js** (Route Handlers), workers o herramientas como **Skipy**: la plantilla Express documenta el contrato; otros runtimes lo replican o proxyean.
- **Versionado** del contrato (`pulse_version`) reduce fricción cuando forks añadan campos opcionales.

---

## 8. App central (agregador) e información centralizada

Cuando varias aplicaciones construidas sobre esta base deben verse en **una sola app nueva** (panel, BFF, “comando” para IA, etc.), esa app no sustituye la fuente de verdad de cada backend: **solo consolida lecturas** del Pulse de cada uno.

### 8.1 Rol del agregador

| Responsabilidad | Descripción |
|-----------------|-------------|
| **Descubrimiento** | Lista configurable de orígenes: identificador de app (`appId` / slug), URL base del Pulse, referencia al secreto (env, base de datos de config, secret manager). |
| **Invocación** | Llamadas al `GET` del Pulse de cada backend **en paralelo**, con **timeout global** mayor que el de un solo Pulse (p. ej. varios segundos) para que un servicio lento no bloquee la respuesta agregada. |
| **Modelo unificado** | Normalizar cada respuesta en un shape interno común: `appId`, `status`, `metrics`, `ai_context`, `infrastructure`, `fetchedAt`, y opcionalmente `error` / `unavailable` si la llamada falló. |
| **Aislamiento de fallos** | Si una app no responde o devuelve error, registrar esa entrada como **no disponible** sin invalidar el resto del informe agregado. |
| **Seguridad** | Los **Bearer tokens** viven solo en el backend del agregador (o en el sistema de secretos que este use). Una UI pública consume **solo** la API ya agregada y autenticada del centro, nunca los tokens hacia cada app. |

### 8.2 Contrato entre backends y el agregador

1. **Mismo contrato JSON** (o `pulse_version` explícita) en todos los backends que se actualicen desde la misma línea de la plantilla.
2. **Campos de negocio estables** (`metrics.business.*`): lo que una app no tenga aún puede omitirse o enviarse como nulo según reglas documentadas; el agregador no debe depender del texto libre de `ai_context` para identificar la app.
3. **Identidad de la app** la aporta la **configuración del agregador** (`appId`), no campos opcionales del Pulse.

### 8.3 Rendimiento y operación

- **Caché corta** (p. ej. 10–30 s) en el agregador opcional, para no saturar todos los backends ante refrescos repetidos del dashboard.
- **Logs** en el agregador: duración de la recolección, por-app latencia o error; correlación con revisiones de despliegue.

### 8.4 Documentación recomendada en el repo del agregador

- Cómo **dar de alta** una app (URL del Pulse, headers, timeouts).
- Tabla de **compatibilidad** (`pulse_version` o campos mínimos esperados).
- Ejemplo de **payload agregado** (lista de resultados + timestamp de la recolección).

---

## 9. Proyectos pre-existentes que ya usan esta base

Cada fork o app derivada **incorpora el Pulse** al alinearse con una versión de la plantilla que ya lo incluya (merge, cherry-pick o copia del módulo, según el flujo del equipo).

### 9.1 Qué debe hacer cada app existente

1. **Actualizar** desde esta base cuando el Pulse esté disponible en el upstream acordado.
2. **Configurar** por entorno: token de servicio (único por app o por entorno), timeouts, lista de probes, KPIs y `ai_context` según el producto.
3. **Exponer** la ruta del Pulse solo en las mismas condiciones de red que el resto de APIs internas (no sustituir `/ready` / `/live` públicos de operaciones).

### 9.2 Enlazar con la app central

1. Registrar en el agregador la **URL del Pulse** y el **secreto** tras validar en staging.
2. Orden sugerido: **staging** de la app → registro en agregador staging → pruebas de UI o consumo IA → **producción**.
3. **Rollback**: desactivar o quitar la entrada de esa app en la config del agregador sin necesidad de revertir todo el despliegue del backend, si el endpoint ya no es problemático; o usar feature flag en el fork.

### 9.3 Forks desalineados

Si una app lleva tiempo sin mergear, el agregador puede marcar **versión de contrato desconocida** o tratar respuestas incompletas según reglas tolerantes; la prioridad es no romper la vista global por un solo origen.

---

## 10. Pasos sugeridos cuando se pase de estrategia a implementación

1. Fijar el **esquema JSON** (campos obligatorios/opcionales y valores de `status`) y un **ejemplo** de referencia para pruebas y para integradores.
2. Añadir la **ruta protegida** sin interferir con `/ready` y `/live`.
3. Implementar **validación de token de servicio** (y rate limit dedicado si aplica).
4. Implementar **orquestador + interfaz de probe** y un **primer adaptador** alineado con el stack por defecto de este repo (p. ej. Mongo si sigue siendo el default).
5. Documentar en tabla **probes soportados de ejemplo**, variables de entorno y límites de tiempo.
6. Añadir pruebas automatizadas del contrato (forma del JSON, 401 sin token, comportamiento ante timeout simulado).
7. Observabilidad: logs con `pulse_duration_ms` y `status`; alertas si la latencia p95 supera el objetivo del despliegue.
8. En la **app agregadora**: configuración de orígenes, normalización del contrato, timeouts globales y manejo de fallos por app (sección 8).

---

## 11. Riesgos a vigilar

- **Confundir** Pulse con health de Kubernetes y terminar protegiendo o enlenteciendo rutas que los probes del cluster necesitan públicas.
- **Exponer** roadmaps o números sensibles en el JSON o en `ai_context` sin revisión de producto/legal.
- **Calcular KPIs al vuelo** con consultas pesadas: degrada la voz del asistente y la fiabilidad del informe.
- **Depositar secretos** en el frontend del agregador o en repos públicos: los tokens del Pulse deben vivir solo en backend / secret manager.

---

## 12. Criterios de aceptación (checklist)

- [ ] Sin credencial válida → acceso denegado de forma consistente.
- [ ] Con credencial → cuerpo conforme al contrato documentado (tests o validación de esquema).
- [ ] Infraestructura refleja correctamente al menos la base de datos configurada en el fork.
- [ ] Latencia acorde al objetivo del entorno, con degradación clara cuando un probe falla o expira.
- [ ] README de la base enlaza este documento y explica cómo registrar probes adicionales sin fork del núcleo innecesario.
- [ ] App agregadora: registro de apps, llamadas paralelas con timeout global, modelo unificado y fallos aislados por app; tokens solo en servidor o secret manager.

---

*Documento de estrategia. La implementación concreta puede variar según las decisiones de cada proyecto derivado de esta plantilla.*

---

## 13. Implementación en esta base (referencia rápida)

### Ruta y activación

- **URL:** `GET /internal/pulse`
- **Auth:** header `Authorization: Bearer <PULSE_BEARER_TOKEN>`
- Si **`PULSE_BEARER_TOKEN`** no está definido en el entorno, **la ruta no se monta** (no hay endpoint público accidental).

### Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `PULSE_BEARER_TOKEN` | Sí (para habilitar el endpoint) | Secreto de servicio; comparación resistente a timing (hash SHA-256). |
| `PULSE_PRODUCT_NAME` | No | Nombre del producto en `context.product_name` (por defecto `express-base`). |
| `PULSE_AI_CONTEXT` | No | Texto plano para el nodo de contexto IA. |
| `PULSE_BUSINESS_METRICS_JSON` | No | JSON objeto con KPIs de negocio (se expone en `metrics.business`). |
| `PULSE_PROBE_TIMEOUT_MS` | No | Timeout por probe en ms (por defecto `150`). |
| `PULSE_COLLECTION_TIMEOUT_MS` | No | Tope global de la recolección en ms (por defecto `300`). |

### Probes por defecto

- **MongoDB:** probe `mongodb` usando `ping` sobre la conexión Mongoose activa.
- **Forks:** añadir probes propios (Postgres, Redis, APIs) y pasarlos a `collectPulse({ probes })` o extender la fábrica en `src/shared/pulse/getDefaultPulseProbes.ts`.

### Tests (Jest)

- `jest.setup.ts` define valores mínimos de entorno para CI; en local puedes sobrescribirlos.
- Cobertura: contrato del JSON, auth Bearer, timeouts de probes.
