# Portfolio contact form backend

A Node.js + Express API for a static GitHub Pages portfolio. Sends messages to your inbox with Nodemailer/Gmail SMTP; no database is used.

## 1. Prepare Gmail
Enable 2-Step Verification on the sending Gmail account, then create a Google App Password. Use that 16-character App Password, not your normal Gmail password. If App Passwords are unavailable, use Nodemailer's Gmail OAuth2 setup.

## 2. Deploy on Render
1. Create a separate GitHub repository named `portfolio-contact-backend`.
2. Add `package.json`, `server.js`, and `.gitignore` from this folder. Do not commit `.env` or real secrets.
3. In Render, select **New → Web Service**, connect the backend repository.
4. Build Command: `npm install`. Start Command: `npm start`.
5. Under Render **Environment**, add:
   - `FRONTEND_ORIGIN`: exact origin of your live portfolio, e.g. `https://YOUR-USERNAME.github.io` (or your custom domain origin; no path).
   - `EMAIL_USER`: Gmail account used to send email.
   - `EMAIL_APP_PASSWORD`: the Google App Password.
   - `TO_EMAIL`: inbox where you want to receive messages.
6. Deploy. Open the Render service URL; it should show a JSON message that the API is running.

Free Render services can sleep after inactivity, so the first request may take longer.

## 3. Connect the frontend
1. Replace the URL in `frontend-submit-handler.js` with your actual Render URL plus `/api/contact`.
2. Add this script after the form HTML, or merge its contents into your existing JavaScript file.
3. Remove/replace any existing submit listener for `cform` so the form is not handled twice.
4. Push the frontend change to GitHub Pages.

The handler expects your current form IDs (`cform`, `fbtn`, `fst`) and field names (`name`, `email`, `subject`, `message`, `website`).

## 4. Test
Submit the form from the live website, then check `TO_EMAIL` and Spam. If it fails, inspect Render Logs and check that `FRONTEND_ORIGIN` matches the portfolio origin exactly.

## Security
Never place the Gmail password/App Password in frontend code or GitHub. Keep `.env` ignored by Git. The API includes input validation, a honeypot, basic rate limiting, and CORS restricted to the configured origin. CORS is not authentication; add CAPTCHA or a transactional email provider if spam becomes a problem.
