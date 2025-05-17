# BreachSignal.io

A lead generation tool and micro-service that offers free breach checks based on user email addresses. It provides a strong trust-based incentive to capture contact details and guide users into deeper security services like audits, monitoring, or consulting.

## Features

- Email breach checking via HaveIBeenPwned API
- Google reCAPTCHA integration for spam protection
- Email notifications using Resend
- Lead tracking with Airtable
- Admin dashboard for lead management
- Dark/light mode support
- Responsive design

## Prerequisites

- Node.js 16.x or later
- HaveIBeenPwned API key
- Resend API key
- Airtable account and API key
- Google reCAPTCHA v2 keys
- Calendly account (for booking security audits)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Keys
HIBP_API_KEY=your_haveibeenpwned_api_key
RESEND_API_KEY=your_resend_api_key
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# URLs
NEXT_PUBLIC_BOOKING_URL=https://calendly.com/your-username/security-audit
```

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/breach-signal-io.git
   cd breach-signal-io
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update the environment variables in `.env.local` with your API keys and configuration.

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Airtable Setup

1. Create a new base in Airtable
2. Create a table named "Leads" with the following fields:
   - Email (Single line text)
   - Name (Single line text)
   - Company (Single line text)
   - Breach Count (Number)
   - Breach Details (Long text)
   - Timestamp (Date)

## Deployment

The project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the environment variables in the Vercel dashboard
4. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 