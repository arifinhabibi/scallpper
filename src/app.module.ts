import Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrokerService } from './broker/broker.service';
import { IndodaxBrokerService } from './broker/indodax-broker.service';
import { TradingService } from './trading/trading.service';
import { AnalysisService } from './analysis/analysis.service';
import { StrategyAnalysisService } from './analysis/strategy-analysis.service';
import { MarketDataService } from './market-data/market-data.service';
import { BinanceService } from './market-data/binance.service';
import { IndodaxService } from './market-data/indodax.service';
import { TradingSignalService } from './trading/trading-signal.service';
import { BacktestService } from './backtest.service';
import { SentimentAnalysisService } from './analysis/sentiment-analysis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_TYPE: Joi.string().valid('mysql', 'postgres', 'sqlite').default('mysql'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(3306),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        BASE_URL_BINANCE: Joi.string().uri().required(),
        BASE_URL_INDODAX: Joi.string().uri().required(),
        BASE_URL_OLLAMA: Joi.string().uri().required(),
        API_KEY_INDODAX: Joi.string().required(),
        SECRET_KEY_INDODAX: Joi.string().required(),
        NEWS_API_KEY: Joi.string().required(),
        MODEL_OLLAMA: Joi.string().required(),
        BASE_EXCHANGERATE: Joi.string().uri().required(),
        CRON_INTERVAL: Joi.string().default('*/15 * * * *'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: configService.get<'mysql'>('DB_TYPE'),
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BrokerService,
    IndodaxBrokerService,
    TradingService,
    AnalysisService,
    StrategyAnalysisService,
    MarketDataService,
    BinanceService,
    IndodaxService,
    TradingSignalService,
    BacktestService,
    SentimentAnalysisService
  ],
})
export class AppModule {}