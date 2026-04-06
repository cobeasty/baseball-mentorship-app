/**
 * AWS S3 helpers for secure private video storage.
 * All videos stored with private ACL; access via presigned URLs only.
 */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function getConfig(): S3Config | null {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!region || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { region, accessKeyId, secretAccessKey, bucket };
}

function makeClient(config: S3Config): S3Client {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function isS3Configured(): boolean {
  return getConfig() !== null;
}

/**
 * Generate a unique S3 storage key for a new video upload.
 * Format: videos/<uuid>/<filename>
 */
export function generateStorageKey(originalFilename: string): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "mp4";
  return `videos/${randomUUID()}.${ext}`;
}

/**
 * Get a presigned PUT URL so the browser can upload directly to S3.
 * Expires in 5 minutes.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const config = getConfig();
  if (!config) throw new Error("S3 not configured — set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET");

  const client = makeClient(config);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: 300 });
}

/**
 * Get a presigned GET URL so an authorised user can stream the video.
 * Expires in 1 hour; intended to be fetched fresh on every view.
 */
export async function getPresignedViewUrl(key: string): Promise<string> {
  const config = getConfig();
  if (!config) throw new Error("S3 not configured");

  const client = makeClient(config);
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/**
 * Delete a video object from S3 (called when a video record is deleted).
 */
export async function deleteS3Object(key: string): Promise<void> {
  const config = getConfig();
  if (!config) return; // silently skip if not configured

  const client = makeClient(config);
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: key })
  );
}
