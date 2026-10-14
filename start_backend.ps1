Set-Location "$PSScriptRoot\backend"
if (Test-Path "$PSScriptRoot\venv\Scripts\Activate.ps1") {
    & "$PSScriptRoot\venv\Scripts\Activate.ps1"
}
python -m uvicorn app.main:app --reload
