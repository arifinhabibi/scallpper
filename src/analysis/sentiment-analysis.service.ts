import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SentimentAnalysisService {
  private readonly ollamaUrl: string;
  private readonly ollamaModel: string;
  private readonly xApiUrl: string;
  private readonly xApiKey: string;

  constructor() {
    this.ollamaUrl = `${process.env.BASE_URL_OLLAMA}/api/generate`;
    this.ollamaModel = process.env.MODEL_OLLAMA || '';
    this.xApiUrl = `${process.env.BASE_URL_X_API}/x-api/posts/recent-search`;
    this.xApiKey = process.env.API_KEY_X_API || '';
  }

  /**
   * Analyze sentiment of posts from X.com (Twitter) and return 'positif' or 'negative'
   * @param pair Currency pair to analyze (e.g., 'BTC-USD')
   * @returns 'positif' or 'negative'
   */
  async analyzeSentiment(pair: string): Promise<'positif' | 'negative'> {
    try {
      // Fetch posts from X.com
      const xData = await this.fetchXSentiment(pair);

      if (!xData) {
        console.warn('No data fetched from X.com');
        return 'negative'; // Default to negative if no data is available
      }

      // Analyze sentiment using AI
      const sentiment = await this.analyzeWithOllama(xData);
      return sentiment;
    } catch (error) {
      console.error(`Error analyzing sentiment: ${error.message}`);
      return 'negative'; // Default to negative on error
    }
  }

  /**
   * Fetch posts from X.com related to the currency pair
   */
  private async fetchXSentiment(pair: string): Promise<string> {
    try {
      const response = await axios.get(this.xApiUrl, {
        params: {
          q: `${pair} lang:en`, // Search for posts in English
          limit: 3, // Fetch up to 100 posts
          sort: 'recent', // Get the most recent posts
        },
        headers: {
          Authorization: `Bearer ${this.xApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Combine all post texts into a single string
      return response.data?.posts
        ?.map((post) => post.text)
        .join(' ')
        .slice(0, 5000) // Limit text length for efficiency
        || '';
    } catch (error) {
      console.error('Failed to fetch X.com data:', error.message);
      return '';
    } 
  }

  /**
   * Analyze text sentiment using Ollama AI
   */
  private async analyzeWithOllama(text: string): Promise<'positif' | 'negative'> {
    const payload = {
      model: this.ollamaModel,
      prompt: `
        Analyze the sentiment of the following social media posts related to currency trading:
        "${text}"
        Classify the overall sentiment as either "positif" or "negative". Respond with only one word: "positif" or "negative".
      `,
      stream: false,
      format: {
        type: 'object',
        properties: {
          sentiment: {
            type: 'string',
            enum: ['positif', 'negative'], // Restrict response to these values
          },
        },
        required: ['sentiment'],
      },
    };
  
    try {
      const response = await axios.post(this.ollamaUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      // Extract sentiment from the response
      const sentiment = response.data?.sentiment?.trim().toLowerCase();
      if (sentiment === 'positif' || sentiment === 'negative') {
        return sentiment;
      }
  
      console.warn('Invalid sentiment response from AI:', sentiment);
      return 'negative'; // Default to negative if the response is invalid
    } catch (error) {
      console.error(`Error analyzing sentiment with Ollama: ${error.message}`);
      return 'negative'; // Default to negative on error
    }
  }
}