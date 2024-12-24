# Express TypeScript Starter Project

Este repositorio proporciona una base sólida para desarrollar aplicaciones backend utilizando **Express.js** con **TypeScript**, siguiendo buenas prácticas de arquitectura y desarrollo moderno. El proyecto está diseñado para ser modular, seguro y escalable, incluyendo herramientas y patrones comunes que facilitan el desarrollo.

---

## **Tabla de Contenidos**

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Configuración](#instalación-y-configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Dependencias Principales](#dependencias-principales)
- [Características del Proyecto](#características-del-proyecto)
- [Guía de Uso](#guía-de-uso)
- [Roadmap](#roadmap)
- [Contribución](#contribución)

---

## **Estructura del Proyecto**

La arquitectura está organizada en carpetas claras para separar la lógica de negocio, los recursos compartidos y las configuraciones generales:

```
my-express-base/
├── src/
│   ├── domain/            # Lógica de negocio dividida por características
│   │   ├── [FeatureName]/
│   │   │   ├── controllers/   # Controladores para rutas
│   │   │   ├── services/      # Servicios de negocio
│   │   │   ├── routes/        # Definición de rutas
│   │   │   ├── models/        # Modelos de datos
│   ├── shared/            # Recursos reutilizables
│   │   ├── middlewares/   # Middlewares globales
│   │   ├── utils/         # Utilidades comunes
│   ├── app.ts             # Configuración principal de Express
│   ├── server.ts          # Punto de entrada del servidor
├── .env                   # Variables de entorno
├── tsconfig.json          # Configuración de TypeScript
├── package.json           # Dependencias y scripts
├── README.md              # Documentación del proyecto
```

---

## **Instalación y Configuración**

### **1. Requisitos previos**

- Node.js (>= 18.x)
- pnpm (>= 8.x)

### **2. Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/my-express-base.git
cd my-express-base
```

### **3. Instalar dependencias**

```bash
pnpm install
```

### **4. Configurar variables de entorno**

Renombra el archivo `.env.example` a `.env` y actualiza las variables según sea necesario:

```env
PORT=3000
DB_URI=mongodb://localhost:27017/mydatabase
JWT_SECRET=supersecretkey
```

### **5. Iniciar el servidor**

```bash
pnpm dev
```

El servidor estará disponible en `http://localhost:5000`.

---

## **Scripts Disponibles**

### **Desarrollo**

- `pnpm dev`: Inicia el servidor en modo de desarrollo con reinicio automático.

### **Producción**

- `pnpm build`: Compila el proyecto TypeScript a JavaScript en la carpeta `dist/`.
- `pnpm start`: Inicia el servidor con el código compilado.

### **Testing**

- `pnpm test`: Ejecuta las pruebas unitarias con Jest.

---

## **Dependencias Principales**

### **Producción**:

- **express**: Framework minimalista para aplicaciones web.
- **cors**: Habilita solicitudes CORS.
- **helmet**: Mejora la seguridad de la aplicación.
- **dotenv**: Manejo de variables de entorno.
- **mongoose**: ODM para MongoDB.
- **jsonwebtoken**: Generación y validación de tokens JWT.

### **Desarrollo**:

- **typescript**: Soporte para TypeScript.
- **ts-node-dev**: Reinicio automático del servidor en desarrollo.
- **jest**: Framework de pruebas unitarias.
- **@types/...**: Tipos necesarios para las bibliotecas.

---

## **Características del Proyecto**

### **1. Seguridad**

- **Helmet**: Configurado para cabeceras HTTP seguras.
- **CORS**: Permite solicitudes desde orígenes confiables.
- **Protección JWT**: Middleware para autenticación.

### **2. Validación**

- **Joi**: Validación de datos de entrada.

### **3. Manejo de Errores**

- Middleware global para capturar y formatear errores.

### **4. Arquitectura Modular**

- Separación clara de responsabilidades por carpetas y dominios.

### **5. Conexión con Bases de Datos**

- Configuración lista para usar con MongoDB usando Mongoose.

### **6. Documentación con Swagger**

- Endpoints documentados con Swagger.

---

## **Guía de Uso**

### **1. Agregar una nueva característica**

Para agregar una nueva funcionalidad, crea un directorio dentro de `src/domain/[FeatureName]` con las subcarpetas necesarias:

```
src/domain/MyFeature/
├── controllers/
├── routes/
├── services/
├── models/
```

---

## **Roadmap**

Algunas ideas para futuras mejoras:

- [ ] Integrar **Prisma** como alternativa a Mongoose.
- [ ] Agregar soporte para WebSockets.
- [ ] Configurar Docker para despliegue.
- [ ] Implementar una capa de servicios para autorización basada en roles.
- [ ] Configurar un sistema de cacheo con Redis.

---

## **Contribución**

Si deseas contribuir, por favor:

1. Haz un fork del repositorio.
2. Crea una nueva rama:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y haz un commit:
   ```bash
   git commit -m 'Agregada nueva funcionalidad X'
   ```
4. Envía un pull request.

---

¡Gracias por usar este proyecto base! Si tienes preguntas o sugerencias, no dudes en abrir un issue.
