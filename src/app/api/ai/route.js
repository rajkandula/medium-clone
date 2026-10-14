import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateBlogPost, generateTitles, generateExcerpt, generateTags, improveWriting, generateCoverImage } from '@/lib/ai';
import { uploadFile } from '@/lib/upload';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, topic, tone, length, content, instruction, count, style } = await req.json();

    let result;
    switch (action) {
      case 'generate':
        result = await generateBlogPost(topic, tone, length);
        return NextResponse.json({ content: result });
      case 'titles':
        result = await generateTitles(content, count);
        return NextResponse.json({ titles: result });
      case 'excerpt':
        result = await generateExcerpt(content);
        return NextResponse.json({ excerpt: result });
      case 'tags':
        result = await generateTags(content);
        return NextResponse.json({ tags: result });
      case 'improve':
        result = await improveWriting(content, instruction);
        return NextResponse.json({ content: result });
      case 'cover-image': {
        const imageResult = await generateCoverImage(topic || content?.substring(0, 200), style);
        if (!imageResult) return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });

        // Upload to the storage bucket
        const buffer = Buffer.from(imageResult.data, 'base64');
        const ext = imageResult.mimeType.split('/')[1] || 'png';
        const uploaded = await uploadFile(buffer, `ai-cover.${ext}`, imageResult.mimeType, 'covers');
        return NextResponse.json({ url: uploaded.url });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI error:', error);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}

