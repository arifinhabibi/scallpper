import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiAnalysisService {
  private readonly ollamaUrl: string;
  private readonly deepseekUrl: string;
  private readonly anthropicUrl: string;
  private readonly openaiUrl: string;

  // API keys dan model names
  private readonly ollamaApiKey: string;
  private readonly deepseekApiKey: string;
  private readonly anthropicApiKey: string;
  private readonly openaiApiKey: string;

  private readonly ollamaModel: string;
  private readonly deepseekModel: string;
  private readonly anthropicModel: string;
  private readonly openaiModel: string;

  /**
   * Constructor untuk inisialisasi API keys dan model names.
   */
  constructor() {
    this.ollamaUrl = `${process.env.BASE_URL_OLLAMA}/api/generate`;
    this.deepseekUrl = `${process.env.BASE_URL_DEEPSEEK}/v1/chat/completions`;
    this.anthropicUrl = 'https://api.anthropic.com/v1/complete';
    this.openaiUrl = 'https://api.openai.com/v1/chat/completions';

    // Ambil API keys dari environment variables
    this.ollamaApiKey = process.env.API_KEY_OLLAMA || '';
    this.deepseekApiKey = process.env.API_KEY_DEEPSEEK || '';
    this.anthropicApiKey = process.env.API_KEY_ANTHROPIC || '';
    this.openaiApiKey = process.env.API_KEY_OPENAI || '';

    // Ambil model names dari environment variables
    this.ollamaModel = process.env.MODEL_OLLAMA || '';
    this.deepseekModel = process.env.MODEL_DEEPSEEK || '';
    this.anthropicModel = process.env.MODEL_ANTHROPIC || '';
    this.openaiModel = process.env.MODEL_OPENAI || '';
  }

  /**
   * Menganalisis sentimen teks menggunakan model Ollama.
   * @param pair Pasangan mata uang yang akan dianalisis.
   * @returns Sinyal trading berdasarkan skor sentimen.
   */
  async analyzeSentiment(pair: string) {
    try {
      // Inisialisasi total skor dan jumlah model yang berhasil diproses
      let totalScore = 0;
      let modelCount = 0;
  
      // Daftar model AI yang akan digunakan
      const models = ['ollama', 'news'];
  
      for (const model of models) {
        try {
          let sentimentScore = 0;
  
          if (model === 'ollama') {
            // Analisis sentimen menggunakan Ollama
            sentimentScore = await this.getSentimentOllama(pair);
          } else if (model === 'news') {
            // Analisis sentimen berdasarkan berita
            const newsSentiment = await this.fetchNewsSentiment(pair);
            sentimentScore = this.convertSentimentToScore(newsSentiment);
          } else {
            console.warn(`Model '${model}' tidak dikenali. Mengabaikan...`);
            continue; // Lewati model yang tidak dikenali
          }
  
          // Hanya tambahkan skor jika nilainya bukan 0
          if (sentimentScore !== 0) {
            totalScore += sentimentScore;
            modelCount++;
          }
        } catch (error) {
          console.error(`Error analyzing sentiment with model '${model}': ${error.message}`);
        }
      }
  
      // Hitung rata-rata skor jika ada model yang berhasil diproses
      const averageScore = modelCount > 0 ? totalScore / modelCount : 0;
  
      // Tentukan sinyal berdasarkan rata-rata skor
      if (averageScore > 0.7) return 'STRONG_BUY';
      if (averageScore > 0.4) return 'BUY';
      if (averageScore < -0.7) return 'STRONG_SELL';
      if (averageScore < -0.4) return 'SELL';
      return 'HOLD';
    } catch (error) {
      console.error(`Error analyzing sentiment: ${error.message}`);
      return 'HOLD'; // Default jika terjadi kesalahan
    }
  }
  
  /**
   * Mendapatkan skor sentimen menggunakan model Ollama.
   */
  private async getSentimentOllama(pair: string): Promise<number> {
    const payload = {
      model: process.env.MODEL_OLLAMA,
      prompt: `Analyze sentiment of the following pair and predict market impact: ${pair}`,
      stream: false,
    };
  
    try {
      const response = await axios.post(this.ollamaUrl, payload, {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY_OLLAMA}`,
          "Content-Type": "application/json",
        },
      });
  
      const sentimentScore = parseFloat(response.data.sentiment_score);
      return Math.max(-1, Math.min(1, sentimentScore));
    } catch (error) {
      console.error(`Error analyzing sentiment with Ollama: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Mengambil dan menganalisis sentimen berita terkait pasangan mata uang.
   */
  private async fetchNewsSentiment(pair: string): Promise<string> {
    try {
      const apiKey = process.env.NEWS_API_KEY;
      const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(pair)}&apiKey=${apiKey}`;
      const response = await axios.get(newsApiUrl);
  
      const articles = response.data.articles;
  
      if (!articles || articles.length === 0) {
        console.warn('Tidak ada artikel berita yang ditemukan.');
        return 'Netral'; // Default jika tidak ada artikel
      }
  
      // Analisis sentimen untuk setiap artikel
      const sentimentScores = await Promise.all(
        articles.map(async (article) => {
          const content = article.title + " " + (article.description || "");
          const sentiment = await this.analyzeSentimentFromText(content);
          return sentiment;
        })
      );
  
      // Hitung rata-rata sentimen
      const averageSentiment =
        sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
  
      return averageSentiment > 0 ? 'Positif' : 'Negatif';
    } catch (error) {
      console.error('Gagal mengambil sentimen berita:', error.message);
      return 'Netral'; // Default jika gagal
    }
  }
  
  /**
   * Mengonversi sentimen berita ('Positif', 'Negatif', 'Netral') menjadi skor numerik.
   */
  private convertSentimentToScore(sentiment: string): number {
    switch (sentiment) {
      case 'Positif':
        return 1;
      case 'Negatif':
        return -1;
      default:
        return 0;
    }
  }
  
  /**
   * Menganalisis sentimen teks menggunakan model Ollama.
   */
  private async analyzeSentimentFromText(text: string): Promise<number> {
    const payload = {
      model: process.env.MODEL_OLLAMA,
      prompt: `Analyze sentiment of the following text and provide a sentiment score between -1 (negative) and 1 (positive): ${text}`,
      stream: false,
    };
  
    try {
      const response = await axios.post(this.ollamaUrl, payload, {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY_OLLAMA}`,
          "Content-Type": "application/json",
        },
      });
  
      const sentimentScore = parseFloat(response.data.sentiment_score);
      return Math.max(-1, Math.min(1, sentimentScore));
    } catch (error) {
      console.error(`Error analyzing sentiment from text: ${error.message}`);
      throw error;
    }
  }


  /**
   * Menganalisis data pasar menggunakan 4 model AI.
   * @param marketData Data pasar dari getTechnicalIndicators.
   * @returns Sinyal trading berdasarkan akumulasi skor dari 4 model AI.
   */
  async analyzeMarketWithMultipleAI(marketData: any) {
    const models = ['ollama', 'deepseek', 'anthropic', 'openai'];
    let totalScore = 0;
    let modelCount = 0;

    for (const model of models) {
      try {
        let sentimentScore = 0;

        if (model === 'ollama') {
          sentimentScore = await this.getMarketSentimentOllama(marketData);
        } else if (model === 'deepseek') {
          sentimentScore = await this.getMarketSentimentDeepseek(marketData);
        } else if (model === 'anthropic') {
          sentimentScore = await this.getMarketSentimentAnthropic(marketData);
        } else if (model === 'openai') {
          sentimentScore = await this.getMarketSentimentOpenAI(marketData);
        } else {
          console.warn(`Model '${model}' tidak dikenali. Mengabaikan...`);
          continue;
        }

        if (sentimentScore !== 0) {
          totalScore += sentimentScore;
          modelCount++;
        }
      } catch (error) {
        console.error(`Error analyzing market data with model '${model}': ${error.message}`);
      }
    }

    const averageScore = modelCount > 0 ? totalScore / modelCount : 0;

    if (averageScore > 0.7) return 'STRONG_BUY';
    if (averageScore > 0.4) return 'BUY';
    if (averageScore < -0.7) return 'STRONG_SELL';
    if (averageScore < -0.4) return 'SELL';
    return 'HOLD';
  }

  /**
   * Mendapatkan skor sentimen pasar menggunakan model Ollama.
   */
  private async getMarketSentimentOllama(marketData: any): Promise<number> {
    const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;

    const payload = {
      model: this.ollamaModel,
      prompt: `
        Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
        - EMA 20: ${ema20}
        - EMA 50: ${ema50}
        - RSI: ${rsi}
        - MACD: ${macd}
        - Volume: ${volume}
        - Average Volume (20 periods): ${avgVolume}
      `,
      stream: false,
    };

    try {
      const response = await axios.post(this.ollamaUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.ollamaApiKey}`,
          "Content-Type": "application/json",
        },
      });

      const sentimentScore = parseFloat(response.data.sentiment_score);
      return Math.max(-1, Math.min(1, sentimentScore));
    } catch (error) {
      console.error(`Error analyzing market data with Ollama: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mendapatkan skor sentimen pasar menggunakan model DeepSeek.
   */
  private async getMarketSentimentDeepseek(marketData: any): Promise<number> {
    const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;

    const payload = {
      model: this.deepseekModel,
      messages: [
        {
          role: "user",
          content: `
            Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
            - EMA 20: ${ema20}
            - EMA 50: ${ema50}
            - RSI: ${rsi}
            - MACD: ${macd}
            - Volume: ${volume}
            - Average Volume (20 periods): ${avgVolume}
          `,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
      response_format: { type: "json_object" },
    };

    try {
      const response = await axios.post(this.deepseekUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.deepseekApiKey}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = response.data.choices[0].message.content;
      const parsedResponse = JSON.parse(responseData);
      const sentimentScore = parseFloat(parsedResponse.sentiment_score);
      return Math.max(-1, Math.min(1, sentimentScore));
    } catch (error) {
      console.error(`Error analyzing market data with DeepSeek: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mendapatkan skor sentimen pasar menggunakan model Anthropic.
   */
  private async getMarketSentimentAnthropic(marketData: any): Promise<number> {
    const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;

    const payload = {
      model: this.anthropicModel,
      prompt: `
        \n\nHuman: Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
        - EMA 20: ${ema20}
        - EMA 50: ${ema50}
        - RSI: ${rsi}
        - MACD: ${macd}
        - Volume: ${volume}
        - Average Volume (20 periods): ${avgVolume}
        \n\nAssistant:
      `,
      max_tokens_to_sample: 50,
      temperature: 0.7,
    };

    try {
      const response = await axios.post(this.anthropicUrl, payload, {
        headers: {
          "x-api-key": this.anthropicApiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
      });

      const sentimentScore = parseFloat(response.data.completion.trim());
      return Math.max(-1, Math.min(1, sentimentScore));
    } catch (error) {
      console.error(`Error analyzing market data with Anthropic: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mendapatkan skor sentimen pasar menggunakan model ChatGPT (OpenAI).
   */
  private async getMarketSentimentOpenAI(marketData: any): Promise<number> {
    const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;

    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: "user",
          content: `
            Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
            - EMA 20: ${ema20}
            - EMA 50: ${ema50}
            - RSI: ${rsi}
            - MACD: ${macd}
            - Volume: ${volume}
            - Average Volume (20 periods): ${avgVolume}
          `,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    };

    try {
      const response = await axios.post(this.openaiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = response.data.choices[0].message.content;
      const sentimentScore = parseFloat(responseData.trim());
      return Math.max(-1, Math.min(1, sentimentScore));
    } catch (error) {
      console.error(`Error analyzing market data with OpenAI: ${error.message}`);
      throw error;
    }
  }
}