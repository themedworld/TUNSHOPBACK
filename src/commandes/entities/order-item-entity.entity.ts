import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Commande } from './commande.entity';
import { Product } from '../../product/entities/product.entity';

@Entity()
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Commande, (commande) => commande.items)
  @JoinColumn({ name: 'commande_id' })
  commande: Commande;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;
}