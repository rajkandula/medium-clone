import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateCoverImage } from '@/lib/ai';
import { uploadFile } from '@/lib/upload';

export const maxDuration = 60;

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, style } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const imageResult = await generateCoverImage(prompt, style || 'modern');
    if (!imageResult) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // Upload to the storage bucket
    const buffer = Buffer.from(imageResult.data, 'base64');
    const ext = imageResult.mimeType.split('/')[1] || 'png';
    const filename = `copilot-${Date.now()}.${ext}`;
    const uploaded = await uploadFile(buffer, filename, imageResult.mimeType, 'copilot-images');

    return NextResponse.json({ url: uploaded.url });
  } catch (error) {
    console.error('Copilot image generation error:', error);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}
