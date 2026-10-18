import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadFile, checkUpload, userFolder, MAX_UPLOAD_BYTES } from '@/lib/upload';

// POST /api/upload — upload one image through the server. Images only, up to
// 10 MB, stored under a known folder and the caller's own user id.
export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const declared = Number(req.headers.get('content-length'));
    if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
      return NextResponse.json({ error: 'Images must be 10 MB or smaller' }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const refused = checkUpload(file.type, file.size);
    if (refused) return NextResponse.json({ error: refused.error }, { status: refused.status });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type, userFolder(formData.get('folder'), session.userId));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
