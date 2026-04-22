# Publicar en npm

## Antes del primer publish

1. Edita `package.json`:
   - `"name"`: global único en npm (p. ej. `@tu-org/express-business-pulse` con scope).
   - `"repository"`: URL real del monorepo y `directory: "npm/express-business-pulse"`.
   - `"author"`, `"version"` (`0.1.0` → semver al publicar fixes).
2. Cuenta npm y **2FA** recomendada.

## Compilar y comprobar

```bash
cd npm/express-business-pulse
npm install
npm run build
```

Debe generarse `dist/` con `.js` y `.d.ts`.

## Login y publish

```bash
npm login
npm publish --access public
```

Si el nombre es **scoped** (`@org/pkg`) y es la primera vez:

```bash
npm publish --access public
```

## Consumo desde Git (sin publicar)

En otro proyecto:

```json
"dependencies": {
  "express-business-pulse": "file:../express-base/npm/express-business-pulse"
}
```

O URL de git + `npm install github:usuario/repo#main` si el paquete está en la raíz del subpath (npm soporta `package.json` en subcarpeta con workspaces o empaquetado manual).

## Versionado

Tras cambios en `src/`:

```bash
npm version patch   # o minor / major
npm publish
```

`prepublishOnly` ejecuta `npm run build` automáticamente.
