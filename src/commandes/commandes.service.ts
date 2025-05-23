import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commande } from './entities/commande.entity';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { OrderItemEntity } from './entities/order-item-entity.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class CommandesService {
  constructor(
    @InjectRepository(Commande)
    private commandeRepository: Repository<Commande>,
    @InjectRepository(OrderItemEntity)
    private orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createCommandeDto: CreateCommandeDto) {
    const user = await this.userRepository.findOne({ 
      where: { id: createCommandeDto.userId } 
    });
    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    await this.verifyProductAvailability(createCommandeDto.items);

   const commande = this.commandeRepository.create({
  user: user,
  paymentMethod: createCommandeDto.paymentMethod as 'Paymee' | 'CIB' | 'Flouci' | 'COD' | 'Other',
  shippingAddress: createCommandeDto.shippingAddress,
  billingAddress: createCommandeDto.billingAddress,
  notes: createCommandeDto.notes,
  status: 'pending' as const,
  totalAmount: 0,
  items: []
});

    let totalAmount = 0;
    const items = await Promise.all(
      createCommandeDto.items.map(async (item) => {
        const product = await this.productRepository.findOne({ 
          where: { id: item.productId } 
        });

        if (!product) {
          throw new BadRequestException(`Produit avec ID ${item.productId} non trouvé`);
        }

        const orderItem = this.orderItemRepository.create({
          product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        });

        product.stock -= item.quantity;
        await this.productRepository.save(product);

        totalAmount += orderItem.subtotal;
        return orderItem;
      }),
    );

    commande.items = items;
    commande.totalAmount = totalAmount;
    return this.commandeRepository.save(commande);
  }

  private async verifyProductAvailability(items: { productId: number; quantity: number }[]) {
    for (const item of items) {
      const product = await this.productRepository.findOne({ 
        where: { id: item.productId } 
      });
      
      if (!product) {
        throw new BadRequestException(`Produit avec ID ${item.productId} non trouvé`);
      }
      
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour le produit ${product.name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`
        );
      }
    }
  }

  async update(id: number, updateCommandeDto: Partial<Commande>) {
    const commande = await this.commandeRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product']
    });
    
    if (!commande) {
      throw new BadRequestException('Commande non trouvée');
    }

    if (updateCommandeDto.status) {
      await this.handleStatusChange(commande, updateCommandeDto.status);
    }

    Object.assign(commande, updateCommandeDto);
    return this.commandeRepository.save(commande);
  }

  async findAll() {
    return this.commandeRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number) {
    return this.commandeRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const commande = await this.commandeRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product'],
    });

    if (!commande) {
      throw new BadRequestException('Commande non trouvée');
    }

    return commande;
  }

  async cancelOrder(id: number) {
    const commande = await this.commandeRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!commande) {
      throw new BadRequestException('Commande non trouvée');
    }

    if (commande.status === 'cancelled') {
      throw new BadRequestException('La commande est déjà annulée');
    }

    await this.restoreStock(commande);
    commande.status = 'cancelled';
    return this.commandeRepository.save(commande);
  }

  private async restoreStock(commande: Commande) {
    for (const item of commande.items) {
      const product = await this.productRepository.findOne({ 
        where: { id: item.product.id } 
      });
      if (product) {
        product.stock += item.quantity;
        await this.productRepository.save(product);
      }
    }
  }

  async remove(id: number) {
    const commande = await this.commandeRepository.findOne({ 
      where: { id },
      relations: ['items', 'items.product']
    });
    
    if (!commande) {
      throw new BadRequestException('Commande non trouvée');
    }

    const now = new Date();
    const commandeDate = new Date(commande.createdAt);
    const diffHours = (now.getTime() - commandeDate.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      throw new BadRequestException('Impossible de supprimer la commande après 24 heures');
    }

    if (commande.status !== 'cancelled') {
      await this.restoreStock(commande);
    }

    await this.orderItemRepository.remove(commande.items);
    await this.commandeRepository.remove(commande);

    return { message: 'Commande supprimée avec succès' };
  }

  private async handleStatusChange(commande: Commande, newStatus: string) {
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException('Statut invalide');
    }

    if (newStatus === 'cancelled') {
      await this.restoreStock(commande);
    } else if (commande.status === 'cancelled') {
      await this.deductStockFromCancelledOrder(commande);
    }
  }

  private async deductStockFromCancelledOrder(commande: Commande) {
    for (const item of commande.items) {
      const product = await this.productRepository.findOne({ 
        where: { id: item.product.id } 
      });
      if (product) {
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour le produit ${product.name}. Impossible de réactiver la commande.`
          );
        }
        product.stock -= item.quantity;
        await this.productRepository.save(product);
      }
    }
  }


// src/commandes/commandes.service.ts
async getSoldProducts(userid: number) {
  return this.commandeRepository
    .createQueryBuilder('commande')
    .leftJoinAndSelect('commande.items', 'items')
    .leftJoinAndSelect('items.product', 'product')
    .leftJoinAndSelect('product.user', 'user')
    .where('user.id = :userid', { userid })
    .select([
      'product.id',
      'product.name',
      'items.quantity',
      'items.unitPrice',
      'commande.orderDate',
      'commande.status'
    ])
    .orderBy('commande.orderDate', 'DESC')
    .getRawMany();
}

}