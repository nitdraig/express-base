export const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Express Base",
      version: "1.0.0",
      description:
        "Documentación de la API de express-base con Express, Swagger UI y TypeScript.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
      },
    ],
  },
  apis: ["./src/auth/routes/*.ts", "./src/auth/controllers/*.ts"],
};
