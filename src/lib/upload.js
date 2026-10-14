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

function objectKey(filename, folder) {
  const ext = filename.split('.').pop();
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
  const key = objectKey(filename, folder);

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
export async function generatePresignedUrl(filename, contentType, folder = 'uploads') {
  if (!isStorageConfigured) return { key: null, uploadUrl: null, publicUrl: null };
  const key = objectKey(filename, folder);

  const url = await getSignedUrl(storageClient, new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
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
