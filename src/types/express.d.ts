export {};

declare global {
  namespace Express {
    /** Usuario autenticado (JWT o Passport); coincide con lo que escribe `authenticate`. */
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}
