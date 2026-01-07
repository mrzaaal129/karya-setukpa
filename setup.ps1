# SETUP SCRIPT - Sistem Manajemen Makalah SETUKPA
# Jalankan script ini untuk setup awal aplikasi

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUKPA - Setup Aplikasi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   ✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "   Alternatively, install PostgreSQL manually." -ForegroundColor Yellow
    $continue = Read-Host "Continue without Docker? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

# Start PostgreSQL with Docker
Write-Host ""
Write-Host "2. Starting PostgreSQL..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "   ✓ PostgreSQL started" -ForegroundColor Green
    Start-Sleep -Seconds 5
} catch {
    Write-Host "   ! Skipping Docker setup" -ForegroundColor Yellow
}

# Install backend dependencies
Write-Host ""
Write-Host "3. Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "   ✓ Backend dependencies installed" -ForegroundColor Green

# Generate Prisma Client
Write-Host ""
Write-Host "4. Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
Write-Host "   ✓ Prisma Client generated" -ForegroundColor Green

# Run migrations
Write-Host ""
Write-Host "5. Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate
Write-Host "   ✓ Database migrated" -ForegroundColor Green

# Seed database
Write-Host ""
Write-Host "6. Seeding database..." -ForegroundColor Yellow
npm run prisma:seed
Write-Host "   ✓ Database seeded" -ForegroundColor Green

# Install frontend dependencies
Write-Host ""
Write-Host "7. Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..
npm install
Write-Host "   ✓ Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "1. Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Yellow
Write-Host "  Super Admin: SA001 / password123" -ForegroundColor White
Write-Host "  Admin:       ADM001 / password123" -ForegroundColor White
Write-Host "  Siswa:       2024001 / password123" -ForegroundColor White
Write-Host ""
