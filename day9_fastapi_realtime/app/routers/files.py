from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.config import settings
from app.services.connection_manager import manager
from app.services.image_service import ImageValidationError, process_image

router = APIRouter(tags=["files"])


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...)) -> dict[str, object]:
    try:
        filename, width, height = await process_image(file)
    except ImageValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await manager.broadcast(
        {
            "type": "file_uploaded",
            "message": f"New image uploaded: {filename}",
            "filename": filename,
        }
    )

    return {
        "filename": filename,
        "url": f"/api/uploads/{filename}",
        "width": width,
        "height": height,
    }


@router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str) -> FileResponse:
    safe_name = settings.upload_dir / filename
    if safe_name.parent != settings.upload_dir or not safe_name.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(safe_name)
