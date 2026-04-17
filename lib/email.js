import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotification(subject, htmlBody) {
  return resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'soma05sekhar@gmail.com',
    subject,
    html: htmlBody,
  })
}
