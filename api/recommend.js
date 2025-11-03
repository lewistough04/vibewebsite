const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, type, recommendation, message } = req.body

    if (!recommendation) {
      return res.status(400).json({ error: 'Recommendation is required' })
    }

    // Format the email content
    const emailSubject = `New ${type === 'music' ? '🎵 Music' : '🎬 Movie'} Recommendation`
    const emailBody = `
New Recommendation Received!

Type: ${type === 'music' ? 'Music' : 'Movie'}
From: ${name || 'Anonymous'}
Recommendation: ${recommendation}
${message ? `\nMessage: ${message}` : ''}

---
Sent from your portfolio website
    `.trim()

    // Option 1: Use a service like Resend (recommended)
    // You'll need to sign up at https://resend.com and get an API key
    if (process.env.RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'recommendations@lewistough.co.uk',
          to: process.env.YOUR_EMAIL || 'your-email@example.com',
          subject: emailSubject,
          text: emailBody
        })
      })

      if (!resendResponse.ok) {
        throw new Error('Failed to send email via Resend')
      }

      return res.status(200).json({ success: true })
    }

    // Option 2: Use Twilio SendGrid (alternative)
    if (process.env.SENDGRID_API_KEY) {
      const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: process.env.YOUR_EMAIL || 'your-email@example.com' }],
            subject: emailSubject
          }],
          from: { 
            email: process.env.FROM_EMAIL || 'noreply@lewistough.co.uk',
            name: 'Portfolio Recommendations'
          },
          content: [{
            type: 'text/plain',
            value: emailBody
          }]
        })
      })

      if (!sgResponse.ok) {
        throw new Error('Failed to send email via SendGrid')
      }

      return res.status(200).json({ success: true })
    }

    // Option 3: Use Twilio SMS (if you prefer text messages)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilioAuth = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64')

      const smsBody = `${emailSubject}\n\nFrom: ${name || 'Anonymous'}\n${recommendation}${message ? `\n\n${message}` : ''}`

      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: process.env.YOUR_PHONE_NUMBER,
            From: process.env.TWILIO_PHONE_NUMBER,
            Body: smsBody
          })
        }
      )

      if (!twilioResponse.ok) {
        throw new Error('Failed to send SMS via Twilio')
      }

      return res.status(200).json({ success: true })
    }

    // If no email/SMS service is configured, log the recommendation
    console.log('New Recommendation:', { name, type, recommendation, message })
    
    // For development: just return success
    return res.status(200).json({ 
      success: true,
      note: 'Email service not configured. Recommendation logged to console.'
    })

  } catch (error) {
    console.error('Error processing recommendation:', error)
    return res.status(500).json({ error: 'Failed to process recommendation' })
  }
}
