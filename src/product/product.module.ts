import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { UserEntity } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, UserEntity]), // ✅ les deux repositories
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
