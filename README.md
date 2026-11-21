# QUIZORA — Beyond Learning

A dark futuristic AI exam starter built from the original EduGenius prototype.

## Included now
- Phantom Nebula visual theme (Void Navy, Neon Violet, Cyber Mint, Dream Pink)
- Responsive exam UI, timer, navigation, scoring and answer explanations
- Real AI-generated MCQs from pasted notes/transcripts
- PDF text extraction + AI-generated MCQs
- API key stays on the server (never put it in browser JavaScript)

## Not connected yet
- Direct YouTube URL transcript extraction
- Facebook video extraction (usually requires permitted platform access/API)
- Google Drive URL/file connector
- User accounts, database-backed exam history, deployment/domain

For a YouTube/Facebook/Drive class until connectors are added, paste its transcript or extracted notes in the Transcript / Notes tab.

## Run locally
1. Install Node.js 20 or later.
2. In this folder run: `npm install`
3. Copy `.env.example` to `.env` and add your own API key as `OPENAI_API_KEY`.
4. Run: `npm start`
5. Open `http://localhost:3000`.

Never share your `.env` file or API key. API usage may incur charges. The model name can be changed with `OPENAI_MODEL`.
