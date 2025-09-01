# 🔐 OAuth de Google y 📱 Notificaciones Push - Guía Completa

## 🚀 **Configuración Inicial**

### **1. Google OAuth Setup**

#### **Paso 1: Crear Proyecto en Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ y Google Identity

#### **Paso 2: Configurar OAuth 2.0**

1. Ve a "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
2. Configura las URLs autorizadas:
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://tu-dominio.com
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5000/auth/google/callback
     https://tu-dominio.com/auth/google/callback
     ```

#### **Paso 3: Obtener Credenciales**

1. Copia el `Client ID` y `Client Secret`
2. Agrega a tu archivo `.env`:
   ```env
   GOOGLE_CLIENT_ID=tu-client-id
   GOOGLE_CLIENT_SECRET=tu-client-secret
   ```

### **2. Push Notifications Setup**

#### **Paso 1: Generar VAPID Keys**

Las VAPID keys se generan automáticamente al iniciar el servidor, pero puedes generarlas manualmente:

```bash
# Instalar web-push globalmente
npm install -g web-push

# Generar keys
web-push generate-vapid-keys
```

#### **Paso 2: Configurar Variables**

```env
VAPID_PUBLIC_KEY=tu-vapid-public-key
VAPID_PRIVATE_KEY=tu-vapid-private-key
```

---

## 🔐 **Uso de OAuth de Google**

### **1. Flujo de Autenticación**

#### **Opción A: Redirección al Servidor**

```javascript
// Frontend - Obtener URL de autorización
const response = await fetch("/auth/google");
const { authUrl } = await response.json();

// Redirigir al usuario
window.location.href = authUrl;
```

#### **Opción B: Token ID desde Frontend**

```javascript
// Frontend - Usar Google Sign-In
google.accounts.id.initialize({
  client_id: "TU_GOOGLE_CLIENT_ID",
  callback: handleCredentialResponse,
});

async function handleCredentialResponse(response) {
  const result = await fetch("/auth/google/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: response.credential }),
  });

  const { token, user } = await result.json();
  // Guardar token y redirigir
}
```

### **2. Endpoints Disponibles**

| Método | Endpoint                | Descripción                 |
| ------ | ----------------------- | --------------------------- |
| `GET`  | `/auth/google`          | Obtener URL de autorización |
| `GET`  | `/auth/google/callback` | Callback de OAuth           |
| `POST` | `/auth/google/token`    | Verificar token ID          |
| `POST` | `/auth/google/refresh`  | Refrescar token             |
| `POST` | `/auth/google/revoke`   | Revocar tokens              |

### **3. Ejemplo de Uso Completo**

```javascript
// Frontend - React/Next.js
import { useEffect } from "react";

const GoogleAuth = () => {
  const handleGoogleLogin = async () => {
    try {
      // Obtener URL de autorización
      const response = await fetch("/api/auth/google");
      const { authUrl } = await response.json();

      // Redirigir
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error iniciando OAuth:", error);
    }
  };

  return <button onClick={handleGoogleLogin}>Iniciar sesión con Google</button>;
};
```

---

## 📱 **Uso de Notificaciones Push**

### **1. Configuración en Frontend**

#### **Paso 1: Solicitar Permisos**

```javascript
// Solicitar permisos de notificación
const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};
```

#### **Paso 2: Registrar Service Worker**

```javascript
// Registrar service worker para push notifications
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      return registration;
    } catch (error) {
      console.error("Error registrando service worker:", error);
    }
  }
};
```

#### **Paso 3: Suscribirse a Notificaciones**

```javascript
// Suscribirse a notificaciones push
const subscribeToPushNotifications = async () => {
  try {
    // Obtener VAPID public key
    const response = await fetch("/api/notifications/vapid-public-key");
    const { publicKey } = await response.json();

    // Registrar service worker
    const registration = await registerServiceWorker();

    // Suscribirse
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    // Enviar suscripción al servidor
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    console.log("Suscripción exitosa");
  } catch (error) {
    console.error("Error suscribiéndose:", error);
  }
};
```

### **2. Service Worker (sw.js)**

```javascript
// sw.js - Service Worker para push notifications
self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || "/icons/notification-icon.png",
      badge: data.notification.badge || "/icons/badge-icon.png",
      data: data.data || {},
      requireInteraction: data.notification.requireInteraction || false,
      silent: data.notification.silent || false,
      vibrate: data.notification.vibrate || [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Manejar clic en notificación
  if (event.action) {
    // Manejar acciones específicas
    console.log("Acción:", event.action);
  } else {
    // Abrir la aplicación
    event.waitUntil(clients.openWindow("/"));
  }
});
```

### **3. Endpoints de Notificaciones**

| Método   | Endpoint                          | Descripción                   |
| -------- | --------------------------------- | ----------------------------- |
| `GET`    | `/notifications/vapid-public-key` | Obtener VAPID public key      |
| `POST`   | `/notifications/subscribe`        | Suscribirse a notificaciones  |
| `DELETE` | `/notifications/unsubscribe`      | Desuscribirse                 |
| `POST`   | `/notifications/test`             | Enviar notificación de prueba |
| `POST`   | `/notifications/send-to-all`      | Enviar a todos (admin)        |
| `POST`   | `/notifications/send-to-role`     | Enviar por rol (admin)        |

### **4. Ejemplo de Uso Completo**

```javascript
// React Hook para notificaciones push
import { useState, useEffect } from "react";

