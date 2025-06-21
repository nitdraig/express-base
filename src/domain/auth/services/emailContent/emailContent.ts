export const emailContent = (email: string, activationLink: string) => ` 
 <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
      <h2 style="color: #b8860b;">🔐 Activa tu cuenta</h2>
      <p>Hola <strong>${email}</strong>, gracias por registrarte en <strong>Express Base By Agustin Avellaneda</strong>.</p>
      <p>Haz clic en el siguiente botón para activar tu cuenta:</p>
      <p>
        <a 
          href="${activationLink}" 
          style="display: inline-block; padding: 10px 20px; background-color:rgb(255, 255, 255); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;"
        >
          Activar cuenta
        </a>
      </p>
      <p>Si tú no creaste esta cuenta, puedes ignorar este mensaje.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #888;">
        Este enlace expirará en 24 horas.
      </p>
    </div>
  `;

export const emailResetContent = (resetUrl: string) =>
  `
     <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
      <h2 style="color:rgb(0, 0, 0);">🔑 Restablecimiento de contraseña</h2>
           <p>Hola, Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
      <p>
        <a 
          href="${resetUrl}" 
          style="display: inline-block; padding: 10px 20px; background-color:rgb(0, 0, 0); color: white; text-decoration: none; border-radius: 5px; font-weight: bold;"
        >
          Restablecer contraseña
        </a>
      </p>
      <p>Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #888;">
        Este enlace expirará en 24 horas por motivos de seguridad.
      </p>
    </div>
  `;
