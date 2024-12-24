import express from "express";
import {
  register,
  login,
  requestPasswordReset,
  resetPasswordHandler,
} from "../controllers/authController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Rutas relacionadas con la autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Registra un nuevo usuario
 *     description: Registra un nuevo usuario con nombre, correo, contraseña y rol.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       201:
 *         description: Usuario registrado con éxito
 *       400:
 *         description: Error de validación o usuario ya existente
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Inicia sesión
 *     description: Inicia sesión usando email y contraseña para obtener un token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token de acceso generado
 *       400:
 *         description: Error de autenticación
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/password-reset:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Solicita un restablecimiento de contraseña
 *     description: Envía un correo con un enlace para restablecer la contraseña.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Correo enviado para restablecer la contraseña
 *       400:
 *         description: Error al procesar la solicitud
 */
router.post("/password-reset", requestPasswordReset);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Restablece la contraseña
 *     description: Utiliza un token para restablecer la contraseña del usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida con éxito
 *       400:
 *         description: Token inválido o expirado
 */
router.post("/reset-password", resetPasswordHandler);

export default router;
