import { Injectable , NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(UserEntity)
     private readonly UserRepository: Repository<UserEntity>,
  ) {}

 async create(createProductDto: CreateProductDto): Promise<Product> {
  const user = await this.UserRepository.findOne({ where: { id: createProductDto.userid } });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  const product = this.productRepository.create({
    ...createProductDto,
    user, // ✅ association directe de l'entité user
  });

  return await this.productRepository.save(product);
}


  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }
async getByuserid(userid: number): Promise<Product[]> {
  return await this.productRepository.find({
    where: { user: { id: userid } },
    relations: ['user'], // utile si tu veux charger l'utilisateur associé
  });
}

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id);
  }
async removeByuserid(userid: number): Promise<void> {
  await this.productRepository.delete({ user: { id: userid } });
}

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Product with ID ${id} not found`);
    }
  }

  async findByCategory(category: string): Promise<Product[]> {
  return await this.productRepository.find({
    where: { category },
    relations: ['user'],
  });
}
async searchByKeyword(keyword: string): Promise<Product[]> {
  return await this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.user', 'user')
    .where('LOWER(product.name) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` })
    .orWhere('LOWER(product.description) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` })
    .orWhere('LOWER(product.brand) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` })
    .orWhere('LOWER(product.category) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` })
    .getMany();
}


}