  import { Injectable } from '@nestjs/common';
import axios from 'axios';
  import { MarketDataService } from 'src/market-data/market-data.service';


  @Injectable()
  export class StrategyAnalysisService {
    private readonly ollamaUrl: string;
    private readonly deepseekUrl: string;
    private readonly anthropicUrl: string;
    private readonly openaiUrl: string;
  
    private readonly deepseekApiKey: string;
    private readonly anthropicApiKey: string;
    private readonly openaiApiKey: string;
  
    private readonly ollamaModel: string;
    private readonly deepseekModel: string;
    private readonly anthropicModel: string;
    private readonly openaiModel: string;
  
    constructor(private readonly marketDataService: MarketDataService) {
      this.ollamaUrl = `${process.env.BASE_URL_OLLAMA}/api/generate`;
      this.deepseekUrl = `${process.env.BASE_URL_DEEPSEEK}/v1/chat/completions`;
      this.anthropicUrl = `${process.env.BASE_URL_ANTHROPIC}/v1/complete`;
      this.openaiUrl = `${process.env.BASE_URL_OPENAI}/v1/chat/completions`;
  
      this.deepseekApiKey = process.env.API_KEY_DEEPSEEK || '';
      this.anthropicApiKey = process.env.API_KEY_ANTHROPIC || '';
      this.openaiApiKey = process.env.API_KEY_OPENAI || '';
  
      this.ollamaModel = process.env.MODEL_OLLAMA || '';
      this.deepseekModel = process.env.MODEL_DEEPSEEK || '';
      this.anthropicModel = process.env.MODEL_ANTHROPIC || '';
      this.openaiModel = process.env.MODEL_OPENAI || '';
    }
  
    /**
     * Mendapatkan indikator teknikal berdasarkan frame time 15 menit.
     * @param pair Pasangan mata uang (contoh: 'BTCUSDT').
     * @returns Data indikator teknikal.
     */
    async strategyAnalysis(pair: string) {
      try {
        // Dapatkan data pasar dari Binance
        const marketData = await this.marketDataService.getMarketData(pair);
        const binanceData = marketData.binance;
    
        // Hitung indikator teknikal
        const ema20 = this.calculateEMA(binanceData, 20);
        const ema50 = this.calculateEMA(binanceData, 50);
        const rsi = this.calculateRSI(binanceData, 14);
        const macd = this.calculateMACD(binanceData);
        const lastCandle = binanceData[binanceData.length - 1];
        const avgVolume = this.calculateAverageVolume(binanceData, 20);
    
        // Format data indikator teknikal
        const technicalIndicators = {
          price: lastCandle.close,
          indicators: {
            ema20,
            ema50,
            rsi,
            macd,
            volume: lastCandle.volume,
            avgVolume,
          },
        };
    
        // Analisis data pasar menggunakan 4 model AI
        const aiSignal = await this.analyzeMarketWithMultipleAI(technicalIndicators);
    
        // Tentukan sinyal akhir berdasarkan hasil analisis AI
        let reason = '';
        switch (aiSignal.signal) {
          case 'BUY':
            reason = 'Buy signal detected by AI models based on market indicators.';
            break;
          case 'SELL':
            reason = 'Sell signal detected by AI models based on market indicators.';
            break;
          default:
            reason = 'No strong signal from AI models.';
        }
    
        // Kembalikan hasil analisis
        return {
          signal: aiSignal.signal,
          reason,
          score_signal: aiSignal.score_signal
        };
      } catch (error) {
        console.error(`Error during strategy analysis for pair ${pair}:`, error.message);
        throw new Error('Failed to analyze the market.');
      }
    }
  
    /**
     * Menganalisis data pasar menggunakan 4 model AI.
     * @param marketData Data pasar dari getTechnicalIndicators.
     * @returns Sinyal trading berdasarkan akumulasi skor dari 4 model AI.
     */
    async analyzeMarketWithMultipleAI(marketData: any): Promise<{
      signal: 'BUY' | 'SELL' | 'HOLD';
      score_signal: number;
    }> {
      const models = ['ollama', 'deepseek'];
      let totalScore = 0;
      let modelCount = 0;
    
      for (const model of models) {
        try {
          let sentimentScore = 0;
    
          if (model === 'ollama') {
            sentimentScore = await this.getMarketSentimentOllama(marketData);
          } else if (model === 'deepseek') {
            if (!this.deepseekApiKey) {
              console.warn('Deepseek API key is not available. Skipping Deepseek analysis.');
              continue; // Skip Deepseek if API key is missing
            }
            sentimentScore = await this.getMarketSentimentDeepseek(marketData);
          } else {
            console.warn(`Model '${model}' tidak dikenali. Mengabaikan...`);
            continue;
          }
    
          if (sentimentScore !== 0) {
            // Normalize score to 1–100
            const scaledScore = ((sentimentScore + 1) / 2) * 99 + 1;
            totalScore += scaledScore;
            modelCount++;
          }
        } catch (error) {
          console.error(`Error analyzing market data with model '${model}': ${error.message}`);
        }
      }
    
      const averageScore = modelCount > 0 ? totalScore / modelCount : 50; // Default to 50 if no valid scores
      const finalScore = Math.max(1, Math.min(100, averageScore)); // Ensure score is within 1–100
    
      let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (finalScore > 60) {
        signal = 'BUY';
      } else if (finalScore < 40) {
        signal = 'SELL';
      }
    
      return {
        signal,
        score_signal: finalScore,
      };
    }

    private async getMarketSentimentOllama(marketData: any): Promise<number> {
      const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;
    
      // Define the payload with JSON response format
      const payload = {
        model: this.ollamaModel,
        prompt: `Analyze market data: EMA20=${ema20}, EMA50=${ema50}, RSI=${rsi}, MACD=${macd}, Volume=${volume}, AvgVolume=${avgVolume}. Provide sentiment score between -1 (negative) and 1 (positive)`,
        stream: false,
        format: {
          type: 'json', // Specify JSON response format
          schema: {
            type: 'object',
            properties: {
              sentiment_score: {
                type: 'number',
                minimum: -1,
                maximum: 1,
              },
            },
            required: ['sentiment_score'], // Ensure the response contains the required field
          },
        },
      };
    
      try {
        // Send the request to Ollama
        const response = await axios.post(this.ollamaUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        // Extract the sentiment score from the JSON response
        const sentimentScore = parseFloat(response.data.sentiment_score);
    
        // Ensure the score is within the range of -1 to 1
        return Math.max(-1, Math.min(1, sentimentScore));
      } catch (error) {
        console.error(`Error analyzing market data with Ollama: ${error.message}`);
        throw error;
      }
    }

    private async getMarketSentimentDeepseek(marketData: any): Promise<number> {
      const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;
      const payload = {
        model: this.deepseekModel,
        messages: [
          {
            role: 'user',
            content: `
              Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
              EMA 20: ${ema20}
              EMA 50: ${ema50}
              RSI: ${rsi}
              MACD: ${macd}
              Volume: ${volume}
              Average Volume (20 periods): ${avgVolume}
            `,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      };
      try {
        const response = await axios.post(this.deepseekUrl, payload, {
          headers: {
            Authorization: `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        const responseData = response.data.choices[0].message.content;
        const parsedResponse = JSON.parse(responseData);
        const sentimentScore = parseFloat(parsedResponse.sentiment_score);
        return Math.max(-1, Math.min(1, sentimentScore)); // Pastikan skor dalam rentang -1 hingga 1
      } catch (error) {
        console.error(`Error analyzing market data with DeepSeek: ${error.message}`);
        throw error;
      }
    }

    private async getMarketSentimentAnthropic(marketData: any): Promise<number> {
      const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;
      const payload = {
        model: this.anthropicModel,
        prompt: `
          \n\nHuman: Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
          EMA 20: ${ema20}
          EMA 50: ${ema50}
          RSI: ${rsi}
          MACD: ${macd}
          Volume: ${volume}
          Average Volume (20 periods): ${avgVolume}
          \n\nAssistant:
        `,
        max_tokens_to_sample: 50,
        temperature: 0.7,
      };
      try {
        const response = await axios.post(this.anthropicUrl, payload, {
          headers: {
            'x-api-key': this.anthropicApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
        });
        const sentimentScore = parseFloat(response.data.completion.trim());
        return Math.max(-1, Math.min(1, sentimentScore)); // Pastikan skor dalam rentang -1 hingga 1
      } catch (error) {
        console.error(`Error analyzing market data with Anthropic: ${error.message}`);
        throw error;
      }
    }


    private async getMarketSentimentOpenAI(marketData: any): Promise<number> {
      const { ema20, ema50, rsi, macd, volume, avgVolume } = marketData.indicators;
      const payload = {
        model: this.openaiModel,
        messages: [
          {
            role: 'user',
            content: `
              Analyze the following market data and provide a sentiment score between -1 (negative) and 1 (positive):
              EMA 20: ${ema20}
              EMA 50: ${ema50}
              RSI: ${rsi}
              MACD: ${macd}
              Volume: ${volume}
              Average Volume (20 periods): ${avgVolume}
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
            'Content-Type': 'application/json',
          },
        });
        const responseData = response.data.choices[0].message.content;
        const sentimentScore = parseFloat(responseData.trim());
        return Math.max(-1, Math.min(1, sentimentScore)); // Pastikan skor dalam rentang -1 hingga 1
      } catch (error) {
        console.error(`Error analyzing market data with OpenAI: ${error.message}`);
        throw error;
      }
    }
    

    /**
     * Menghitung Exponential Moving Average (EMA).
     * @param data Data candlestick.
     * @param period Periode EMA.
     * @returns Nilai EMA.
     */
    private calculateEMA(data: any[], period: number): number {
      const closes = data.map((candle) => candle.close);
      const multiplier = 2 / (period + 1);
      let ema = closes[0];
      for (let i = 1; i < closes.length; i++) {
        ema = (closes[i] - ema) * multiplier + ema;
      }
      return parseFloat(ema.toFixed(2));
    }

    /**
     * Menghitung Relative Strength Index (RSI).
     * @param data Data candlestick.
     * @param period Periode RSI.
     * @returns Nilai RSI.
     */
    private calculateRSI(data: any[], period: number): number {
      const closes = data.map((candle) => candle.close);
      if (closes.length < period + 1) {
        console.warn(`Not enough data to calculate RSI for period ${period}`);
        return 50; // Nilai default RSI jika data tidak cukup
      }
      const gains: number[] = [];
      const losses: number[] = [];
      for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
      const avgGain =
        gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const avgLoss =
        losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      return parseFloat(rsi.toFixed(2));
    }

    /**
     * Menghitung Moving Average Convergence Divergence (MACD).
     * @param data Data candlestick.
     * @returns Nilai MACD.
     */
    private calculateMACD(data: any[]): number {
      const ema12 = this.calculateEMA(data, 12);
      const ema26 = this.calculateEMA(data, 26);
      return ema12 - ema26;
    }

    /**
     * Menghitung rata-rata volume.
     * @param data Data candlestick.
     * @param period Periode rata-rata.
     * @returns Rata-rata volume.
     */
    private calculateAverageVolume(data: any[], period: number): number {
      const volumes = data.map((candle) => candle.volume);
      const totalVolume = volumes.slice(-period).reduce((a, b) => a + b, 0);
      return parseFloat((totalVolume / period).toFixed(2));
    }
  }