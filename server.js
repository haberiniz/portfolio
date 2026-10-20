require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app = express();
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

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD || !process.env.TO_EMAIL) {
      console.error("Missing email environment variables.");
      return res.status(500).json({ ok: false, message: "Email service is not configured yet." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL,
      replyTo: { name: n, address: e },
      subject: `Portfolio contact: ${s || "New message"}`,
      text: `New portfolio message\\n\\nName: ${n}\\nEmail: ${e}\\nSubject: ${s || "(not provided)"}\\n\\nMessage:\\n${m}`
    });

    return res.json({ ok: true, message: "Message sent successfully." });
  } catch (err) {
    console.error("Contact form error:", err.message);
    return res.status(500).json({ ok: false, message: "Could not send the message. Please try again later." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`Contact API listening on ${PORT}`));
