const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

// Simple in-memory rate limiting (resets on cold starts)
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5 // 5 requests per hour per IP

function getRateLimitKey(req) {
  // Use IP address or forwarded IP for rate limiting
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         'unknown'
}

function checkRateLimit(key) {
  const now = Date.now()
  const userRequests = rateLimitMap.get(key) || []
  
  // Remove old requests outside the time window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW)
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false // Rate limit exceeded
  }
  
  recentRequests.push(now)
  rateLimitMap.set(key, recentRequests)
  return true
}

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

  // Rate limiting check
  const rateLimitKey = getRateLimitKey(req)
  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.' 
    })
  }

  try {
    const { name, type, recommendation, message } = req.body

    // Input validation and sanitization
    if (!recommendation || typeof recommendation !== 'string') {
      return res.status(400).json({ error: 'Valid recommendation is required' })
    }

    // Sanitize and validate inputs
    const sanitizedName = name && typeof name === 'string' 
      ? name.trim().slice(0, 100).replace(/[<>]/g, '') 
      : 'Anonymous'
    
    const validTypes = ['music', 'movie']
    const sanitizedType = validTypes.includes(type) ? type : 'music'
    
    const sanitizedRecommendation = recommendation
      .trim()
      .slice(0, 200)
      .replace(/[<>]/g, '')
    
    const sanitizedMessage = message && typeof message === 'string'
      ? message.trim().slice(0, 500).replace(/[<>]/g, '')
      : ''

    // Length validation
    if (sanitizedRecommendation.length < 2) {
      return res.status(400).json({ error: 'Recommendation too short' })
    }

    // Rate limiting check (basic)
    const userAgent = req.headers['user-agent'] || 'unknown'
    const timestamp = Date.now()
    
    // Format the email content (sanitized inputs are used)
    const emailSubject = `New ${sanitizedType === 'music' ? '🎵 Music' : '🎬 Movie'} Recommendation`
    const emailBody = `
New Recommendation Received!

Type: ${sanitizedType === 'music' ? 'Music' : 'Movie'}
From: ${sanitizedName}
Recommendation: ${sanitizedRecommendation}
${sanitizedMessage ? `\nMessage: ${sanitizedMessage}` : ''}

---
Timestamp: ${new Date(timestamp).toISOString()}
User Agent: ${userAgent.slice(0, 100)}
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
