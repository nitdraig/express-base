# Guía de OAuth Multi-Proveedor

Esta guía explica cómo configurar y usar el sistema de autenticación OAuth multi-proveedor implementado en el backend.

## Proveedores Soportados

El sistema actualmente soporta los siguientes proveedores OAuth:

- ✅ **Google** - Completamente implementado
- ✅ **Facebook** - Completamente implementado
- ✅ **GitHub** - Completamente implementado
- ⏳ **Twitter/X** - Preparado para implementación
- ⏳ **Microsoft** - Preparado para implementación
- ⏳ **Apple** - Preparado para implementación

## Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env` según los proveedores que quieras usar:

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

# Twitter OAuth (cuando se implemente)
TWITTER_CLIENT_ID=tu_twitter_client_id
TWITTER_CLIENT_SECRET=tu_twitter_client_secret

# Microsoft OAuth (cuando se implemente)
MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret

# URL de la API (requerida para callbacks)
API_URL=http://localhost:5000
FRONTEND_ORIGIN=http://localhost:3000
```

### Configuración de Proveedores

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
      // ...
    ]
  }
}
```

### Obtener URL de Autorización

```http
GET /auth/oauth/:provider?state=optional_state
```

**Ejemplo:**
```http
GET /auth/oauth/google?state=my_custom_state
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "my_custom_state",
    "provider": "google"
  }
}
```

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

1. **Frontend solicita URL de autorización:**
   ```javascript
   const response = await fetch('/auth/oauth/google?state=my_state');
   const { data } = await response.json();
   window.location.href = data.authUrl;
   ```

2. **Usuario autoriza en el proveedor OAuth**

3. **Proveedor redirige al callback del backend:**
   ```
   GET /auth/oauth/google/callback?code=AUTHORIZATION_CODE&state=my_state
   ```

4. **Backend procesa la autenticación:**
   - Intercambia el código por tokens
   - Obtiene información del usuario
   - Crea o actualiza el usuario en la base de datos
   - Genera un JWT
   - Envía notificación push de bienvenida (si está configurada)

5. **Backend redirige al frontend con el token:**
   ```
   FRONTEND_ORIGIN/auth/success?token=JWT_TOKEN&state=my_state&provider=google
   ```

6. **Frontend guarda el token y autentica al usuario**

## Modelo de Usuario

El modelo de usuario ha sido actualizado para soportar múltiples proveedores OAuth:

```typescript
interface IUser {
  // ... campos existentes
  oauthProvider?: "google" | "facebook" | "github" | "twitter" | "microsoft" | "apple";
  googleId?: string;
  facebookId?: string;
  githubId?: string;
  twitterId?: string;
  microsoftId?: string;
  appleId?: string;
  password?: string; // Ahora es opcional para usuarios OAuth
  // ...
}
```

### Características Importantes

- **Password opcional:** Los usuarios que se autentican con OAuth no requieren contraseña
- **Activación automática:** Los usuarios OAuth se activan automáticamente (`isActive: true`)
- **Email verificado:** El email se marca como verificado según el proveedor
- **Rol por defecto:** Los nuevos usuarios OAuth reciben el rol `"student"` por defecto

## Compatibilidad con Registro Tradicional

El sistema es completamente compatible con el registro tradicional:

- Los usuarios pueden registrarse con email/password normalmente
- Los usuarios pueden vincular cuentas OAuth a cuentas existentes
- Si un usuario con email/password se autentica con OAuth usando el mismo email, las cuentas se vinculan automáticamente

## Ejemplo de Implementación Frontend

### React/Next.js

```typescript
// hooks/useOAuth.ts
import { useState } from 'react';

export const useOAuth = () => {
  const [loading, setLoading] = useState(false);

  const loginWithProvider = async (provider: string) => {
    setLoading(true);
    try {
      // Obtener URL de autorización
      const response = await fetch(
        `/auth/oauth/${provider}?state=${encodeURIComponent(window.location.href)}`
      );
      const { data } = await response.json();
      
      // Redirigir al proveedor OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error iniciando OAuth:', error);
      setLoading(false);
    }
  };

  return { loginWithProvider, loading };
};

// Componente de botones OAuth
const OAuthButtons = () => {
  const { loginWithProvider, loading } = useOAuth();

  return (
    <div>
      <button 
        onClick={() => loginWithProvider('google')}
        disabled={loading}
      >
        Iniciar con Google
      </button>
      <button 
        onClick={() => loginWithProvider('facebook')}
        disabled={loading}
      >
        Iniciar con Facebook
      </button>
      <button 
        onClick={() => loginWithProvider('github')}
        disabled={loading}
      >
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

## Seguridad

### Consideraciones de Seguridad

1. **State Parameter:** Siempre usa el parámetro `state` para prevenir ataques CSRF
2. **HTTPS:** En producción, siempre usa HTTPS para proteger los tokens
3. **Validación de Tokens:** El backend valida todos los tokens antes de crear/actualizar usuarios
4. **Email único:** El sistema previene duplicados de email y vincula cuentas automáticamente

### Mejores Prácticas

- Valida el `state` en el callback
- Implementa rate limiting en los endpoints OAuth
- Monitorea intentos de autenticación fallidos
- Registra todos los inicios de sesión OAuth

## Troubleshooting

### Error: "OAuth de X no está configurado"

**Causa:** Las variables de entorno no están configuradas correctamente.

**Solución:** Verifica que las variables `X_CLIENT_ID` y `X_CLIENT_SECRET` estén en tu archivo `.env`.

### Error: "redirect_uri_mismatch"

**Causa:** La URL de callback no coincide con la configurada en el proveedor OAuth.

**Solución:** Verifica que la URL de callback en el proveedor coincida exactamente con `API_URL/auth/oauth/:provider/callback`.

### Usuario no se crea correctamente

**Causa:** Puede haber un conflicto con el email o problemas de validación.

**Solución:** 
- Verifica los logs del servidor
- Asegúrate de que el email del proveedor sea válido
- Verifica que el modelo de usuario esté actualizado correctamente

## Extender el Sistema

### Agregar un Nuevo Proveedor

1. Crea un nuevo servicio en `src/shared/services/[provider]OAuthService.ts`
2. Implementa los métodos requeridos:
   - `generateAuthUrl(state?: string): string`
   - `exchangeCodeForTokens(code: string): Promise<Tokens>`
   - `getUserInfo(accessToken: string): Promise<UserInfo>`
   - `createOrUpdateUserFromProvider(userInfo): Promise<User>`
   - `isConfigured(): boolean`
3. Agrega el servicio al mapa en `oauthController.ts`
4. Agrega las variables de entorno en `env.ts`
5. Actualiza el modelo de usuario si es necesario

## Soporte

Para más información o problemas, consulta:
- Documentación de la API: `API_DOCUMENTATION.md`
- Guía de OAuth y Push Notifications: `OAUTH_PUSH_GUIDE.md`

