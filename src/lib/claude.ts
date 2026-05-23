import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ClipStrategy {
  startTime: number
  endTime: number
  caption: string
  hashtags: string[]
  reason: string
  scheduledMinutesFromNow: number
}

export interface VideoStrategy {
  clips: ClipStrategy[]
  overallStrategy: string
  recommendedPostingFrequency: string
}

/** AI analyzes a video and returns an optimal clipping strategy for TikTok */
export async function generateVideoStrategy(
  duration: number,
  theme: string,
  description: string,
  style: string,
  language: string
): Promise<VideoStrategy> {
  const prompt = `あなたはTikTokバイラル動画の専門家です。
以下の動画情報を分析し、TikTokで最大再生数を獲得するための最適なクリップ戦略を提案してください。

動画情報:
- 尺: ${duration.toFixed(1)}秒
- テーマ: ${theme}
- 説明: ${description}
- スタイル: ${style}
- 言語: ${language}

TikTokの最適化ルール:
1. 最適な動画の長さは15〜60秒（ただし3分まで可）
2. 最初の3秒でフックを作る（視聴者を引き込む）
3. 縦型フォーマット（9:16）
4. キャプションは短くインパクトのある文章
5. ハッシュタグは5〜10個
6. 動画を複数に分割してシリーズ化すると再生数が増える

以下のJSON形式で返してください（コードブロックなし）:
{
  "overallStrategy": "全体戦略の説明",
  "recommendedPostingFrequency": "投稿頻度の推奨（例: 1日2回）",
  "clips": [
    {
      "startTime": 0,
      "endTime": 45,
      "caption": "キャプション文（${language === 'ja' ? '日本語' : 'English'}）",
      "hashtags": ["#タグ1", "#タグ2"],
      "reason": "このクリップを選んだ理由",
      "scheduledMinutesFromNow": 0
    }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text) as VideoStrategy
}

/** Generate a single caption for a clip */
export async function generateCaption(
  theme: string,
  clipDescription: string,
  language: string
): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `TikTokの動画キャプションを1文で作成してください。
テーマ: ${theme}
クリップ内容: ${clipDescription}
言語: ${language === 'ja' ? '日本語' : 'English'}
インパクトのある短い文章で。絵文字も使用可。`
    }],
  })

  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}
