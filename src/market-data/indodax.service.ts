import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class IndodaxService {
  private readonly baseUrl = `${process.env.BASE_URL_INDODAX}/tapi`;
  private apiKey = `${process.env.API_KEY_INDODAX}`;
  private secretKey = `${process.env.SECRET_KEY_INDODAX}`;

  async getMarketData(pair: string) {
    const nonce = Date.now();
    const params = `method=getTicker&nonce=${nonce}&pair=${pair}`;
    const signature = crypto.createHmac('sha512', this.secretKey).update(params).digest('hex');
    const response = await axios.post(this.baseUrl, new URLSearchParams({ method: 'getTicker', nonce: nonce.toString(), pair }), {
      headers: { Key: this.apiKey, Sign: signature },
    });
    return response.data;
  }
}