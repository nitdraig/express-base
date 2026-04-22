# npm packages (monorepo)

This directory holds packages that can be published **independently** from the main Express template under `src/`.

| Package | Description |
|---------|---------------|
| [`excelso-pulse-express`](./excelso-pulse-express/) | Health & Business Pulse: `collectPulse`, Express router with Bearer auth, MongoDB probes by default. |

Local development:

```bash
cd npm/excelso-pulse-express && npm install && npm run build
```

Publishing: see `excelso-pulse-express/PUBLISH.md`.
