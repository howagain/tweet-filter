# Tweet Filter

AI-powered tweet curation and relevance scoring for staying on the cutting edge.

## Goals
- 🆕 **Tool Discovery** — Find new tools & frameworks to test
- ⚡ **Cutting Edge Intel** — Track novel approaches that might change how we build  
- 🔍 **Competitive Awareness** — Know what others are building

## Features
- Relevance scoring based on your projects
- Category tagging (Tools, Research, Memes, etc.)
- Good/Bad feedback with comments
- Exportable filter training data

## TODO
- [ ] Backend API for storing feedback
- [ ] Database for tweet history
- [ ] Automated X/Twitter feed ingestion
- [ ] Filter model that learns from feedback

## Setup
```bash
# For now, just serve static files
python -m http.server 8000
# or
npx serve .
```

## Stack (planned)
- Frontend: Vanilla JS (keep it simple)
- Backend: Node.js or Python
- Database: SQLite or Postgres
- Ingestion: Kernel browser automation or X API
