import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'GetFittWithMohit <onboarding@resend.dev>'
const COACH_EMAIL = process.env.COACH_EMAIL || 'getfittwithmohit@gmail.com'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Email error:', err)
    return false
  }
}

export async function notifyCoach(subject: string, html: string) {
  return sendEmail({ to: COACH_EMAIL, subject, html })
}