import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendOTPEmail(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #5fc3ad 0%, #756fb3 100%); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
        .body { padding: 32px; text-align: center; }
        .code-box { background: #f0f9f7; border: 2px solid #5fc3ad; border-radius: 12px; padding: 20px 40px; display: inline-block; margin: 24px 0; }
        .code { font-size: 40px; font-weight: 800; color: #5fc3ad; letter-spacing: 8px; font-family: monospace; }
        .expiry { color: #6b7280; font-size: 13px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
        .university { color: #756fb3; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NinMaHub</h1>
          <p>PPGSMI – Sistema de Templates</p>
        </div>
        <div class="body">
          <p style="color:#374151; font-size:16px;">Seu código de acesso é:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p class="expiry">⏱ Este código expira em <strong>10 minutos</strong></p>
          <p style="color:#6b7280; font-size:13px; margin-top:24px;">
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
        <div class="footer">
          <span class="university">Universidade Franciscana</span><br>
          Programa de Pós-Graduação em Saúde Materno Infantil
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"PPGSMI – NinMaHub" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: `${code} – Seu código de acesso PPGSMI`,
    html,
  })
}
