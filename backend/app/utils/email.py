"""
Utilidades de email usando Resend.
Si RESEND_API_KEY no está configurado, imprime el enlace en consola (modo desarrollo).
"""
import os

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")


def send_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Envía el email de recuperación de contraseña.
    Retorna True si se envió correctamente.
    Si Resend no está configurado, imprime el enlace en consola.
    """
    # ─── Modo consola (desarrollo) ────────────────────────────────────────
    if not RESEND_API_KEY:
        print("=" * 60)
        print("📧 MODO DESARROLLO - Email de recuperación")
        print(f"   Para: {to_email}")
        print(f"   Enlace: {reset_link}")
        print("=" * 60)
        return True

    # ─── Enviar con Resend ────────────────────────────────────────────────
    try:
        import resend
        resend.api_key = RESEND_API_KEY

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
                <tr>
                    <td align="center">
                        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px 40px;text-align:center;">
                                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                                        SaaSManager
                                    </h1>
                                </td>
                            </tr>
                            <!-- Body -->
                            <tr>
                                <td style="padding:40px;">
                                    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;font-weight:600;">
                                        Recuperar contraseña
                                    </h2>
                                    <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                                        Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
                                        Haz clic en el botón de abajo para crear una nueva contraseña.
                                    </p>
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding:8px 0 24px;">
                                                <a href="{reset_link}" 
                                                   style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                                                    Restablecer contraseña
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.5;">
                                        Este enlace expirará en <strong>15 minutos</strong>.
                                    </p>
                                    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.5;">
                                        Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
                                    </p>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                                    <p style="margin:0;color:#94a3b8;font-size:12px;">
                                        © SaaSManager — Este es un correo automático, no responder.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        r = resend.Emails.send({
            "from": RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "Recuperación de contraseña - SaaSManager",
            "html": html_content,
        })

        print(f"📧 Email de recuperación enviado a {to_email} (id: {r.get('id', 'N/A')})")
        return True

    except Exception as e:
        print(f"❌ Error al enviar email de recuperación: {e}")
        # Fallback: imprimir en consola
        print(f"📧 FALLBACK - Enlace de recuperación para {to_email}: {reset_link}")
        return False
