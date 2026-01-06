# Guía de OAuth con Passport.js

Esta guía explica cómo usar el sistema de autenticación OAuth implementado con **Passport.js**, el estándar de la industria para autenticación en Node.js.

## ¿Qué es Passport.js?

Passport.js es un middleware de autenticación para Node.js extremadamente flexible y modular. Con más de 500 estrategias disponibles, es la solución más popular para autenticación en aplicaciones Node.js.

## Proveedores Soportados

El sistema actualmente soporta:

- ✅ **Google** - Completamente implementado
- ✅ **Facebook** - Completamente implementado
- ✅ **GitHub** - Completamente implementado
- 🔄 **Fácil de extender** - Agregar más proveedores es muy simple

## Configuración

### 1. Instalar Dependencias

Las dependencias ya están en `package.json`. Solo necesitas ejecutar:

```bash
npm install
```

Esto instalará:
- `passport` - Middleware principal
- `passport-google-oauth20` - Estrategia para Google
- `passport-facebook` - Estrategia para Facebook
- `passport-github2` - Estrategia para GitHub

### 2. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=tu_facebook_app_id
FACEBOOK_APP_SECRET=tu_facebook_app_secret

# GitHub OAuth
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret

# URLs (requeridas)
API_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:3000
```

### 3. Configuración de Proveedores

#### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Agrega las URLs de redirección autorizadas:
   - `http://localhost:5000/auth/oauth/google/callback` (desarrollo)
   - `https://tu-dominio.com/auth/oauth/google/callback` (producción)

#### Facebook OAuth

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Agrega el producto "Facebook Login"
4. Configura las URLs de redirección OAuth válidas:
   - `http://localhost:5000/auth/oauth/facebook/callback` (desarrollo)
   - `https://tu-dominio.com/auth/oauth/facebook/callback` (producción)
5. Configura los permisos: `email` y `public_profile`

#### GitHub OAuth

