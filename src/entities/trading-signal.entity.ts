import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class TradingSignal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pair: string;

  @Column()
  signal: string;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ type: 'float', nullable: true })
  priceTarget: number;

  @Column({ type: 'float', nullable: true })
  stopLoss: number;

  @Column()
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}