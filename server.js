require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 10000;
const allowedOrigin = (process.env.FRONTEND_ORIGIN || "").replace(/\/$/, "");

app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.replace(/\/$/, "") === allowedOrigin) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { ok: false, message: "Too many messages. Please try again later." }
});

app.get("/", (_req, res) => res.json({ ok: true, message: "Portfolio contact API is running." }));

app.post("/api/contact", limiter, async (req, res) => {
  try {
    const { name, email, subject = "", message, website = "" } = req.body || {};
    if (String(website).trim()) return res.status(200).json({ ok: true, message: "Message received." });

    const n = String(name || "").trim();
    const e = String(email || "").trim();
    const s = String(subject || "").trim();
    const m = String(message || "").trim();

    if (!n || !e || !m) return res.status(400).json({ ok: false, message: "Please complete your name, email, and message." });
    if (n.length > 80 || e.length > 120 || s.length > 120 || m.length > 3000)
      return res.status(400).json({ ok: false, message: "One or more fields are too long." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      return res.status(400).json({ ok: false, message: "Please enter a valid email address." });

 if (!process.env.RESEND_API_KEY || !process.env.TO_EMAIL) {
  console.error("Missing Resend environment variables.");
  return res.status(500).json({
    ok: false,
    message: "Email service is not configured yet."
  });
}


    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Portfolio Contact Form <onboarding@resend.dev>",
        to: [process.env.TO_EMAIL],
        reply_to: e,
        subject: `Portfolio contact: ${s || "New message"}`,
        text: `New portfolio message\n\nName: ${n}\nEmail: ${e}\nSubject: ${s || "(not provided)"}\n\nMessage:\n${m}`
      })
    });

    const resendResult = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendResult);
      throw new Error(
        resendResult.message || `Resend API failed with status ${resendResponse.status}`
      );
    }


    return res.json({ ok: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("Contact form error:", err.message);
    return res.status(500).json({ ok: false, message: "Could not send the message. Please try again later." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Contact API listening on ${PORT}`));
