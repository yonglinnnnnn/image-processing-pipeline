# Image Processing Pipeline

A full-stack application that accepts image uploads, generates thumbnails, extracts metadata, and produces AI-generated captions — all exposed through a RESTful API.

## Tech Stack

- **Backend:** Python, FastAPI, SQLite3, Pillow, Transformers (BLIP)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Axios

---

## Project Structure

```
image-processing-pipeline/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── images.py        # Image upload & retrieval endpoints
│   │   │   └── stats.py         # Statistics endpoint
│   │   ├── services/
│   │   │   └── image_service.py # Core processing logic
│   │   └── database.py          # SQLite setup & connection
│   ├── tests/
│   ├── uploads/                 # Stored original images
│   ├── thumbnails/              # Generated thumbnails
│   ├── images.db                # SQLite database
│   └── main.py                  # FastAPI app entrypoint
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ui/              # shadcn/ui base components
    │   │   ├── Lightbox.tsx     # Full-screen thumbnail viewer
    │   │   ├── StatusBadge.tsx  # Success/failed/processing badge
    │   │   └── UploadCard.tsx   # File upload UI
    │   ├── lib/
    │   │   └── utils.ts
    │   ├── App.tsx              # Root component, API calls
    │   ├── main.tsx             # React entry point
    │   └── types.ts             # Shared TypeScript types
    └── package.json

```

---

## Installation & Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- pip

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

> **Note:** The BLIP captioning model (`Salesforce/blip-image-captioning-large`) will be downloaded automatically on the first image upload. This may take a few minutes depending on your internet connection.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

The React app features a 3-column layout:

- **Upload panel (left)** — file picker with image preview, supporting JPG/JPEG/PNG. Shows immediate feedback on upload status.
- **Image list (middle)** — displays all processed images with thumbnail previews and status badges. Click any entry to view its details.
- **Detail panel (right)** — shows the selected image's thumbnails, AI caption, and full raw JSON response. Click thumbnails to open the lightbox.
- **Lightbox** — full-screen thumbnail viewer with keyboard navigation (arrow keys, Escape) and a thumbnail strip for switching between small/medium sizes.

---

## Processing Pipeline

When an image is uploaded, the following steps occur:

1. **Extension Validation** — The file extension is checked against the allowed formats (JPG, JPEG, PNG). Invalid extensions are immediately rejected with a `failed` status and a `processed_at` timestamp.
2. **Storage** — The original image is saved to the `uploads/` directory.
3. **Format Validation** — Pillow reads the actual file format to catch mismatches (e.g. a WebP file renamed to `.jpg`). Invalid files are rejected, cleaned up from disk, and recorded as `failed`.
4. **Metadata Extraction** — Width, height, format, and file size are extracted using Pillow.
5. **EXIF Extraction** — EXIF tags are read from the image (if present) and stored as JSON.
6. **Thumbnail Generation** — Two thumbnails are created using `Image.thumbnail()` with LANCZOS resampling:
   - `small`: 150×150 px
   - `medium`: 400×400 px
7. **AI Captioning** — The image is passed through the BLIP large captioning model to generate a natural language description.
8. **Database Update** — All results (metadata, caption, EXIF, processing time) are written to SQLite. The image status is updated to `success` or `failed`.

Steps 4–8 run asynchronously in the background via FastAPI's `BackgroundTasks`. The upload endpoint returns immediately with the image ID and a `processing` status.

---

## API Documentation

All endpoints are prefixed with `/api`. The server runs on `http://localhost:8000` by default.

---

### `POST /api/images`

Upload an image for processing. Processing happens in the background — the endpoint returns immediately with the image ID.

**Request:** `multipart/form-data`

| Field  | Type | Description                       |
| ------ | ---- | --------------------------------- |
| `file` | File | Image file to upload (JPG or PNG) |

**Example:**

```bash
curl -X POST http://localhost:8000/api/images \
  -F "file=@photo.jpg"
```

**Response (success):**

```json
{
  "image_id": "a1b2c3d4",
  "status": "processing"
}
```

**Response (invalid format):**

```json
{
  "image_id": "e5f6g7h8",
  "status": "failed",
  "error": "invalid file format"
}
```

---

### `GET /api/images`

List all images and their current processing status.

**Example:**

```bash
curl http://localhost:8000/api/images
```

**Response:**

```json
[
  {
    "status": "success",
    "data": {
      "image_id": "img123",
      "original_name": "photo.jpg",
      "processed_at": "2024-03-10T10:00:00Z",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "format": "jpg",
        "size_bytes": 2048576,
        "caption": "a dog sitting on a grassy field"
      },
      "thumbnails": {
        "small": "http://localhost:8000/api/images/img123/thumbnails/small",
        "medium": "http://localhost:8000/api/images/img123/thumbnails/medium"
      }
    },
    "error": null
  },
  {
    "status": "failed",
    "data": {
      "image_id": "img789",
      "original_name": "photo.xlsx",
      "processed_at": null,
      "metadata": {},
      "thumbnails": {}
    },
    "error": "invalid file format"
  }
]
```

---

### `GET /api/images/{id}`

Get full details for a specific image, including metadata, caption, and thumbnail URLs.

**Example:**

```bash
curl http://localhost:8000/api/images/img123
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "image_id": "img123",
    "original_name": "photo.jpg",
    "processed_at": "2024-03-10T10:00:00Z",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "size_bytes": 2048576,
      "caption": "a dog sitting on a grassy field"
    },
    "thumbnails": {
      "small": "http://localhost:8000/api/images/img123/thumbnails/small",
      "medium": "http://localhost:8000/api/images/img123/thumbnails/medium"
    }
  },
  "error": null
}
```

**Error (not found):**

```json
{
  "detail": "Image not found"
}
```

---

### `GET /api/images/{id}/thumbnails/{size}`

Returns the actual thumbnail image file. `size` must be either `small` or `medium`.

**Example:**

```bash
curl http://localhost:8000/api/images/img123/thumbnails/small --output small.jpg
curl http://localhost:8000/api/images/img123/thumbnails/medium --output medium.jpg
```

**Response:** JPEG image (`image/jpeg`)

**Errors:**

- `400` — Invalid size (not `small` or `medium`)
- `400` — Image not yet processed
- `404` — Image or thumbnail not found

---

### `GET /api/stats`

Returns overall processing statistics across all images.

**Example:**

```bash
curl http://localhost:8000/api/stats
```

**Response:**

```json
{
  "total": 3,
  "failed": 1,
  "success_rate": "66.67%",
  "average_processing_time_seconds": 12.43
}
```

---

## Running Tests

```bash
cd backend
pytest tests/
```

---

## Notes

- Supported upload formats: **JPG, PNG**
- File format is validated twice — once by extension, and again by Pillow reading the actual file content, preventing misnamed files from slipping through.
- Failed uploads receive a `processed_at` timestamp immediately at the time of rejection.
- The BLIP captioning model requires a working internet connection on first run to download model weights (~1.8 GB).
- All logs are structured with timestamps and log levels via Python's `logging` module.
