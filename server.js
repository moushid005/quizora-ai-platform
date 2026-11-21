import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = {
  type: 'object', additionalProperties: false, required: ['questions'],
  properties: { questions: { type: 'array', minItems: 1, items: {
    type: 'object', additionalProperties: false,
    required: ['q','o','a','d','e'],
    properties: {
      q: { type: 'string' }, o: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
      a: { type: 'integer', minimum: 0, maximum: 3 }, d: { type: 'string', enum: ['Easy','Medium','Hard'] }, e: { type: 'string' }
    }
  } } }
};

async function createQuestions({ content, subject, language, topic, count, level, qtype }) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Server-এ OPENAI_API_KEY সেট করা হয়নি।');
  if (!content || content.trim().length < 80) throw new Error('প্রশ্ন তৈরির জন্য আরও বিস্তারিত class content দিন (কমপক্ষে ৮০ অক্ষর)।');
  const prompt = `You are QUIZORA, a careful exam-question author. Create exactly ${count} original MCQs strictly grounded in the source content below. Subject: ${subject}. Language: ${language}. Topic: ${topic || 'infer from source'}. Difficulty: ${level}. Question style: ${qtype}. Each question must have exactly four distinct options. 'a' is the zero-based index of the correct option. Explanation must explain why the answer is correct using the source. Do not invent facts beyond the source. If the source is insufficient for the requested count, create fewer high-quality questions rather than hallucinating. Keep math notation readable. Source content:\n\n${content.slice(0, 45000)}`;
  const result = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: prompt,
    text: { format: { type: 'json_schema', name: 'quizora_mcq_exam', strict: true, schema } }
  });
  const parsed = JSON.parse(result.output_text);
  if (!parsed.questions?.length) throw new Error('AI কোনো প্রশ্ন তৈরি করতে পারেনি।');
  return parsed;
}

app.post('/api/generate', async (req, res) => {
  try { const data = await createQuestions({ ...req.body, content: req.body.content }); res.json(data); }
  catch (e) { res.status(400).json({ error: e.message || 'প্রশ্ন তৈরি করতে সমস্যা হয়েছে।' }); }
});

app.post('/api/generate-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file || req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'একটি valid PDF file upload করুন।' });
    const extracted = await pdf(req.file.buffer);
    const data = await createQuestions({ ...req.body, count: Number(req.body.count), content: extracted.text });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message || 'PDF পড়তে বা প্রশ্ন তৈরি করতে সমস্যা হয়েছে।' }); }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) }));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`QUIZORA running at http://localhost:${port}`));
