export interface UploadImageParams {
  key: string;
  buffer: Buffer;
  contentType: string;
}

export interface ImageStorageProvider {
  upload(params: UploadImageParams): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
