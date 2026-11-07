"""Private files: player photos and payment receipts (Factory pattern: STORAGE_BACKEND picks the store).

Files are NEVER public: the API checks who is asking (AccessPolicy) and only then answers the file
(local) or a signed URL valid for a few minutes (Supabase Storage, private bucket).
"""
import logging
import mimetypes
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

import httpx
from fastapi import UploadFile
from fastapi.responses import FileResponse, RedirectResponse, Response

import config
from services.errors import BadRequest, ExternalServiceError, NotFound

logger = logging.getLogger("atletico.storage")

ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
# Magic numbers: the content must really be the image type it claims
_SIGNATURES = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),
}
SIGNED_URL_SECONDS = 300


async def read_image(upload: UploadFile) -> tuple[bytes, str]:
    """Reads an uploaded image and checks type and size. Returns (bytes, content type)."""
    content_type = (upload.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise BadRequest("Solo se aceptan imágenes JPG, PNG o WEBP.")
    max_bytes = int(config.MAX_UPLOAD_MB * 1024 * 1024)
    data = await upload.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise BadRequest(f"La imagen pesa más de {config.MAX_UPLOAD_MB:g} MB.")
    if not data or not data.startswith(_SIGNATURES[content_type]):
        raise BadRequest("El archivo no es una imagen válida.")
    return data, content_type


def new_key(folder: str, content_type: str) -> str:
    return f"{folder}/{uuid.uuid4().hex}{ALLOWED_IMAGE_TYPES.get(content_type, '')}"


class FileStorage(ABC):
    @abstractmethod
    def save(self, key: str, data: bytes, content_type: str) -> None: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

    @abstractmethod
    def response(self, key: str) -> Response:
        """The HTTP answer that delivers the file to an already authorized user."""


class LocalStorage(FileStorage):
    def __init__(self, root: str | None = None):
        self.root = Path(root or config.LOCAL_UPLOAD_DIR).resolve()

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if self.root not in path.parents:
            raise NotFound("Archivo no encontrado.")
        return path

    def save(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)

    def response(self, key: str) -> Response:
        path = self._path(key)
        if not path.is_file():
            raise NotFound("Archivo no encontrado.")
        media_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        return FileResponse(path, media_type=media_type, headers={"Cache-Control": "private, max-age=300"})


class SupabaseStorage(FileStorage):
    def __init__(self):
        if not (config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY):
            raise ExternalServiceError("El almacenamiento de archivos no está configurado en el servidor.")
        self.base = f"{config.SUPABASE_URL}/storage/v1"
        self.bucket = config.SUPABASE_BUCKET
        key = config.SUPABASE_SERVICE_KEY
        # New Supabase secret keys (sb_secret_…) go only in "apikey"; the legacy service_role JWT also as Bearer
        self.headers = {"apikey": key} if key.startswith("sb_") else {"apikey": key, "Authorization": f"Bearer {key}"}

    def _call(self, method: str, url: str, **kwargs) -> httpx.Response:
        try:
            response = httpx.request(method, url, headers={**self.headers, **kwargs.pop("headers", {})}, timeout=20, **kwargs)
        except httpx.HTTPError as error:
            logger.exception("Supabase Storage unreachable (%s %s): %s", method, url, error)
            raise ExternalServiceError("No pudimos guardar o leer el archivo. Intenta de nuevo.") from error
        if response.is_error:
            # Supabase explains the problem in the body (bucket not found, invalid key, mime type not allowed…)
            logger.error(
                "Supabase Storage answered %s for %s %s (bucket=%s): %s",
                response.status_code, method, url, self.bucket, response.text[:300],
            )
            raise ExternalServiceError("No pudimos guardar o leer el archivo. Intenta de nuevo.")
        return response

    def save(self, key: str, data: bytes, content_type: str) -> None:
        self._call(
            "POST",
            f"{self.base}/object/{self.bucket}/{key}",
            content=data,
            headers={"Content-Type": content_type, "x-upsert": "true"},
        )

    def delete(self, key: str) -> None:
        self._call("DELETE", f"{self.base}/object/{self.bucket}/{key}")

    def response(self, key: str) -> Response:
        answer = self._call(
            "POST", f"{self.base}/object/sign/{self.bucket}/{key}", json={"expiresIn": SIGNED_URL_SECONDS}
        ).json()
        return RedirectResponse(f"{self.base}{answer['signedURL']}", status_code=307)


_STORES: dict[str, type[FileStorage]] = {"local": LocalStorage, "supabase": SupabaseStorage}


def get_storage() -> FileStorage:
    store_class = _STORES.get(config.STORAGE_BACKEND)
    if store_class is None:
        raise ValueError(f"STORAGE_BACKEND desconocido: {config.STORAGE_BACKEND}")
    return store_class()
