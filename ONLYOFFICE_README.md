# OnlyOffice Document Server

This directory contains the OnlyOffice Document Server configuration.

## Setup

1. Make sure Docker Desktop is running
2. Start OnlyOffice server:
   ```bash
   docker-compose -f docker-compose.onlyoffice.yml up -d
   ```

3. Check if server is running:
   ```bash
   docker-compose -f docker-compose.onlyoffice.yml ps
   ```

4. Access OnlyOffice at: http://localhost:8080

## Directories

- `documents/` - Stores all .docx files created by users
- `templates/` - Stores template .docx files

## API Endpoints

- `GET /api/documents/:id/download` - Download document
- `POST /api/documents/:id/save` - Save document (OnlyOffice callback)
- `POST /api/documents/create` - Create new document
- `GET /api/documents/:id/info` - Get document info
- `DELETE /api/documents/:id` - Delete document

## Troubleshooting

If OnlyOffice is not loading:
1. Check Docker is running: `docker ps`
2. Check logs: `docker-compose -f docker-compose.onlyoffice.yml logs`
3. Restart server: `docker-compose -f docker-compose.onlyoffice.yml restart`
