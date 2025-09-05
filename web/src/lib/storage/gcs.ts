import { Storage } from "@google-cloud/storage";
import type { BlobStorage, SignedUrl, SignDownloadParams, SignUploadParams } from "./index";

// Helper function to get signed URL for file access
export async function getSignedUrl(objectKey: string): Promise<string | null> {
  try {
    const storage = new GCSStorage();
    const signedUrl = await storage.signDownloadURL({ key: objectKey });
    return signedUrl ? signedUrl.url : null;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
}

export class GCSStorage implements BlobStorage {
  private storage: Storage | null = null;
  private bucketName: string | null = null;
  private expiresInSeconds: number | null = null;

  private ensureClient() {
    if (!this.storage) {
      const projectId = process.env.GCP_PROJECT_ID;
      const bucketName = process.env.GCS_BUCKET;
      const raw = process.env.GCP_SA_KEY;
      if (!projectId || !bucketName || !raw) {
        throw new Error("GCS env vars missing: GCP_PROJECT_ID, GCS_BUCKET, GCP_SA_KEY");
      }
      const credentials = typeof raw === "string" && raw.trim().startsWith("{") ? JSON.parse(raw) : (raw as unknown);
      this.storage = new Storage({ projectId, credentials: credentials as Record<string, string> });
      this.bucketName = bucketName;
      this.expiresInSeconds = Number(process.env.GCS_SIGN_URL_EXPIRY ?? 900);
    }
  }

  private getBucket() {
    this.ensureClient();
    return this.storage!.bucket(this.bucketName!);
  }

  async signUploadURL({ key, contentType }: SignUploadParams): Promise<SignedUrl> {
    const file = this.getBucket().file(key);
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + (this.expiresInSeconds! * 1000),
      contentType,
    });
    return { url, key, expiresIn: this.expiresInSeconds! };
  }

  async signDownloadURL({ key }: SignDownloadParams): Promise<SignedUrl | null> {
    const file = this.getBucket().file(key);
    
    // Check if file exists before generating signed URL
    const [exists] = await file.exists();
    if (!exists) {
      // Return null instead of throwing error for missing files
      return null;
    }
    
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + (this.expiresInSeconds! * 1000),
    });
    return { url, key, expiresIn: this.expiresInSeconds! };
  }

  async deleteObject(key: string): Promise<void> {
    await this.getBucket().file(key).delete({ ignoreNotFound: true });
  }

  async putObject(key: string, data: Buffer | Uint8Array | ArrayBuffer, contentType: string): Promise<void> {
    const file = this.getBucket().file(key);
    let buffer: Buffer;
    if (typeof Buffer !== "undefined" && data instanceof Buffer) {
      buffer = data;
    } else if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(data);
    } else {
      buffer = Buffer.from(data as Uint8Array);
    }
    await file.save(buffer, { contentType });
  }
}



