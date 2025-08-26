import swaggerJsdoc from "swagger-jsdoc";

export const swaggerDocs = swaggerJsdoc({
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Sigii API Docs",
      version: "1.0.0",
      description: "Documentación oficial de la API de Sigii",
    },
  },
  apis: ["./src/**/*.ts"], // Asegúrate de ajustar este patrón
});
