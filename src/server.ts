import dotenv from "dotenv";
import app from "./app";
import mongoose from "mongoose";
import { ENV } from "./shared/config/env";

dotenv.config();

// Configuración de conexión a MongoDB con manejo de reconexión
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.DB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Manejo de eventos de conexión
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Manejo de señales de terminación
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
    process.exit(1);
  }
});

// Iniciar servidor
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(ENV.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${ENV.PORT}`);
      console.log(`📚 Environment: ${ENV.NODE_ENV}`);
      console.log(
        `🔗 API Documentation: http://localhost:${ENV.PORT}/api-docs`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
