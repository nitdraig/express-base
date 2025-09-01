# API Documentation - Express Base

## 🔐 **Autenticación**

### Login

```http
POST /auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login exitoso"
}
```

### Refresh Token

```http
POST /auth/refresh-token
```

**Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Forgot Password

```http
POST /auth/forgot-password
```

**Body:**

```json
{
  "email": "user@example.com"
}
```

### Reset Password

```http
POST /auth/reset-password
```

**Body:**

```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}
```

### Logout

```http
POST /auth/logout
```

**Headers:**

```
Authorization: Bearer <token>
```

## 👤 **Usuarios**

### Obtener Perfil

```http
GET /users/me
```

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "role": "student",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Actualizar Perfil

```http
PUT /users/profile
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "email": "newemail@example.com"
}
```

### Cambiar Contraseña

```http
PUT /users/change-password
```

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

### Contar Usuarios (Admin)

```http
GET /users/count
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

### Eliminar Usuario (Admin)

```http
DELETE /users/:id
```

**Headers:**

```
Authorization: Bearer <admin_token>
```

## 🏥 **Health Checks**

### Health Check Básico

```http
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### Health Check Completo

```http
GET /health/full
```

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "database": {
    "status": "connected",
    "readyState": 1
  },
  "memory": {
    "used": 45,
    "total": 64,
    "external": 12
  },
  "version": "v18.17.0"
}
```

### Readiness Check

```http
GET /ready
```

### Liveness Check

```http
GET /live
```

## 🔒 **Seguridad**

### Requisitos de Contraseña

- Mínimo 8 caracteres
- Máximo 128 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número
- Al menos un carácter especial
- Sin espacios

### Rate Limiting

- **General**: 100 requests por 15 minutos
- **Login**: 5 intentos por 15 minutos
- **Bloqueo de cuenta**: 15 minutos después de 5 intentos fallidos

### Headers de Seguridad

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📝 **Códigos de Error**

| Código | Descripción                                |
| ------ | ------------------------------------------ |
| 400    | Bad Request - Datos inválidos              |
| 401    | Unauthorized - Token inválido o faltante   |
| 403    | Forbidden - Sin permisos                   |
| 404    | Not Found - Recurso no encontrado          |
| 423    | Locked - Cuenta bloqueada                  |
| 429    | Too Many Requests - Rate limit excedido    |
| 500    | Internal Server Error - Error del servidor |

## 🚀 **Instalación y Uso**

1. **Instalar dependencias:**

```bash
pnpm install
```

2. **Configurar variables de entorno:**

```bash
cp .env.example .env
# Editar .env con tus valores
```

3. **Crear directorio de logs:**

```bash
mkdir logs
```

4. **Ejecutar en desarrollo:**

```bash
pnpm dev
```

5. **Ejecutar tests:**

```bash
pnpm test
```

6. **Build para producción:**

```bash
pnpm build
pnpm start
```
