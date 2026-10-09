/**
 * MailCraft AI — Backend Email Server
 * Express server with Nodemailer for sending emails via Gmail SMTP.
 *
 * SETUP:
 *   1. Go to https://myaccount.google.com/apppasswords
 *   2. Generate a new App Password for "Mail"
 *   3. Create a .env file (or set environment variables) with:
 *        GMAIL_USER=your.email@gmail.com
 *        GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *   4. Run: node server.js
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Load .env manually (simple parser, no dotenv dependency needed)
function loadEnv() {
  const envPath = new URL('./.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Gmail credentials from environment
let gmailUser = process.env.GMAIL_USER || '';
let gmailPass = process.env.GMAIL_APP_PASSWORD || '';

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configured: !!(gmailUser && gmailPass),
    email: gmailUser ? gmailUser.replace(/(.{2}).*(@.*)/, '$1***$2') : 'not set'
  });
});

/**
 * Configure credentials at runtime (via Settings modal)
 */
app.post('/api/configure', (req, res) => {
  const { email, appPassword } = req.body;

  if (!email || !appPassword) {
    return res.status(400).json({ error: 'Both email and appPassword are required' });
  }

  // Basic validation
  if (!email.includes('@gmail.com') && !email.includes('@googlemail.com')) {
    return res.status(400).json({ error: 'Please provide a Gmail address (e.g., you@gmail.com)' });
  }

  gmailUser = email.trim();
  // Strip spaces — Google shows App Passwords as "xxxx xxxx xxxx xxxx" but SMTP needs no spaces
  gmailPass = appPassword.trim().replace(/\s+/g, '');

  // Save to .env for persistence across restarts
  try {
    const envPath = new URL('./.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    const envContent = `# Gmail SMTP Configuration\nGMAIL_USER=${gmailUser}\nGMAIL_APP_PASSWORD=${gmailPass}\n`;
    writeFileSync(envPath, envContent, 'utf-8');
    console.log(`💾 Saved Gmail credentials to .env`);
  } catch (err) {
    console.warn('Could not write .env file:', err.message);
  }

  console.log(`✅ Gmail credentials configured for: ${gmailUser}`);

  res.json({
    success: true,
    message: `Configured for ${gmailUser.replace(/(.{2}).*(@.*)/, '$1***$2')}`,
    email: gmailUser.replace(/(.{2}).*(@.*)/, '$1***$2')
  });
});

/**
 * Send Email Endpoint
 */
app.post('/api/send', async (req, res) => {
  const { to, subject, body, html, senderName } = req.body;

  // Validation
  if (!to || !subject || !body) {
    return res.status(400).json({
      error: 'Missing required fields: to, subject, body'
    });
  }

  if (!gmailUser || !gmailPass) {
    return res.status(400).json({
      error: 'Gmail SMTP is not configured. Please set your Gmail credentials in Settings first.',
      hint: 'Use the Settings modal in the app or create a .env file with GMAIL_USER and GMAIL_APP_PASSWORD.'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: `Invalid recipient email address: ${to}` });
  }

  try {
    // Strip spaces from password just in case user copy-pasted with spaces
    const cleanPass = (gmailPass || '').replace(/\s+/g, '');

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection before sending
    await transporter.verify();

    // Build mail options
    const mailOptions = {
      from: senderName ? `"${senderName}" <${gmailUser}>` : gmailUser,
      to: to,
      subject: subject,
      text: body,
    };

    // Include HTML version if provided
    if (html) {
      mailOptions.html = html;
    }

    // Send!
    const info = await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent to ${to} | Message ID: ${info.messageId}`);

    res.json({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: info.messageId,
      accepted: info.accepted
    });

  } catch (error) {
    console.error('❌ Send error:', error.code, error.message);

    let userMessage = 'Failed to send email.';
    let hint = '';

    if (error.code === 'EAUTH' || (error.responseCode >= 500 && error.responseCode < 600)) {
      userMessage = 'Gmail authentication failed — your App Password is incorrect or expired.';
      hint = 'Steps to fix: (1) Go to myaccount.google.com → Security → 2-Step Verification → ON. (2) Then go to myaccount.google.com/apppasswords → Create a new App Password for "Mail". (3) Enter the new 16-character code (without spaces) in Settings.';
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      userMessage = 'Could not connect to Gmail SMTP. Check your internet connection.';
      hint = 'Make sure you are connected to the internet and not behind a firewall blocking port 465.';
    } else if (error.responseCode === 550 || error.responseCode === 553) {
      userMessage = `Recipient address rejected by Gmail: ${to}`;
      hint = 'Check that the recipient email address is valid.';
    } else if (error.code === 'EENVELOPE') {
      userMessage = `Invalid email address: ${to}`;
    } else {
      userMessage = error.message || 'Unknown error occurred while sending.';
    }

    res.status(500).json({
      error: userMessage,
      hint,
      code: error.code,
      details: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 MailCraft AI Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);

  if (gmailUser && gmailPass) {
    console.log(`✅ Gmail SMTP configured for: ${gmailUser.replace(/(.{2}).*(@.*)/, '$1***$2')}`);
  } else {
    console.log(`⚠️  Gmail not configured yet. Set credentials via:`);
    console.log(`   • Settings modal in the app, OR`);
    console.log(`   • Create .env file with GMAIL_USER and GMAIL_APP_PASSWORD`);
  }
  console.log('');
});
