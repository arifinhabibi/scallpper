import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CurrencyConversionService {
  private readonly apiUrl = process.env.BASE_EXCHANGERATE || 'https://api.exchangerate-api.com/v4/latest';

  /**
   * Mengonversi jumlah dari satu mata uang ke mata uang lain.
   * @param amount Jumlah yang akan dikonversi.
   * @param fromCurrency Mata uang asal.
   * @param toCurrency Mata uang tujuan.
   * @returns Jumlah yang telah dikonversi.
   */
  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // Dapatkan kurs konversi
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Mendapatkan kurs konversi antara dua mata uang.
   * @param fromCurrency Mata uang asal.
   * @param toCurrency Mata uang tujuan.
   * @returns Kurs konversi.
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      // Ambil data kurs dari API
      const response = await axios.get(`${this.apiUrl}/${fromCurrency}`);
      const rates = response.data.rates;

      // Validasi apakah mata uang tujuan tersedia
      if (!rates[toCurrency]) {
        throw new Error(`Currency ${toCurrency} not found in exchange rates.`);
      }

      return rates[toCurrency];
    } catch (error) {
      console.error(`Error fetching exchange rate: ${error.message}`);
      throw new Error('Failed to fetch exchange rate.');
    }
  }
}