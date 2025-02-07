import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CurrencyConversionService {
  private readonly apiUrl = process.env.BASE_EXCHANGERATE || '';

  async convert(amount: number, fromCurrency: string, toCurrency: string) {
    if (fromCurrency === toCurrency) return amount;
    const rate = await this.getExchangeRate(toCurrency);
    return amount * rate;
  }

  async getExchangeRate(targetCurrency: string) {
    const response = await axios.get(this.apiUrl);
    return response.data.rates[targetCurrency];
  }
}