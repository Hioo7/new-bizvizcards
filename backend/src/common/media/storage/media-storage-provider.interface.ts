export interface UploadMediaParams {
  key: string;
  buffer: Buffer;
  contentType: string;
}

export interface MediaStorageProvider {
  upload(params: UploadMediaParams): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
