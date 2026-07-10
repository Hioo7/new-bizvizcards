export interface InternalRedirect {
  id: string;
  sourcePath: string;
  targetPath: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalRedirect {
  id: string;
  sourcePath: string;
  destinationUrl: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestrictedPath {
  id: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInternalRedirectPayload {
  sourcePath: string;
  targetPath: string;
  enabled?: boolean;
}

export interface UpdateInternalRedirectPayload {
  sourcePath?: string;
  targetPath?: string;
  enabled?: boolean;
}

export interface CreateExternalRedirectPayload {
  sourcePath: string;
  destinationUrl: string;
  enabled?: boolean;
}

export interface UpdateExternalRedirectPayload {
  sourcePath?: string;
  destinationUrl?: string;
  enabled?: boolean;
}

export interface CreateRestrictedPathPayload {
  path: string;
}
