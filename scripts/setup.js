#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function setupProject() {
  console.log("🚀 Configurando Express Base para tu proyecto...\n");

  try {
    // 1. Obtener información del proyecto
    const projectName = await question("Nombre del proyecto: ");
    const projectDescription = await question("Descripción del proyecto: ");
    const authorName = await question("Nombre del autor: ");
    const authorEmail = await question("Email del autor: ");
    const port =
      (await question("Puerto del servidor (default: 5000): ")) || "5000";
    const databaseName =
      (await question("Nombre de la base de datos (default: myapp): ")) ||
      "myapp";

    // 2. Generar JWT Secret
    const jwtSecret = crypto.randomBytes(32).toString("hex");

    // 3. Crear archivo .env
    const envContent = `# Configuración del servidor
NODE_ENV=development
PORT=${port}
API_URL=http://localhost:${port}

# Base de datos
DB_URI=mongodb://localhost:27017/${databaseName}

# JWT
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
PASSWORD_RESET_EXPIRES_IN=900000

# Frontend
FRONTEND_ORIGIN=http://localhost:3000

# Email (configurar para producción)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Para desarrollo (Ethereal Email)
ETHEREAL_USER=test@ethereal.email
ETHEREAL_PASS=test123

# Opcional: MongoDB Replica Set
# MONGODB_REPLICA_SET=rs0

# Google OAuth (opcional)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret

# Push Notifications (opcional)
# VAPID_PUBLIC_KEY=your-vapid-public-key
# VAPID_PRIVATE_KEY=your-vapid-private-key
`;

    fs.writeFileSync(".env", envContent);

    // 4. Actualizar package.json
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    packageJson.name = projectName.toLowerCase().replace(/\s+/g, "-");
    packageJson.description = projectDescription;
    packageJson.author = `${authorName} <${authorEmail}>`;

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

    // 5. Crear directorios necesarios
    const directories = [
      "uploads",
      "uploads/images",
      "uploads/documents",
      "uploads/videos",
      "uploads/audio",
      "logs",
      "backups",
    ];

    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
      }
    });

    // 6. Crear archivo de configuración de base de datos
    const dbConfigPath = path.join(
      process.cwd(),
      "src",
      "shared",
      "config",
      "database.ts"
    );
    if (!fs.existsSync(dbConfigPath)) {
      console.log(
        "⚠️  Archivo de configuración de base de datos no encontrado. Asegúrate de que existe."
      );
    }

    // 7. Crear script de backup
    const backupScript = `#!/bin/bash
# Script de backup para MongoDB
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${databaseName}"

mkdir -p $BACKUP_DIR

echo "Creando backup de la base de datos..."
mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

echo "Backup completado: $BACKUP_DIR/backup_$DATE"
`;

    fs.writeFileSync("scripts/backup.sh", backupScript);
    fs.chmodSync("scripts/backup.sh", "755");

    // 8. Crear archivo de configuración de PM2
    const pm2Config = {
      apps: [
        {
          name: projectName,
          script: "dist/server.js",
          instances: "max",
          exec_mode: "cluster",
          env: {
            NODE_ENV: "development",
          },
          env_production: {
            NODE_ENV: "production",
          },
          error_file: "./logs/err.log",
          out_file: "./logs/out.log",
          log_file: "./logs/combined.log",
          time: true,
        },
      ],
    };

    fs.writeFileSync(
      "ecosystem.config.js",
      `module.exports = ${JSON.stringify(pm2Config, null, 2)}`
    );

    // 9. Crear archivo de configuración de nginx
    const nginxConfig = `server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir archivos estáticos
    location /uploads/ {
        alias /path/to/your/project/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}`;

    fs.writeFileSync("nginx.conf", nginxConfig);

    // 10. Crear README personalizado
    const readmeContent = `# ${projectName}

${projectDescription}

## 🚀 Instalación

1. **Instalar dependencias:**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **Configurar variables de entorno:**
   El archivo \`.env\` ya está configurado con valores por defecto.

3. **Iniciar en desarrollo:**
   \`\`\`bash
   pnpm dev
   \`\`\`

4. **Build para producción:**
   \`\`\`bash
   pnpm build
   pnpm start
   \`\`\`

## 📁 Estructura del Proyecto

- \`src/domain/\` - Lógica de negocio por características
- \`src/shared/\` - Recursos compartidos (middlewares, utils, etc.)
- \`uploads/\` - Archivos subidos por usuarios
- \`logs/\` - Archivos de log
- \`backups/\` - Backups de base de datos

## 🔧 Scripts Disponibles

- \`pnpm dev\` - Desarrollo con hot reload
- \`pnpm build\` - Compilar TypeScript
- \`pnpm start\` - Iniciar en producción
- \`pnpm test\` - Ejecutar tests
- \`./scripts/backup.sh\` - Crear backup de BD

## 📊 Monitoreo

- Health check: \`GET /health\`
- Métricas: \`GET /analytics\`
- Documentación: \`GET /api-docs\`

## 🔒 Seguridad

- Rate limiting configurado
- Validación de contraseñas robusta
- Sanitización de inputs
- Headers de seguridad con Helmet

## 📧 Email

Configurado para usar SMTP. En desarrollo usa Ethereal Email.

## 📝 Autor

${authorName} - ${authorEmail}
`;

    fs.writeFileSync("README.md", readmeContent);

    console.log("\n🎉 ¡Configuración completada!");
    console.log("\n📋 Próximos pasos:");
    console.log("1. Revisar y ajustar el archivo .env");
    console.log("2. Configurar tu servidor SMTP para emails");
    console.log("3. Ajustar la configuración de nginx si es necesario");
    console.log("4. Ejecutar: pnpm install");
    console.log("5. Ejecutar: pnpm dev");
    console.log("\n📚 Documentación disponible en: /api-docs");
  } catch (error) {
    console.error("❌ Error durante la configuración:", error.message);
  } finally {
    rl.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupProject();
}

module.exports = { setupProject };
