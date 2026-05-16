import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートの .env を読み込む
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const client = new Anthropic();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// レシート解析の指示（固定なのでキャッシュ対象）
const SYSTEM_PROMPT = `あなたはレシート解析の専門家です。レシート画像を分析し、正確にJSON形式で情報を抽出します。必ず以下のJSON形式のみで返答してください（前置きや説明は不要）：
{
  "date": "YYYY-MM-DD",
  "storeName": "店舗名",
  "items": [
    {
      "name": "商品名",
      "price": 金額（整数、記号なし）,
      "category": "カテゴリ"
    }
  ],
  "total": 合計金額（整数）
}
カテゴリは必ず次のいずれかを使用してください：食費、外食、日用品、衣類、交通費、医療費、娯楽、その他
日付が読み取れない場合は今日の日付をYYYY-MM-DD形式で。
金額は数値のみ（¥や,は除外）。`;

// レシート画像を受け取り、Claude API で解析して結果を返す
app.post('/api/receipt', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '画像ファイルが必要です' });
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ success: false, error: 'JPEG、PNG、GIF、WebP形式のみ対応しています' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // 固定プロンプトをキャッシュしてコスト削減
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: req.file.mimetype,
                data: base64Image
              }
            },
            { type: 'text', text: 'このレシートを解析してください。' }
          ]
        }
      ]
    });

    const text = response.content[0].text;

    // Claude の返答から JSON 部分を抽出する
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('レシートの解析に失敗しました。有効なレシート画像をアップロードしてください。');
    }

    const data = JSON.parse(jsonMatch[0]);

    // 合計金額が未記載の場合は商品金額を合算する
    if (!data.total && data.items?.length > 0) {
      data.total = data.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('レシート解析エラー:', error);
    res.status(500).json({ success: false, error: error.message || 'レシートの解析に失敗しました' });
  }
});

app.listen(3001, () => console.log('サーバー起動: http://localhost:3001'));
