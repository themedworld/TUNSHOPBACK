import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandesService } from './commandes.service';
import { CommandesController } from './commandes.controller';
import { Commande } from './entities/commande.entity';
import { OrderItemEntity } from './entities/order-item-entity.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Commande, OrderItemEntity, UserEntity, Product]),
  ],
  controllers: [CommandesController],
  providers: [CommandesService],
  exports: [CommandesService],
})
export class CommandesModule {}