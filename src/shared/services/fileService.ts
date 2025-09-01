import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { Request } from "express";
import { ENV } from "../config/env";
import { logInfo, logError } from "../utils/logger";

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      file.fieldname || "general"
    );

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filtro de archivos
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Tipos de archivo permitidos
  const allowedTypes = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    video: ["video/mp4", "video/avi", "video/mov"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
  };

  const maxSizes = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 20 * 1024 * 1024, // 20MB
  };

  // Determinar tipo de archivo
  let fileType: keyof typeof allowedTypes | null = null;
  for (const [type, mimes] of Object.entries(allowedTypes)) {
    if (mimes.includes(file.mimetype)) {
      fileType = type as keyof typeof allowedTypes;
      break;
    }
  }

  if (!fileType) {
    cb(new Error("Tipo de archivo no permitido"));
    return;
  }

  // Verificar tamaño
  if (file.size > maxSizes[fileType]) {
    cb(
      new Error(
        `Archivo demasiado grande. Máximo ${maxSizes[fileType] / (1024 * 1024)}MB`
      )
    );
    return;
  }

  cb(null, true);
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
    files: 10, // Máximo 10 archivos
  },
});

// Middlewares específicos por tipo
export const uploadImage = upload.single("image");
export const uploadDocument = upload.single("document");
export const uploadMultiple = upload.array("files", 10);

// Servicio de gestión de archivos
export class FileService {
  // Obtener información del archivo
  async getFileInfo(filePath: string) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logError("Error obteniendo información del archivo:", error);
      throw error;
    }
  }

  // Eliminar archivo
  async deleteFile(filePath: string) {
    try {
      await fs.unlink(filePath);
      logInfo("Archivo eliminado exitosamente", { filePath });
      return true;
    } catch (error) {
      logError("Error eliminando archivo:", error);
      throw error;
    }
  }

  // Mover archivo
  async moveFile(oldPath: string, newPath: string) {
    try {
      await fs.mkdir(path.dirname(newPath), { recursive: true });
      await fs.rename(oldPath, newPath);
      logInfo("Archivo movido exitosamente", { oldPath, newPath });
      return true;
    } catch (error) {
      logError("Error moviendo archivo:", error);
      throw error;
    }
  }

  // Copiar archivo
  async copyFile(sourcePath: string, destPath: string) {
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      logInfo("Archivo copiado exitosamente", { sourcePath, destPath });
      return true;
    } catch (error) {
      logError("Error copiando archivo:", error);
      throw error;
    }
  }

  // Generar URL pública
  generatePublicUrl(filename: string, type: string = "general") {
    return `${ENV.API_URL}/uploads/${type}/${filename}`;
  }

  // Validar archivo
  validateFile(file: Express.Multer.File) {
    const errors: string[] = [];

    if (!file) {
      errors.push("No se proporcionó ningún archivo");
      return errors;
    }

    // Verificar tamaño
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      errors.push(
        `Archivo demasiado grande. Máximo ${maxSize / (1024 * 1024)}MB`
      );
    }

    // Verificar tipo MIME
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "video/mp4",
      "video/avi",
      "video/mov",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      errors.push("Tipo de archivo no permitido");
    }

    return errors;
  }

  // Limpiar archivos temporales
  async cleanupTempFiles(
    directory: string,
    maxAge: number = 24 * 60 * 60 * 1000
  ) {
    try {
      const files = await fs.readdir(directory);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logInfo("Archivo temporal eliminado", { filePath });
        }
      }
    } catch (error) {
      logError("Error limpiando archivos temporales:", error);
    }
  }
}

// Instancia singleton
export const fileService = new FileService();

// Middleware para manejar errores de upload
export const handleUploadError = (
  error: any,
  req: Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "Archivo demasiado grande",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Demasiados archivos",
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next(error);
};
