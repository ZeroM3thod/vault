import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
})

export async function sendContactEmail({
  firstName,
  lastName,
  email,
  subject,
  message,
}: {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}) {
  await transporter.sendMail({
    from: `"VaultX Contact" <${process.env.SMTP_EMAIL}>`,
    to: 'ozzyoo554@gmail.com',
    replyTo: email,
    subject: `[VaultX Contact] ${subject}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f1e9; padding: 40px; border-radius: 4px;">
        <div style="background: #1c1c1c; padding: 24px; border-radius: 4px; margin-bottom: 32px;">
          <h1 style="color: #b8935a; font-size: 22px; margin: 0; letter-spacing: 0.05em;">VaultX</h1>
          <p style="color: #f6f1e9; font-size: 13px; margin: 6px 0 0; opacity: 0.7;">New Contact Form Submission</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(184,147,90,0.2); color: #6b6459; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; width: 120px;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(184,147,90,0.2); color: #1c1c1c; font-size: 14px;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(184,147,90,0.2); color: #6b6459; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(184,147,90,0.2); color: #1c1c1c; font-size: 14px;"><a href="mailto:${email}" style="color: #b8935a;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(184,147,90,0.2); color: #6b6459; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Subject</td>
            <td style="padding: 12px 0; border-bottom: 1px solid rgba(184,147,90,0.2); color: #1c1c1c; font-size: 14px;">${subject}</td>
          </tr>
        </table>
        <div style="margin-top: 24px;">
          <p style="color: #6b6459; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">Message</p>
          <div style="background: white; border: 1px solid rgba(184,147,90,0.2); border-radius: 4px; padding: 20px; color: #1c1c1c; font-size: 14px; line-height: 1.8;">${message.replace(/\n/g, '<br>')}</div>
        </div>
        <p style="margin-top: 32px; color: #6b6459; font-size: 11px; text-align: center;">VaultX Platform · ozzyoo554@gmail.com</p>
      </div>
    `,
  })
}
