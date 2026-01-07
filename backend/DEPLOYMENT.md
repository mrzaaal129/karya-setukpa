# Panduan Deployment Production
## Sistem Manajemen Makalah Digital SETUKPA

---

## 🚀 Quick Start

```bash
# 1. Build aplikasi
npm run build

# 2. Start dengan PM2 (Cluster Mode)
npm run start:prod

# 3. Lihat status
npm run status:prod
```

---

## 📋 Environment Variables

Buat file `.env.production`:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-secret-key-minimum-32-chars
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://user:password@localhost:5432/setukpa
CORS_ORIGIN=https://yourdomain.com

# Redis (Optional - aplikasi tetap jalan tanpa Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

---

## 🔧 PM2 Commands

| Command | Fungsi |
|---------|--------|
| `npm run start:prod` | Start semua instances |
| `npm run stop:prod` | Stop semua instances |
| `npm run restart:prod` | Restart tanpa downtime |
| `npm run logs:prod` | Lihat logs real-time |
| `npm run status:prod` | Lihat status instances |

---

## 💾 Redis Caching

Redis **OPSIONAL** - aplikasi tetap berjalan tanpa Redis.

### Install Redis di Server:

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl enable redis
sudo systemctl start redis
```

**Windows (untuk development):**
Download dari: https://github.com/microsoftarchive/redis/releases

### Test Koneksi:
```bash
redis-cli ping
# Output: PONG
```

### Data yang di-cache:
- Dashboard stats (1 menit)
- User list (5 menit)
- Assignment list (5 menit)

---

## 📊 Kapasitas (Estimasi)

| Setup | Users | Response Time |
|-------|-------|---------------|
| Tanpa PM2, tanpa Redis | ~200 | 200ms |
| PM2 Cluster (4 core) | ~1500 | 200ms |
| PM2 + Redis | ~3000+ | 20ms |

---

## 🖥️ Rekomendasi Server

### Untuk 2000 User:

```
VPS: 4 CPU, 4GB RAM
Redis: 256MB (bagian dari RAM server)
Database: 2GB RAM
Storage: 50GB SSD
```

**Provider (estimasi harga):**
- DigitalOcean: $24/bulan
- Vultr: $20/bulan

---

## 🔄 Zero-Downtime Deployment

```bash
git pull origin main
npm run build
npm run restart:prod
```