1. Ve a [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Crea una nueva OAuth App
3. Configura la Authorization callback URL:
   - `http://localhost:5000/auth/oauth/github/callback` (desarrollo)
   - `https://tu-dominio.com/auth/oauth/github/callback` (producción)

## Uso de la API

### Obtener Proveedores Disponibles

```http
GET /auth/oauth/providers
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "provider": "google",
        "configured": true
      },
      {
        "provider": "facebook",
        "configured": true
      },
      {
        "provider": "github",
        "configured": true
      }
    ],
    "all": [
      {
        "provider": "google",
        "configured": true
      },
      {
        "provider": "facebook",
        "configured": false
      },
      {
        "provider": "github",
        "configured": true
      }
    ]
  }
}
```

### Iniciar Autenticación OAuth

```http
GET /auth/oauth/:provider
```

**Ejemplos:**
- `GET /auth/oauth/google`
- `GET /auth/oauth/facebook`
- `GET /auth/oauth/github`

Esto redirigirá automáticamente al proveedor OAuth para la autorización.

### Callback de OAuth

El callback se maneja automáticamente. Después de que el usuario autoriza la aplicación, será redirigido a:

```
FRONTEND_ORIGIN/auth/success?token=JWT_TOKEN&state=state_value&provider=google
```

En caso de error:
```
FRONTEND_ORIGIN/auth/error?error=error_code&provider=google
```

## Flujo de Autenticación

### Flujo Completo

1. **Frontend redirige al endpoint de OAuth:**
   ```javascript
   window.location.href = '/auth/oauth/google';
   ```

2. **Backend redirige al proveedor OAuth** (manejado por Passport)

3. **Usuario autoriza en el proveedor OAuth**

4. **Proveedor redirige al callback del backend:**
   ```
   GET /auth/oauth/google/callback?code=AUTHORIZATION_CODE
   ```

5. **Backend procesa la autenticación:**
   - Passport intercambia el código por tokens
   - Passport obtiene información del usuario
   - Se crea o actualiza el usuario en la base de datos
   - Se genera un JWT
   - Se envía notificación push de bienvenida (si está configurada)

6. **Backend redirige al frontend con el token:**
   ```
   FRONTEND_ORIGIN/auth/success?token=JWT_TOKEN&state=state_value&provider=google
   ```

7. **Frontend guarda el token y autentica al usuario**

## Ejemplo de Implementación Frontend

### React/Next.js

```typescript
// hooks/useOAuth.ts
export const useOAuth = () => {
  const loginWithProvider = (provider: string) => {
    // Redirigir directamente al endpoint de OAuth
    window.location.href = `/auth/oauth/${provider}`;
  };

  return { loginWithProvider };
};

// Componente de botones OAuth
const OAuthButtons = () => {
  const { loginWithProvider } = useOAuth();

  return (
    <div>
      <button onClick={() => loginWithProvider('google')}>
        Iniciar con Google
      </button>
      <button onClick={() => loginWithProvider('facebook')}>
        Iniciar con Facebook
      </button>
      <button onClick={() => loginWithProvider('github')}>
        Iniciar con GitHub
      </button>
    </div>
  );
};

// Página de éxito (auth/success)
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const provider = params.get('provider');
  
  if (token) {
    // Guardar token
    localStorage.setItem('token', token);
    // Redirigir al dashboard
    router.push('/dashboard');
  }
}, []);
```

### Vanilla JavaScript

```javascript
// Iniciar OAuth
function loginWithProvider(provider) {
  window.location.href = `/auth/oauth/${provider}`;
}

// Manejar callback de éxito
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  localStorage.setItem('token', token);
  window.location.href = '/dashboard';
}
```

## Arquitectura del Sistema

### Estructura de Archivos

```
src/
├── shared/
│   ├── config/
│   │   └── passport.ts          # Configuración de Passport y estrategias
│   └── services/
│       └── oauthService.ts       # Servicio unificado para crear/actualizar usuarios
├── domain/
│   └── auth/
│       ├── controllers/
│       │   └── passportOAuthController.ts  # Controlador de OAuth con Passport
│       └── routes/
│           └── oauthRoutes.ts   # Rutas OAuth
```

### Flujo de Datos

1. **Usuario hace clic en "Iniciar con Google"**
2. **Frontend redirige a** `/auth/oauth/google`
3. **Passport redirige a Google** para autorización
4. **Google redirige a** `/auth/oauth/google/callback?code=...`
5. **Passport ejecuta la estrategia de Google:**
   - Intercambia código por tokens
   - Obtiene información del usuario
   - Llama al callback de la estrategia
6. **Callback de estrategia:**
   - Llama a `oauthService.createOrUpdateUser()`
   - Retorna el usuario
7. **Controlador de callback:**
   - Genera JWT
   - Envía notificación push (opcional)
   - Redirige al frontend con el token

## Ventajas de Passport.js

### ✅ Ventajas

- **Estándar de la industria:** Usado por millones de aplicaciones
- **Modular:** Cada estrategia es independiente
- **Flexible:** Fácil de personalizar y extender
- **Comunidad grande:** Muchos recursos y ejemplos
- **Sin vendor lock-in:** Control total del código
- **Gratis:** Sin costos ocultos
- **TypeScript:** Soporte completo de tipos

### ⚠️ Consideraciones

- **Más código:** Debes implementar la lógica de negocio
- **Mantenimiento:** Tú gestionas las actualizaciones
- **Sin UI:** Debes construir tus propios componentes

## Agregar Nuevos Proveedores

Agregar un nuevo proveedor es muy simple:

### 1. Instalar la estrategia

```bash
npm install passport-twitter
npm install --save-dev @types/passport-twitter
```

### 2. Agregar al modelo de usuario

```typescript
// src/domain/users/models/userModel.ts
twitterId?: string;
```

### 3. Agregar variables de entorno

```typescript
// src/shared/config/env.ts
TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
```

### 4. Agregar estrategia en Passport

```typescript
// src/shared/config/passport.ts
import { Strategy as TwitterStrategy } from "passport-twitter";

if (ENV.TWITTER_CLIENT_ID && ENV.TWITTER_CLIENT_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: ENV.TWITTER_CLIENT_ID,
        consumerSecret: ENV.TWITTER_CLIENT_SECRET,
        callbackURL: `${ENV.API_URL}/auth/oauth/twitter/callback`,
      },
      async (token, tokenSecret, profile, done) => {
        // Lógica similar a otras estrategias
        const oauthUserInfo = {
          id: profile.id,
          email: profile.emails?.[0]?.value || "",
          name: profile.displayName || "",
          picture: profile.photos?.[0]?.value,
          verifiedEmail: false,
        };

        const user = await oauthService.createOrUpdateUser(
          "twitter",
          oauthUserInfo,
          "twitterId"
        );

        return done(null, user);
      }
    )
  );
}
```

### 5. Agregar rutas

```typescript
// src/domain/auth/routes/oauthRoutes.ts
router.get("/twitter", passportOAuthController.authenticate("twitter"));
router.get("/twitter/callback", ...passportOAuthController.handleCallback("twitter"));
```

¡Y listo! El nuevo proveedor está disponible.

## Seguridad

### Mejores Prácticas

1. **HTTPS en producción:** Siempre usa HTTPS para proteger los tokens
2. **Validar state:** Implementa validación del parámetro `state` para prevenir CSRF
3. **Rate limiting:** Aplica rate limiting a los endpoints OAuth
4. **Validar tokens:** El backend valida todos los tokens antes de crear usuarios
5. **Email único:** El sistema previene duplicados y vincula cuentas automáticamente

### Protecciones Implementadas

- ✅ Validación de tokens OAuth
- ✅ Prevención de duplicados de email
- ✅ Vinculación automática de cuentas
- ✅ Sanitización de entrada
- ✅ Logging de todas las autenticaciones

## Troubleshooting

### Error: "Failed to obtain access token"

**Causa:** Las credenciales OAuth no son correctas o el callback URL no coincide.

**Solución:** 
- Verifica que `CLIENT_ID` y `CLIENT_SECRET` sean correctos
- Verifica que el callback URL en el proveedor coincida exactamente con `API_URL/auth/oauth/:provider/callback`

### Error: "User not found in callback"

**Causa:** Error al crear o actualizar el usuario en la base de datos.

**Solución:**
- Verifica los logs del servidor
- Asegúrate de que la base de datos esté conectada
- Verifica que el modelo de usuario esté correctamente configurado

### Usuario no se crea correctamente

**Causa:** Puede haber un conflicto con el email o problemas de validación.

**Solución:**
- Verifica los logs del servidor
- Asegúrate de que el email del proveedor sea válido
- Verifica que el modelo de usuario permita usuarios OAuth sin password

## Comparación con Otras Soluciones

| Característica | Passport.js | Clerk | Auth0 |
|---------------|-------------|-------|-------|
| **Costo** | Gratis | $25/mes+ | $35/mes+ |
| **Control** | Total | Limitado | Limitado |
| **UI incluida** | No | Sí | Parcial |
| **Vendor lock-in** | No | Sí | Sí |
| **Flexibilidad** | Máxima | Media | Media |
| **Comunidad** | Enorme | Creciente | Grande |

## Recursos Adicionales

- [Documentación oficial de Passport.js](http://www.passportjs.org/)
- [Estrategias disponibles](http://www.passportjs.org/packages/)
- [Guía de OAuth Multi-Proveedor](./OAUTH_MULTI_PROVIDER_GUIDE.md)
- [Comparación de Soluciones OAuth](./OAUTH_SOLUTIONS_COMPARISON.md)

## Conclusión

Passport.js es la solución perfecta para un repositorio base como este porque:

- ✅ **Control total:** Tu código, tu servidor, tu base de datos
- ✅ **Sin dependencias externas:** No vendor lock-in
- ✅ **Estándar de la industria:** Confiable y probado
- ✅ **Fácil de extender:** Agregar proveedores es simple
- ✅ **Gratis:** Sin costos ocultos

¡Disfruta de tu sistema de autenticación OAuth con Passport.js! 🚀

