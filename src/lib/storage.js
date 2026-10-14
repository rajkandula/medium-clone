import { S3Client } from '@aws-sdk/client-s3';

/**
 * Media storage: any S3-compatible bucket (uploads, AI cover images).
 *
 *   STORAGE_BUCKET             bucket name
 *   STORAGE_ACCESS_KEY_ID      access key
 *   STORAGE_SECRET_ACCESS_KEY  secret key
 *   STORAGE_ENDPOINT           S3 API endpoint, e.g. https://s3.your-provider.example
 *   STORAGE_PUBLIC_URL         public base URL objects are served from
 *   STORAGE_REGION             optional, defaults to "auto"
 *
 * When any of the first five is missing, storage is off: server-side uploads
 * fail with a clear error and the browser uploader falls back to inline images.
 */

const bucket = process.env.STORAGE_BUCKET;
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
const endpoint = process.env.STORAGE_ENDPOINT;
const publicUrl = process.env.STORAGE_PUBLIC_URL;

export const isStorageConfigured = !!(bucket && accessKeyId && secretAccessKey && endpoint && publicUrl);

export const storageClient = isStorageConfigured
  ? new S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

export const STORAGE_BUCKET = bucket;
export const STORAGE_PUBLIC_BASE = (publicUrl || '').trim().replace(/\/$/, '');
