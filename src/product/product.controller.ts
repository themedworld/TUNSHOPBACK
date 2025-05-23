import { Controller, Get, Post, Body, Param, Delete, Put, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Créer un produit
  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return await this.productService.create(createProductDto);
  }
@Get('category/:category')
async findByCategory(@Param('category') category: string): Promise<Product[]> {
  return await this.productService.findByCategory(category);
}
@Get('search/:keyword')
async searchByKeyword(@Param('keyword') keyword: string): Promise<Product[]> {
  return await this.productService.searchByKeyword(keyword);
}

  // Récupérer tous les produits
  @Get()
  async findAll(): Promise<Product[]> {
    return await this.productService.findAll();
  }

  // Récupérer tous les produits d'un utilisateur
  @Get('user/:userId')
  async getByUserId(@Param('userId') userId: number): Promise<Product[]> {
    return await this.productService.getByuserid(userId);
  }

  // Récupérer un produit par ID
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Product> {
    return await this.productService.findOne(id);
  }

  // Mettre à jour un produit
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return await this.productService.update(id, updateProductDto);
  }

  // Supprimer un produit par ID
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return await this.productService.remove(id);
  }

  // Supprimer tous les produits d'un utilisateur
  @Delete('user/:userId')
  async removeByUserId(@Param('userId') userId: number): Promise<void> {
    const products = await this.productService.getByuserid(userId);
    if (products.length === 0) {
      throw new NotFoundException(`No products found for user ID ${userId}`);
    }
    return await this.productService.removeByuserid(userId);
  }
}
