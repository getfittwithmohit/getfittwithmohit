// Email to Coach Mohit when a new client submits onboarding
export function coachNotificationEmail(clientData: {
  full_name: string
  email: string
  phone: string
  city: string
  primary_goal: string
  readiness_score: string
  fitness_level: string
}) {
  return {
    subject: `New client onboarded — ${clientData.full_name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        
        <div style="background: #1a1f3a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00d4d4; font-size: 16px; font-weight: 500; letter-spacing: 2px; margin: 0 0 4px;">
            GETFITTWITHMOHIT
          </h1>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
            Transform to Inspire
          </p>
        </div>

        <h2 style="color: #0f172a; font-size: 20px; font-weight: 500; margin: 0 0 8px;">
          New client onboarded 🎉
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
          A new client has completed their onboarding form and is ready for their first Lifestyle & Routine Audit Consultation.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #94a3b8; font-size: 10px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 16px;">
            Client Details
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 40%;">Name</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.full_name}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Email</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.email}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Phone</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.phone || '–'}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">City</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.city || '–'}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Primary goal</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.primary_goal || '–'}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Fitness level</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.fitness_level || '–'}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Readiness score</td>
              <td style="padding: 8px 0; color: #00d4d4; font-size: 16px; font-weight: 500;">${clientData.readiness_score || '–'} / 10</td>
            </tr>
          </table>
        </div>

        <div style="background: #1a1f3a; border-radius: 10px; padding: 16px; text-align: center;">
          <p style="color: #00d4d4; font-size: 12px; font-weight: 500; letter-spacing: 1px; margin: 0;">
            TRANSFORM TO INSPIRE
          </p>
        </div>

      </div>
    `,
  }
}

// Confirmation email to client
export function clientConfirmationEmail(clientName: string) {
  return {
    subject: `Welcome to GetFittWithMohit — you're all set!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">

        <div style="background: #1a1f3a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00d4d4; font-size: 16px; font-weight: 500; letter-spacing: 2px; margin: 0 0 4px;">
            GETFITTWITHMOHIT
          </h1>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
            Transform to Inspire
          </p>
        </div>

        <h2 style="color: #0f172a; font-size: 20px; font-weight: 500; margin: 0 0 8px;">
          Thank you, ${clientName}! 🎉
        </h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Your onboarding profile has been received. Coach Mohit will review everything within 24 hours and reach out to schedule your first <strong style="color: #0f172a;">Lifestyle & Routine Audit Consultation</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #94a3b8; font-size: 10px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 12px;">
            What happens next
          </h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 24px; height: 24px; background: #00d4d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #1a1f3a; font-size: 12px; font-weight: 600;">1</div>
              <p style="color: #64748b; font-size: 13px; margin: 0; padding-top: 3px;">Coach Mohit reviews your profile — within 24 hours</p>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 24px; height: 24px; background: #00d4d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #1a1f3a; font-size: 12px; font-weight: 600;">2</div>
              <p style="color: #64748b; font-size: 13px; margin: 0; padding-top: 3px;">He reaches out to schedule your first consultation call</p>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="width: 24px; height: 24px; background: #00d4d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #1a1f3a; font-size: 12px; font-weight: 600;">3</div>
              <p style="color: #64748b; font-size: 13px; margin: 0; padding-top: 3px;">Your personalised programme is designed — just for you</p>
            </div>
          </div>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 16px;">
          Questions? WhatsApp Coach Mohit directly.
        </p>

        <div style="background: #1a1f3a; border-radius: 10px; padding: 16px; text-align: center;">
          <p style="color: #00d4d4; font-size: 12px; font-weight: 500; letter-spacing: 1px; margin: 0;">
            TRANSFORM TO INSPIRE
          </p>
        </div>

      </div>
    `,
  }
}

// Weekly check-in notification to coach
export function checkinNotificationEmail(clientData: {
  full_name: string
  week_number: number
  workouts_completed: number
  nutrition_adherence: number
  energy_level: number
  mood: string
  biggest_win: string
  biggest_challenge: string
  needs_from_coach: string[]
}) {
  return {
    subject: `Weekly check-in — ${clientData.full_name} (Week ${clientData.week_number})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">

        <div style="background: #1a1f3a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00d4d4; font-size: 16px; font-weight: 500; letter-spacing: 2px; margin: 0 0 4px;">
            GETFITTWITHMOHIT
          </h1>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">
            Weekly Check-In
          </p>
        </div>

        <h2 style="color: #0f172a; font-size: 20px; font-weight: 500; margin: 0 0 4px;">
          ${clientData.full_name}
        </h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
          Week ${clientData.week_number} check-in submitted
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: #94a3b8; font-size: 10px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 16px;">
            This Week's Numbers
          </h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 50%;">Workouts completed</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.workouts_completed} / 6</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Nutrition adherence</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.nutrition_adherence} / 10</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Energy level</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 500;">${clientData.energy_level} / 10</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Mood</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 18px;">${clientData.mood || '–'}</td>
            </tr>
          </table>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
          <p style="color: #166534; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Biggest Win</p>
          <p style="color: #0f172a; font-size: 13px; margin: 0;">${clientData.biggest_win || '–'}</p>
        </div>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
          <p style="color: #991b1b; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Biggest Challenge</p>
          <p style="color: #0f172a; font-size: 13px; margin: 0;">${clientData.biggest_challenge || '–'}</p>
        </div>

        ${clientData.needs_from_coach?.length > 0 ? `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #1e40af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Needs From You</p>
          <p style="color: #0f172a; font-size: 13px; margin: 0;">${clientData.needs_from_coach.join(', ')}</p>
        </div>
        ` : ''}

        <div style="background: #1a1f3a; border-radius: 10px; padding: 16px; text-align: center;">
          <p style="color: #00d4d4; font-size: 12px; font-weight: 500; letter-spacing: 1px; margin: 0;">
            TRANSFORM TO INSPIRE
          </p>
        </div>

      </div>
    `,
  }
}