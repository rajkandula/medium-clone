import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import Notification from '@/models/Notification';
import User from '@/models/User';

/**
 * POST /api/contact
 * Submit a contact message to a user's inbox.
 * Public endpoint — no auth required.
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { recipientId, senderName, senderEmail, subject, message } = body;

    // Validation
    if (!senderName?.trim() || !senderEmail?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Message length guard
    if (message.trim().length > 5000) {
      return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
    }

    // Verify recipient exists (default to first admin)
    let recipient;
    if (recipientId) {
      recipient = await User.findById(recipientId).select('_id name');
    } else {
      recipient = await User.findOne({ role: 'admin' }).select('_id name');
    }

    if (!recipient) {
      return NextResponse.json({ error: 'Support administrator not found.' }, { status: 404 });
    }

    const finalRecipientId = recipient._id;

    // Rate limiting: max 5 messages per email per day to the same user
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await ContactMessage.countDocuments({
      recipient: finalRecipientId,
      senderEmail: senderEmail.toLowerCase().trim(),
      createdAt: { $gte: oneDayAgo },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 }
      );
    }

    // Create the contact message
    const contactMsg = await ContactMessage.create({
      recipient: finalRecipientId,
      senderName: senderName.trim(),
      senderEmail: senderEmail.toLowerCase().trim(),
      subject: subject?.trim() || '',
      message: message.trim(),
    });

    // Create notification for the recipient (non-blocking)
    try {
      await Notification.create({
        recipient: finalRecipientId,
        type: 'contact_message',
        contactMessage: contactMsg._id,
        message: `${senderName.trim()} sent you a message`,
      });
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr.message);
    }

    return NextResponse.json({ success: true, messageId: contactMsg._id });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
