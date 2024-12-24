export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const getTokenFromHeaders = (headers: any): string | null => {
  const header = headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }
  return null;
};
