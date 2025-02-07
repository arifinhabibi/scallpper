import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TradingSignal } from 'src/entities/trading-signal.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TradingSignalService {
  constructor(
    @InjectRepository(TradingSignal)
    private readonly tradingSignalRepository: Repository<TradingSignal>,
  ) {}

  async saveSignal(signalData: any) {
    const signal = this.tradingSignalRepository.create(signalData);
    return this.tradingSignalRepository.save(signal);
  }
}