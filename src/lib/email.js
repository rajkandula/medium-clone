// Transactional email (welcome, password reset, subscription) via Harakumo Mail:
// one HARAKUMO_API_KEY, server-side only. Add your own domain in Harakumo → Mail
// to send from it. Without a key, emails are skipped with a warning.

import { SITE_URL } from '@/lib/siteUrl';

const HARAKUMO_BASE_URL = (process.env.HARAKUMO_BASE_URL || 'https://harakumo.com').replace(/\/+$/, '');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function sendMail({ to, subject, html }) {
  const apiKey = process.env.HARAKUMO_API_KEY;
  if (!apiKey) {
    console.warn('[Mail] HARAKUMO_API_KEY is not set — skipping email.');
    return;
  }

  const res = await fetch(`${HARAKUMO_BASE_URL}/api/mail/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, html }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Harakumo mail failed: HTTP ${res.status} ${await res.text()}`);
  }
}

export async function sendWelcomeEmail(email, name) {
  try {
    await sendMail({
      to: email,
      subject: 'Welcome to BlogWrite! 🎉',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e5e5e5; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px;">Welcome to BlogWrite</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px;">Hey ${escapeHtml(name)} 👋</p>
            <p style="font-size: 14px; line-height: 1.7; color: #a3a3a3;">
              We're thrilled to have you join our community of writers and readers.
              Start sharing your stories with the world today.
            </p>
            <a href="${SITE_URL}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Start Writing →
            </a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

export async function sendPasswordResetEmail(email, resetUrl) {
  try {
    await sendMail({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e5e5e5; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Password Reset</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 14px; line-height: 1.7; color: #a3a3a3;">
              You requested a password reset. Click the button below to set a new password.
              This link expires in 1 hour.
            </p>
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Reset Password
            </a>
            <p style="font-size: 12px; color: #737373; margin-top: 24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }
}

export async function sendSubscriptionEmail(email, name, plan) {
  try {
    await sendMail({
      to: email,
      subject: `You're now a ${plan} member! ✨`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #e5e5e5; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Subscription Confirmed!</h1>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 16px;">Hey ${escapeHtml(name)} 🎉</p>
            <p style="font-size: 14px; line-height: 1.7; color: #a3a3a3;">
              Your ${escapeHtml(plan)} plan is now active. Enjoy unlimited posts, AI writing assistant, 
              and advanced analytics.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Failed to send subscription email:', err);
  }
}
