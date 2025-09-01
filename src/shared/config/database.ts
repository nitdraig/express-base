import mongoose from "mongoose";
import { ENV } from "./env";
import { logInfo, logError } from "../utils/logger";

// Configuración avanzada de MongoDB
const mongooseOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0,
  // Configuraciones adicionales para producción
  autoIndex: ENV.NODE_ENV === "development", // Solo en desarrollo
  maxTimeMS: 30000, // Timeout para queries
  // Configuración de replica set (opcional)
  // replicaSet: ENV.MONGODB_REPLICA_SET,
  // readPreference: 'secondaryPreferred',
};

// Eventos de conexión
mongoose.connection.on("connected", () => {
  logInfo("MongoDB conectado exitosamente");
});

mongoose.connection.on("error", (err) => {
  logError("Error de conexión MongoDB:", err);
});

mongoose.connection.on("disconnected", () => {
  logInfo("MongoDB desconectado");
});

// Configuración de índices y validaciones
export const setupDatabase = async () => {
  try {
    await mongoose.connect(ENV.DB_URI, mongooseOptions);

    // Crear índices para mejor performance
    await createIndexes();

    logInfo("Base de datos configurada correctamente");
  } catch (error) {
    logError("Error configurando base de datos:", error);
    process.exit(1);
  }
};

// Crear índices importantes
const createIndexes = async () => {
  try {
    // Índices para usuarios
    const { User } = await import("../../domain/users/models/userModel");
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });

    logInfo("Índices de base de datos creados");
  } catch (error) {
    logError("Error creando índices:", error);
  }
};

// Función para limpiar conexión
export const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    logInfo("Conexión a MongoDB cerrada");
  } catch (error) {
    logError("Error cerrando conexión MongoDB:", error);
  }
};

// Health check de base de datos
export const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return {
      status: states[state as keyof typeof states] || "unknown",
      readyState: state,
      isHealthy: state === 1,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      isHealthy: false,
    };
  }
};

export default mongoose;