const usePushNotifications = (token) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const subscribe = async () => {
    try {
      // Solicitar permisos
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permisos denegados");
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // Obtener VAPID key
      const response = await fetch("/api/notifications/vapid-public-key");
      const { publicKey } = await response.json();

      // Suscribirse
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      // Enviar al servidor
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: pushSubscription }),
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);
    } catch (error) {
      console.error("Error suscribiéndose:", error);
    }
  };

  const unsubscribe = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();

        await fetch("/api/notifications/unsubscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        setSubscription(null);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error desuscribiéndose:", error);
    }
  };

  return { isSubscribed, subscribe, unsubscribe };
};
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Notificaciones Automáticas**

```javascript
// En el servidor - Enviar notificación de bienvenida
const sendWelcomeNotification = async (userId) => {
  const notification = pushNotificationService.createNotification("welcome", {
    userId,
  });

  const user = await User.findById(userId);
  if (user?.pushSubscriptions) {
    await pushNotificationService.sendNotificationToMany(
      user.pushSubscriptions,
      notification
    );
  }
};

// En el servidor - Alerta de seguridad
const sendSecurityAlert = async (userId, loginInfo) => {
  const notification = pushNotificationService.createNotification(
    "security_alert",
    {
      loginInfo,
    }
  );

  const user = await User.findById(userId);
  if (user?.pushSubscriptions) {
    await pushNotificationService.sendNotificationToMany(
      user.pushSubscriptions,
      notification
    );
  }
};
```

### **2. Notificaciones Masivas**

```javascript
// Enviar a todos los usuarios
const sendAnnouncement = async (title, body) => {
  const notification = pushNotificationService.createNotification("custom", {
    title,
    body,
    customData: { type: "announcement" },
  });

  const result =
    await pushNotificationService.sendNotificationToAllUsers(notification);
  console.log(`Enviado a ${result.success} usuarios`);
};

// Enviar por rol
const sendRoleNotification = async (role, title, body) => {
  const notification = pushNotificationService.createNotification("custom", {
    title,
    body,
    customData: { type: "role_notification", role },
  });

  const result = await pushNotificationService.sendNotificationToRole(
    role,
    notification
  );
  console.log(`Enviado a ${result.success} usuarios con rol ${role}`);
};
```

---

## 🔧 **Configuración Avanzada**

### **1. Personalizar Notificaciones**

```javascript
// Crear notificación personalizada
const customNotification = {
  title: "Título personalizado",
  body: "Cuerpo de la notificación",
  icon: "/icons/custom-icon.png",
  badge: "/icons/badge-icon.png",
  image: "/images/notification-image.jpg",
  tag: "unique-tag",
  data: {
    url: "/dashboard",
    action: "open_dashboard",
  },
  actions: [
    {
      action: "view",
      title: "Ver",
      icon: "/icons/view-icon.png",
    },
    {
      action: "dismiss",
      title: "Descartar",
    },
  ],
  requireInteraction: true,
  silent: false,
  vibrate: [200, 100, 200, 100, 200],
};
```

### **2. Manejo de Errores**

```javascript
// En el servidor - Limpiar suscripciones inválidas
const cleanupInvalidSubscriptions = async () => {
  const users = await User.find({ "pushSubscriptions.0": { $exists: true } });

  for (const user of users) {
    const validSubscriptions = [];

    for (const subscription of user.pushSubscriptions) {
      const isValid =
        await pushNotificationService.validateSubscription(subscription);
      if (isValid) {
        validSubscriptions.push(subscription);
      }
    }

    if (validSubscriptions.length !== user.pushSubscriptions.length) {
      await User.findByIdAndUpdate(user._id, {
        pushSubscriptions: validSubscriptions,
      });
    }
  }
};
```

---

## 🚨 **Solución de Problemas**

### **Problemas Comunes de OAuth**

1. **Error: "redirect_uri_mismatch"**
   - Verifica que las URLs de redirección en Google Console coincidan exactamente
   - Incluye el protocolo (http/https) y el puerto

2. **Error: "invalid_client"**
   - Verifica que el Client ID y Client Secret sean correctos
   - Asegúrate de que las credenciales estén en el archivo .env

3. **Error: "access_denied"**
   - El usuario canceló la autorización
   - Maneja este caso en el frontend

### **Problemas Comunes de Push Notifications**

1. **No se reciben notificaciones**
   - Verifica que el service worker esté registrado
   - Confirma que los permisos estén concedidos
   - Revisa la consola del navegador para errores

2. **Error: "VAPID key not found"**
   - Verifica que las VAPID keys estén configuradas
   - Regenera las keys si es necesario

3. **Suscripciones no se guardan**
   - Verifica que el usuario esté autenticado
   - Confirma que la estructura de la suscripción sea correcta

---

## 📚 **Recursos Adicionales**

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

¡Con esta configuración tienes un sistema completo de OAuth de Google y notificaciones push listo para usar en tus proyectos freelance! 🚀
