import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const user = await User.findById(session.userId).select('-passwordHash').lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { name, username, bio, about, avatar, coverImage, interests, socialLinks, preferences, profileDesign, contactDetails, projects, currentStatus, pinnedPosts, experience } = body;

    const update = {};
    if (name) update.name = name;
    
    if (username) {
      const sanitizedUsername = username.trim().toLowerCase();
      // Validation: 3-30 characters, alphanumeric, hyphens, and underscores only
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(sanitizedUsername)) {
        return NextResponse.json({ error: 'Username must be 3-30 characters and only contain letters, numbers, underscores, or hyphens.' }, { status: 400 });
      }
      
      // Check uniqueness
      const existingUser = await User.findOne({ username: sanitizedUsername });
      if (existingUser && existingUser._id.toString() !== session.userId) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
      update.username = sanitizedUsername;
    }

    if (bio !== undefined) update.bio = bio;
    if (about !== undefined) update.about = about;
    if (avatar !== undefined) update.avatar = avatar;
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (interests) update.interests = interests;
    if (socialLinks) update.socialLinks = socialLinks;
    if (preferences) update.preferences = preferences;
    if (profileDesign) update.profileDesign = profileDesign;
    if (contactDetails) update.contactDetails = contactDetails;
    if (projects) update.projects = projects;
    if (currentStatus !== undefined) update.currentStatus = currentStatus;
    if (pinnedPosts) update.pinnedPosts = pinnedPosts;
    if (experience) update.experience = experience;

    const user = await User.findByIdAndUpdate(session.userId, update, { new: true }).select('-passwordHash');
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
