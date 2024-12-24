import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import authRoutes from "./auth/routes/authRoutes";
import { swaggerOptions } from "./shared/middlewares/swaggerUi.serve";

const app = express();

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/auth", authRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

export default app;
