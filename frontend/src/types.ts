export interface ImageRecord {
  status: string;
  data: {
    image_id: string;
    original_name: string;
    processed_at: string | null;
    metadata: {
      width?: number;
      height?: number;
      format?: string;
      size_bytes?: number;
      caption?: string;
    };
    thumbnails: {
      small?: string;
      medium?: string;
    };
  };
  error: string | null;
}

export interface LightboxImage {
  src: string;
  label: string;
  caption?: string;
  filename?: string;
}
