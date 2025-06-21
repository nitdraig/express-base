import express from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { authController } from "../controllers/authController";

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
router.post("/register", asyncHandler(authController.register));

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
router.post("/login", asyncHandler(authController.login));

router.post("/refresh-token", authController.refreshToken);
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Solicita un restablecimiento de contraseña
 *     description: Solicita un restablecimiento de contraseña para el usuario con correo.
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
 *         description: Restablecimiento de contraseña enviado con éxito
 *       400:
 *         description: Error de validación o usuario no encontrado
 */
router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);
/**
 * @swagger
 * /auth/verify-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verifica el token de activación de cuenta
 *     description: Verifica el token de activación de cuenta para activar un usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario activado con éxito
 *       400:
 *         description: Token inválido o expirado
 */
router.post("/verify-token", authController.verifyToken);

export default router;
