import { z } from 'zod';

/**
 * Profile & Notifications tools (5 tools)
 */
export function registerProfileTools(server, api) {

  // ─── get_my_profile ───
  server.tool(
    'get_my_profile',
    'Get your full BlogWrite profile including stats (followers, posts, views), bio, interests, social links, and subscription info.',
    {},
    async () => {
      try {
        const data = await api.get('/api/users/me');
        const u = data.user;

        const stats = [
          `📝 Posts: ${u.postsCount || 0}`,
          `👥 Followers: ${u.followersCount || 0}`,
          `👁️ Following: ${u.followingCount || 0}`,
          `📊 Profile Views: ${u.profileViewCount || 0}`,
        ].join('\n');

        const socials = u.socialLinks
          ? Object.entries(u.socialLinks).filter(([, v]) => v).map(([k, v]) => `   ${k}: ${v}`).join('\n')
          : '   None';

        return {
          content: [{
            type: 'text',
            text: `👤 **${u.name}** (@${u.username})\n\n📧 ${u.email}\n${u.bio ? `📋 Bio: ${u.bio}` : ''}\n${u.currentStatus?.text ? `${u.currentStatus.emoji || '🔨'} Status: ${u.currentStatus.text}` : ''}\n\n📊 Stats:\n${stats}\n\n💳 Plan: ${u.subscription?.plan || 'free'}\n🎨 Theme: ${u.preferences?.theme || 'dark'}\n\n🔗 Social Links:\n${socials}\n\n🏷️ Interests: ${(u.interests || []).join(', ') || 'none set'}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load profile: ${error.message}` }] };
      }
    }
  );

  // ─── update_profile ───
  server.tool(
    'update_profile',
    'Update your BlogWrite profile fields — name, bio, about, interests, social links, etc.',
    {
      name: z.string().optional().describe('Display name'),
      bio: z.string().optional().describe('Short bio (max 500 chars)'),
      about: z.string().optional().describe('Long-form about section'),
      interests: z.array(z.string()).optional().describe('Interests/topics (e.g. ["AI", "Web Dev", "Design"])'),
      socialLinks: z.object({
        twitter: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
        youtube: z.string().optional(),
        instagram: z.string().optional(),
      }).optional().describe('Social media links'),
      currentStatus: z.object({
        text: z.string().describe('Status text'),
        emoji: z.string().optional().describe('Status emoji'),
      }).optional().describe('Current status (shown on profile)'),
    },
    async (params) => {
      try {
        const data = await api.put('/api/users/me', params);
        return {
          content: [{
            type: 'text',
            text: `✅ Profile updated!\n\n👤 ${data.user.name} (@${data.user.username})${data.user.bio ? `\n📋 ${data.user.bio}` : ''}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to update profile: ${error.message}` }] };
      }
    }
  );

  // ─── get_notifications ───
  server.tool(
    'get_notifications',
    'Get your latest notifications — likes, comments, follows, and mentions.',
    {},
    async () => {
      try {
        const data = await api.get('/api/notifications');
        const notifications = data.notifications || [];

        if (notifications.length === 0) {
          return { content: [{ type: 'text', text: '🔔 No new notifications.' }] };
        }

        const typeEmoji = {
          like: '❤️',
          comment: '💬',
          follow: '👤',
          mention: '📢',
          subscription: '💳',
          contact_message: '✉️',
          new_post: '📝',
        };

        const list = notifications.map((n, i) => {
          const emoji = typeEmoji[n.type] || '🔔';
          const actor = n.actor?.name || 'Someone';
          const read = n.isRead ? '' : ' 🆕';
          return `${emoji} ${actor} ${n.message || n.type}${read}`;
        }).join('\n');

        const unread = notifications.filter(n => !n.isRead).length;
        return {
          content: [{
            type: 'text',
            text: `🔔 Notifications (${unread} unread):\n\n${list}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load notifications: ${error.message}` }] };
      }
    }
  );

  // ─── mark_notifications_read ───
  server.tool(
    'mark_notifications_read',
    'Mark all your notifications as read.',
    {},
    async () => {
      try {
        await api.put('/api/notifications', { markAllRead: true });
        return {
          content: [{ type: 'text', text: '✅ All notifications marked as read.' }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to mark notifications: ${error.message}` }] };
      }
    }
  );

  // ─── get_user_profile ───
  server.tool(
    'get_user_profile',
    'View any BlogWrite user\'s public profile by username.',
    {
      username: z.string().describe('Username to look up'),
    },
    async ({ username }) => {
      try {
        const data = await api.get(`/api/users/${username}`);
        const u = data.user;

        return {
          content: [{
            type: 'text',
            text: `👤 **${u.name}** (@${u.username})\n\n${u.bio ? `📋 ${u.bio}` : ''}\n📝 Posts: ${u.postsCount || 0}\n👥 Followers: ${u.followersCount || 0}\n${u.currentStatus?.text ? `${u.currentStatus.emoji || '🔨'} ${u.currentStatus.text}` : ''}\n\n🏷️ Interests: ${(u.interests || []).join(', ') || 'none'}`,
          }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `❌ Failed to load user profile: ${error.message}` }] };
      }
    }
  );
}
