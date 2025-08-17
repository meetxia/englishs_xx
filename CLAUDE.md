# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered English vocabulary learning application that generates engaging Chinese stories to help users memorize English words. The project is a full-stack web application built with Node.js/Express backend and vanilla HTML/CSS/JavaScript frontend.

### Core Architecture

**Backend (Node.js/Express):**
- `server.js` - Main application server with static file serving and API routing
- `db.js` - SQLite database abstraction layer with Promise-based API
- `routes/api.js` - RESTful API endpoints for all application features
- `services/cardGenerator.js` - Puppeteer-based PDF/image generation service

**Frontend (Vanilla JS/HTML/CSS):**
- `public/index.html` - Main application interface
- `public/admin.html` - Administrative backend interface  
- `public/js/main.js` - Core frontend application logic
- `public/js/admin.js` - Administrative interface functionality
- `public/css/styles.css` - Application styling with Tailwind CSS integration

**Database Schema:**
- `categories` - Word categorization system
- `words` - English vocabulary with phonetics, parts of speech, Chinese translations
- `theme_templates` - Story generation templates for different genres
- `settings` - API keys and configuration storage

## Development Commands

### Essential Commands
```bash
# Start development server with auto-reload
npm run dev

# Start production server  
npm start

# Quick health check of core functionality
npm run quick-check

# Test download functionality
npm run test-download

# Install Puppeteer (if missing)
npm run install-puppeteer
```

### Database Operations
The application automatically initializes the SQLite database (`data/words.db`) on startup with required tables and default API keys.

### AI Integration
The application supports multiple AI providers:
- **Qianwen (Alibaba Cloud)** - Primary story generation service
- **DeepSeek-V3** - Alternative story generation service  
- **Google Gemini** - Additional AI service option

API keys are stored in the database `settings` table and can be managed via the admin interface.

## Key Application Features

### Story Generation Modes
1. **爽文带背** - Stories with embedded English words for contextual learning
2. **中英对照** - Bilingual stories with Chinese translations
3. **单词列表** - Vocabulary lists with phonetics and definitions
4. **填空测试** - Interactive fill-in-the-blank exercises

### Audio System
- Oxford Advanced Learner's Dictionary audio files (GB/US pronunciation)
- Fallback TTS synthesis when local audio unavailable
- Audio testing interface at `/audio-test-oxford.html`

### Card Generation System
- Puppeteer-based high-quality PDF/PNG generation
- Server-side rendering for consistent output
- Multiple format support (PNG, JPEG, PDF)
- Preview and download functionality

## Important Architecture Details

### AI Story Generation Flow
1. Frontend sends vocabulary list + theme selection to `/api/generate`
2. Backend retrieves appropriate theme template from database
3. AI service generates story incorporating specified vocabulary
4. Response parsed and formatted into four learning modes
5. Frontend renders interactive learning cards

### Database Design Patterns
- Uses SQLite with Promise-based abstractions in `db.js`
- Foreign key relationships between `words` and `categories`
- Transaction support for bulk operations and data consistency
- Built-in duplicate detection and cleanup operations

### Image Generation Architecture
The `cardGenerator.js` service manages Puppeteer browser instances:
- Singleton pattern for browser reuse across requests
- Automatic browser restart on connection loss
- Memory-optimized PDF/image generation
- Support for custom dimensions and quality settings

### Frontend State Management
- No framework dependencies - pure JavaScript with modern APIs
- Event-driven architecture for UI interactions
- Local storage for user preferences and session data
- Modular JavaScript files for different features

## Common Development Scenarios

### Adding New AI Providers
1. Add API key storage in `db.js` initialization
2. Implement provider logic in `/api/generate` endpoint in `routes/api.js`
3. Update admin interface for API key management
4. Test with story generation workflow

### Database Schema Changes
1. Modify table creation in `db.js` `initTables()` function
2. Handle migration logic for existing databases
3. Update corresponding API endpoints in `routes/api.js`
4. Test with existing data preservation

### Frontend Feature Development
1. Main application features go in `public/js/main.js`
2. Admin features in `public/js/admin.js` (split across multiple part files)
3. Styling via `public/css/styles.css` with Tailwind utility classes
4. Test functionality through browser developer tools

### Audio Integration
- Audio files stored in `data/yinpin/` directory (GB/US subfolders)
- Fallback TTS handled by browser Speech Synthesis API
- Audio testing available at dedicated test page

## File Upload and Data Import

The application supports CSV vocabulary import with intelligent parsing:
- Automatic detection of phonetic notation formats
- Part-of-speech extraction from Chinese definitions
- Category-based organization of imported vocabulary
- Batch operations for large dataset management

## Security Considerations

- API keys encrypted in database storage
- File upload restrictions (10MB limit, temp directory cleanup)
- Input validation on all API endpoints
- CORS properly configured for cross-origin requests

## Testing and Debugging

Use browser developer tools for frontend debugging. Backend logging available via Morgan middleware. The `/api/health` endpoint provides service status checking.

For Puppeteer issues, check browser initialization logs and ensure system dependencies are installed (particularly on Linux servers).