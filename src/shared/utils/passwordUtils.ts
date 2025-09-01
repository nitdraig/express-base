export const validatePassword = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Verificar longitud mínima
  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  // Verificar longitud máxima
  if (password.length > 128) {
    errors.push("La contraseña no puede exceder 128 caracteres");
  }

  // Verificar que contenga al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula");
  }

  // Verificar que contenga al menos una letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula");
  }

  // Verificar que contenga al menos un número
  if (!/\d/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }

  // Verificar que contenga al menos un carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("La contraseña debe contener al menos un carácter especial");
  }

  // Verificar que no contenga espacios
  if (/\s/.test(password)) {
    errors.push("La contraseña no puede contener espacios");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isPasswordStrong = (password: string): boolean => {
  return validatePassword(password).isValid;
};
