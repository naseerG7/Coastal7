from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError

from app.config import settings


class ImageValidationError(ValueError):
    """Raised when an uploaded file is not an acceptable image."""


async def process_image(upload: UploadFile) -> tuple[str, int, int]:
    if upload.content_type not in settings.allowed_image_types:
        raise ImageValidationError("Only JPEG, PNG, and WebP images are allowed.")

    data = await upload.read(settings.max_upload_size + 1)
    if len(data) > settings.max_upload_size:
        raise ImageValidationError("Image exceeds the 5 MB upload limit.")

    try:
        image = Image.open(BytesIO(data))
        image.verify()
        image = Image.open(BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageValidationError("Uploaded file is not a valid image.") from exc

    image.thumbnail((settings.max_image_width, settings.max_image_height))

    suffix = ".jpg" if image.format == "JPEG" else ".png"
    filename = f"{uuid4().hex}{suffix}"
    destination = settings.upload_dir / filename

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")

    if suffix == ".jpg" and image.mode == "RGBA":
        image = image.convert("RGB")

    image.save(destination, format="JPEG" if suffix == ".jpg" else "PNG", optimize=True)

    return filename, image.width, image.height
