# Guía de Uso de Socket.io

Socket.io está completamente implementado y listo para usar. Esta guía explica cómo conectarte desde el frontend y usar todas las funcionalidades.

## Instalación en el Frontend

```bash
npm install socket.io-client
```

## Conexión Básica

### React/Next.js

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000', {
  auth: {
    token: 'TU_JWT_TOKEN' // Token JWT del usuario autenticado
  },
  transports: ['websocket', 'polling']
});

// Escuchar conexión
socket.on('connect', () => {
  console.log('Conectado a Socket.io');
});

// Escuchar desconexión
socket.on('disconnect', () => {
  console.log('Desconectado de Socket.io');
});

// Escuchar errores
socket.on('error', (error) => {
  console.error('Error de Socket.io:', error);
});
```

### Vanilla JavaScript

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token') // Tu JWT token
  }
});

socket.on('connect', () => {
  console.log('Conectado');
});
```

## Eventos Disponibles

### Enviar Mensaje

```typescript
socket.emit('message:send', {
  from: 'user-id',
  to: 'recipient-id',
  content: 'Hola, ¿cómo estás?',
  type: 'text'
});

// Escuchar confirmación
socket.on('message:sent', (message) => {
  console.log('Mensaje enviado:', message);
});

// Escuchar mensajes recibidos
socket.on('message:received', (message) => {
  console.log('Nuevo mensaje:', message);
});
```

### Indicar que Estás Escribiendo

```typescript
// Empezar a escribir
socket.emit('message:typing', {
  to: 'recipient-id',
  isTyping: true
});

// Dejar de escribir
socket.emit('message:typing', {
  to: 'recipient-id',
  isTyping: false
});

// Escuchar cuando alguien está escribiendo
socket.on('message:typing', (data) => {
  console.log(`${data.from} está escribiendo:`, data.isTyping);
});
```

### Marcar Mensaje como Leído

```typescript
socket.emit('message:read', 'message-id');

// Escuchar cuando alguien lee tu mensaje
socket.on('message:read', (data) => {
  console.log(`Mensaje ${data.messageId} leído por ${data.readBy}`);
});
```

### Unirse a una Room

```typescript
socket.emit('room:join', 'room-id');

socket.on('room:joined', (data) => {
  console.log('Unido a room:', data.roomId);
  console.log('Usuario que se unió:', data.user);
});
```

### Salir de una Room

```typescript
socket.emit('room:leave', 'room-id');

socket.on('room:left', (data) => {
  console.log('Saliste de room:', data.roomId);
});
```

### Actualizar Presencia

```typescript
socket.emit('presence:update', {
  status: 'online' // 'online' | 'away' | 'offline'
});

// Escuchar cambios de presencia
socket.on('presence:update', (data) => {
  console.log(`Usuario ${data.userId} está ${data.status}`);
});
```

### Notificaciones

```typescript
socket.on('notification', (data) => {
  console.log('Nueva notificación:', data.message);
  console.log('Tipo:', data.type);
  console.log('Datos adicionales:', data.data);
});
```

### Usuarios Conectados/Desconectados

```typescript
socket.on('user:connected', (user) => {
  console.log('Usuario conectado:', user);
});

socket.on('user:disconnected', (userId) => {
  console.log('Usuario desconectado:', userId);
});
```

## Ejemplo Completo: Chat en Tiempo Real

```typescript
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  read: boolean;
}

const ChatComponent = ({ userId, recipientId, token }: {
  userId: string;
  recipientId: string;
  token: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);

  useEffect(() => {
    // Conectar
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Conectado al chat');
    });

    // Escuchar mensajes
    newSocket.on('message:received', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Escuchar typing
    newSocket.on('message:typing', (data) => {
      if (data.from === recipientId) {
        setRecipientTyping(data.isTyping);
      }
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [token, recipientId]);

  const sendMessage = () => {
    if (!socket || !input.trim()) return;

    socket.emit('message:send', {
      from: userId,
      to: recipientId,
      content: input,
      type: 'text'
    });

    setInput('');
  };

  const handleTyping = (typing: boolean) => {
    if (!socket) return;
    setIsTyping(typing);
    socket.emit('message:typing', {
      to: recipientId,
      isTyping: typing
    });
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.from === userId ? 'Tú' : 'Otro'}:</strong>
            {msg.content}
          </div>
        ))}
      </div>

      {recipientTyping && <div>El otro usuario está escribiendo...</div>}

      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (!isTyping) handleTyping(true);
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleTyping(false);
            sendMessage();
          }
        }}
        onBlur={() => handleTyping(false)}
      />

      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
};
```

## Uso desde el Backend

### Enviar Mensaje desde el Backend

```typescript
import { socketService } from '../shared/services/socketService';

// Enviar a un usuario
await socketService.sendMessage({
  id: 'msg-123',
  from: 'user-1',
  to: 'user-2',
  content: 'Mensaje desde el backend',
  type: 'text',
  timestamp: new Date(),
  read: false
});

// Enviar notificación
await socketService.sendNotification(
  'user-id',
  'info',
  'Tienes un nuevo mensaje',
  { messageId: 'msg-123' }
);

// Enviar a múltiples usuarios
await socketService.sendMessageToMany(
  ['user-1', 'user-2', 'user-3'],
  {
    from: 'system',
    content: 'Mensaje para todos',
    type: 'system'
  }
);
```

## Configuración

### Variables de Entorno

Asegúrate de tener configurado:

```env
FRONTEND_ORIGIN=http://localhost:3000
```

Socket.io usa esta variable para configurar CORS.

### Autenticación

Socket.io requiere autenticación JWT. El token se debe enviar en:

```typescript
{
  auth: {
    token: 'JWT_TOKEN'
  }
}
```

O en el header:

```typescript
{
  extraHeaders: {
    Authorization: 'Bearer JWT_TOKEN'
  }
}
```

## Características Implementadas

✅ Autenticación con JWT
✅ Mensajería en tiempo real
✅ Indicador de "escribiendo"
✅ Marcado de mensajes como leídos
✅ Rooms (salas de chat)
✅ Presencia de usuarios (online/offline)
✅ Notificaciones en tiempo real
✅ Broadcast a múltiples usuarios
✅ Manejo de errores
✅ Reconexión automática
✅ TypeScript completo

## Troubleshooting

### Error: "Authentication error: No token provided"

**Solución:** Asegúrate de enviar el token JWT en la conexión:

```typescript
io('http://localhost:5000', {
  auth: { token: 'TU_JWT_TOKEN' }
});
```

### Error de CORS

**Solución:** Verifica que `FRONTEND_ORIGIN` en `.env` coincida con tu URL del frontend.

### No se reciben mensajes

**Solución:** 
1. Verifica que el socket esté conectado: `socket.on('connect', ...)`
2. Verifica que estés escuchando el evento correcto
3. Revisa la consola del servidor para logs

## Próximos Pasos

- Agregar persistencia de mensajes en MongoDB
- Implementar historial de mensajes
- Agregar soporte para archivos/imágenes
- Implementar búsqueda de mensajes
- Agregar encriptación end-to-end (opcional)

