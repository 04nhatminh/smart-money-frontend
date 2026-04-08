export interface CloudinarySuccessResponse {
  public_id: string;
  url: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  duration?: number;
}

export interface CloudinaryErrorResponse {
  error: {
    message: string;
  };
}

export interface UploadToCloudinaryResponse {
  fileUrl: string;
  publicId: string;
}

export interface SaveReceiptPayload {
  imageUrl: string;
  publicId: string;
}

export interface ReceiptResponse {
  id: string;
  imageUrl: string;
  publicId: string;
  createdAt: string;
}