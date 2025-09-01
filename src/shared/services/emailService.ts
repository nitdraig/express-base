import nodemailer from "nodemailer";
import { ENV } from "../config/env";
import { logInfo, logError } from "../utils/logger";

// Configuración del transportador de email
const createTransporter = () => {
  // Para desarrollo, usar Ethereal Email
  if (ENV.NODE_ENV === "development") {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: ENV.ETHEREAL_USER || "test@ethereal.email",
        pass: ENV.ETHEREAL_PASS || "test123",
      },
    });
  }

  // Para producción, usar configuración real
  return nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: parseInt((ENV.SMTP_PORT as any) || "587"),
    secure: (ENV.SMTP_SECURE as any) === "true",
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
  });
};

// Templates de email
const emailTemplates = {
  welcome: (userName: string, activationLink: string) => ({
    subject: "¡Bienvenido a nuestra plataforma!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b4c7e;">¡Bienvenido ${userName}!</h2>
        <p>Gracias por registrarte en nuestra plataforma. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <a href="${activationLink}" style="background-color: #2b4c7e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Activar Cuenta
        </a>
        <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
      </div>
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: "Restablecimiento de Contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2b4c7e;">Restablecimiento de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetLink}" style="background-color: #2b4c7e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer Contraseña
        </a>
        <p>Este enlace expirará en 15 minutos por seguridad.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      </div>
    `,
  }),

  accountLocked: (userName: string, unlockTime: string) => ({
    subject: "Cuenta Temporalmente Bloqueada",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Cuenta Bloqueada</h2>
        <p>Hola ${userName},</p>
        <p>Tu cuenta ha sido temporalmente bloqueada debido a múltiples intentos de inicio de sesión fallidos.</p>
        <p>Tu cuenta se desbloqueará automáticamente el: <strong>${unlockTime}</strong></p>
        <p>Si no fuiste tú quien intentó acceder, te recomendamos cambiar tu contraseña.</p>
      </div>
    `,
  }),

  securityAlert: (userName: string, loginInfo: any) => ({
    subject: "Alerta de Seguridad - Nuevo Inicio de Sesión",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">Alerta de Seguridad</h2>
        <p>Hola ${userName},</p>
        <p>Se detectó un nuevo inicio de sesión en tu cuenta:</p>
        <ul>
          <li><strong>Fecha:</strong> ${loginInfo.date}</li>
          <li><strong>IP:</strong> ${loginInfo.ip}</li>
          <li><strong>Dispositivo:</strong> ${loginInfo.userAgent}</li>
        </ul>
        <p>Si no fuiste tú, contacta inmediatamente con soporte.</p>
      </div>
    `,
  }),
};

// Servicio principal de email
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = createTransporter();
  }

  // Enviar email genérico
  async sendEmail(to: string, subject: string, html: string, from?: string) {
    try {
      const mailOptions = {
        from: from || ENV.SMTP_FROM || "noreply@tuapp.com",
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logInfo("Email enviado exitosamente", {
        to,
        subject,
        messageId: result.messageId,
      });
      return result;
    } catch (error) {
      logError("Error enviando email:", error);
      throw error;
    }
  }

  // Enviar email de bienvenida
  async sendWelcomeEmail(to: string, userName: string, activationLink: string) {
    const template = emailTemplates.welcome(userName, activationLink);
    return this.sendEmail(to, template.subject, template.html);
  }

  // Enviar email de reset de contraseña
  async sendPasswordResetEmail(to: string, resetLink: string) {
    const template = emailTemplates.passwordReset(resetLink);
    return this.sendEmail(to, template.subject, template.html);
  }

  // Enviar alerta de cuenta bloqueada
  async sendAccountLockedEmail(
    to: string,
    userName: string,
    unlockTime: string
  ) {
    const template = emailTemplates.accountLocked(userName, unlockTime);
    return this.sendEmail(to, template.subject, template.html);
  }

  // Enviar alerta de seguridad
  async sendSecurityAlertEmail(to: string, userName: string, loginInfo: any) {
    const template = emailTemplates.securityAlert(userName, loginInfo);
    return this.sendEmail(to, template.subject, template.html);
  }

  // Verificar conexión SMTP
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logInfo("Conexión SMTP verificada correctamente");
      return true;
    } catch (error) {
      logError("Error verificando conexión SMTP:", error);
      return false;
    }
  }
}

// Instancia singleton
export const emailService = new EmailService();

// Función de conveniencia para compatibilidad
export const sendEmail = (to: string, subject: string, html: string) => {
  return emailService.sendEmail(to, subject, html);
};
