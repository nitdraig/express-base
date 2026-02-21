import swaggerJsdoc from "swagger-jsdoc";

export const swaggerDocs = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express Base API Docs",
      version: "1.0.0",
      description: "Official documentation of the Express Base API",
    },
  },
  apis: ["./src/**/*.ts"],
});
