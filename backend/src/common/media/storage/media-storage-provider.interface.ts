export interface UploadMediaParams {
  key: string;
  buffer: Buffer;
  contentType: string;
}

export interface MediaStorageProvider {
  upload(params: UploadMediaParams): Promise<void>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
