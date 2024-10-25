@echo off
REM Cek apakah Node.js terinstall
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js tidak ditemukan. Pastikan Node.js sudah diinstall.
    exit /b 1
)

REM Jalankan Node.js
echo Menjalankan Node.js di direktori saat ini...
node .

REM Periksa apakah ada kesalahan
if %errorlevel% neq 0 (
    echo Terjadi kesalahan saat menjalankan Node.js.
    exit /b 1
) else (
    echo Node.js dijalankan dengan sukses.
)
