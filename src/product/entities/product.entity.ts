import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;
  
    @ManyToOne(() => UserEntity, (user) => user.product, { onDelete:'CASCADE' })
    @JoinColumn({ name: 'userid' })
    user: UserEntity;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discountedPrice: number | null;

  @Column('text')
  description: string;

  @Column()
  primaryImage: string;

  @Column('simple-array', { nullable: true })
  secondaryImages: string[];

  @Column({ nullable: true })
  brand: string;

  @Column('int', { nullable: true })
  stock: number;

  @Column({ nullable: true })
  sku: string;

  @Column('simple-array', { nullable: true })
  variants: string[];
}
