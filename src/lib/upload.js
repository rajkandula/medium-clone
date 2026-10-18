import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageClient, isStorageConfigured, STORAGE_BUCKET, STORAGE_PUBLIC_BASE } from './storage';

// Without a bucket, small images are returned inline as data: URLs so a local
// install works with zero config. Configure storage for anything public.
const INLINE_FALLBACK_MAX_BYTES = 2 * 1024 * 1024;
let warnedInline = false;

function requireStorage() {
  if (!isStorageConfigured) {
    throw new Error('Object storage is not configured (set the STORAGE_* variables).');
  }
}

/** Image types users may upload (no SVG: it can carry scripts), with their extensions. */
export const UPLOAD_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_FOLDERS = ['uploads', 'covers', 'product-screenshots', 'avatars'];

/**
 * Checks an upload request: an allowed image type and a size under the cap.
 * Returns { error, status } when it must be refused, otherwise null.
 */
export function checkUpload(contentType, size) {
  if (!UPLOAD_TYPES[contentType]) return { error: 'Only PNG, JPEG, WebP, GIF or AVIF images can be uploaded', status: 415 };
  if (!Number.isFinite(size) || size <= 0) return { error: 'File size is required', status: 400 };
  if (size > MAX_UPLOAD_BYTES) return { error: 'Images must be 10 MB or smaller', status: 413 };
  return null;
}

/** The storage prefix for a user's upload: a known folder, then their user id. */
export function userFolder(folder, userId) {
  const base = UPLOAD_FOLDERS.includes(folder) ? folder : 'uploads';
  return `${base}/${String(userId).replace(/[^a-zA-Z0-9]/g, '')}`;
}

function objectKey(contentType, folder) {
  const ext = UPLOAD_TYPES[contentType] || 'bin';
  return `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

/**
 * Upload a file buffer to the storage bucket.
 */
export async function uploadFile(buffer, filename, contentType, folder = 'uploads') {
  if (!isStorageConfigured) {
    if (String(contentType).startsWith('image/') && buffer.length <= INLINE_FALLBACK_MAX_BYTES) {
      if (!warnedInline) {
        console.warn('[Upload] STORAGE_* not set: storing images inline as data: URLs.');
        warnedInline = true;
      }
      return { key: null, url: `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}` };
    }
    requireStorage();
  }
  const key = objectKey(contentType, folder);

  await storageClient.send(new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return {
    key,
    url: `${STORAGE_PUBLIC_BASE}/${key}`,
  };
}

/**
 * Generate a presigned URL for direct client upload.
 * Without storage configured this returns { uploadUrl: null } and the
 * browser uploader keeps the image inline instead.
 */
export async function generatePresignedUrl(filename, contentType, folder = 'uploads', size) {
  if (!isStorageConfigured) return { key: null, uploadUrl: null, publicUrl: null };
  const key = objectKey(contentType, folder);

  const url = await getSignedUrl(storageClient, new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
    // Signing the length means the bucket refuses a different-sized body.
    ...(size ? { ContentLength: size } : {}),
  }), { expiresIn: 3600 });

  return { key, uploadUrl: url, publicUrl: `${STORAGE_PUBLIC_BASE}/${key}` };
}

/**
 * Delete a file from the storage bucket.
 */
export async function deleteFile(key) {
  requireStorage();
  await storageClient.send(new DeleteObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
  }));
}
