# Day 9 — FastAPI File Uploads + WebSockets + Testing

A production-style learning project combining secure image uploads, Pillow processing,
WebSockets, automated tests, coverage, and Python code-quality tooling.

## Features

- `UploadFile` image uploads
- Content-type and actual-image validation with Pillow
- 5 MB upload limit
- Image resizing to a maximum of 1600×1600
- UUID-based filenames
- Static uploaded-file serving
- WebSocket notification endpoint
- Connection manager with broadcast support
- Pytest + TestClient tests
- WebSocket integration test
- 80% minimum coverage
- Black, isort, Flake8, mypy
- pre-commit configuration

## Run in VS Code

### 1. Create a virtual environment

Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Start FastAPI

```bash
uvicorn app.main:app --reload
```

Open:

- API docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## Test

```bash
pytest
coverage run -m pytest
coverage report
```

The project is configured to fail coverage reporting below 80%.

## Code quality

```bash
black .
isort .
flake8 .
mypy app
pre-commit install
pre-commit run --all-files
```

## WebSocket

Connect a client to:

```text
ws://127.0.0.1:8000/ws/notifications
```

Send text and all currently connected clients receive a JSON message.

## Upload flow

`POST /api/upload`

The server:

1. checks the declared MIME type;
2. limits the uploaded bytes;
3. verifies that the bytes are a real image;
4. resizes the image;
5. writes it using a generated filename;
6. broadcasts a WebSocket notification;
7. returns the filename, dimensions, and URL.

## Day 9 architecture

```text
app/
├── main.py
├── config.py
├── routers/
│   ├── files.py
│   ├── notifications.py
│   └── websocket.py
├── services/
│   ├── image_service.py
│   └── connection_manager.py
└── tests/
    ├── conftest.py
    ├── test_health.py
    ├── test_uploads.py
    └── test_websocket.py
```

## Git checkpoint

After verifying everything:

```bash
git init
git add .
git commit -m "feat: complete day 9 realtime upload feature"
```

Then continue development from this checkpoint.
