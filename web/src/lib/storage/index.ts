export type SignUploadParams = { key: string; contentType: string };
export type SignDownloadParams = { key: string };

export type SignedUrl = { url: string; key: string; expiresIn: number };

export interface BlobStorage {
  signUploadURL(params: SignUploadParams): Promise<SignedUrl>;
  signDownloadURL(params: SignDownloadParams): Promise<SignedUrl>;
  deleteObject(key: string): Promise<void>;
  putObject(key: string, data: Buffer | Uint8Array | ArrayBuffer, contentType: string): Promise<void>;
}


