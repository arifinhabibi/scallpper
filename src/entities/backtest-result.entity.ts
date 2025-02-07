import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class BacktestResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'float' })
  initialEquity: number;

  @Column({ type: 'float' })
  finalEquity: number;

  @Column({ type: 'float' })
  profit: number;

  @Column({ type: 'float' })
  maxDrawdown: number;

  @Column({ type: 'float' })
  sharpeRatio: number;

  @Column({ type: 'float' })
  winRate: number;

  @Column()
  totalTrades: number;

  @Column()
  profitableTrades: number;

  @CreateDateColumn()
  createdAt: Date;
}