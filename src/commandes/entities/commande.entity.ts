import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { OrderItemEntity } from './order-item-entity.entity';

@Entity()
export class Commande {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.commandes)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  // Remplacez datetime par timestamp pour PostgreSQL
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: 'Paymee' | 'CIB' | 'Flouci' | 'COD' | 'Other';

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string;

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  billingAddress: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => OrderItemEntity, (item) => item.commande, { cascade: true })
  items: OrderItemEntity[];
}