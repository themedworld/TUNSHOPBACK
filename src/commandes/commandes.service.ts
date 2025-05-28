import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commande } from './entities/commande.entity';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { OrderItemEntity } from './entities/order-item-entity.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Product } from '../product/entities/product.entity';
export interface SoldProduct {
  product_id: number;
  product_name: string;
  product_price: number;
  product_discountedPrice: number | null;
  product_prixachat: number | null;
  items_quantity: number;
  items_unitPrice: number;
  commande_orderDate: Date;
  commande_status: string;
}

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

async getSoldProducts(sellerId: number): Promise<SoldProduct[]> {
    return this.commandeRepository
      .createQueryBuilder('commande')
      .leftJoinAndSelect('commande.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.user', 'seller') // Jointure avec le vendeur du produit
      .where('seller.id = :sellerId', { sellerId }) // Filtre par ID du vendeur
      .select([
        'product.id as product_id',
        'product.name as product_name',
        'product.price as product_price',
        'product.discountedPrice as product_discountedPrice',
        'product.prixachat as product_prixachat',
        'items.quantity as items_quantity',
        'items.unitPrice as items_unitPrice',
        'commande.orderDate as commande_orderDate',
        'commande.status as commande_status',
        'commande.id as commande_id', // Ajouté pour référence
        'commande.user as buyer' // Information sur l'acheteur
      ])
      .orderBy('commande.orderDate', 'DESC')
      .getRawMany();
}
 async getProductProfits(userid: number) {
    try {
      // Refresh cache
      await this.commandeRepository.manager.connection.queryResultCache?.remove(['profits_cache_key']);

      // Get all orders with items and products
      const commandes = await this.commandeRepository.find({
        relations: ['items', 'items.product', 'items.product.user'],
        cache: {
          id: 'profits_cache_key',
          milliseconds: 30000
        },
        order: { orderDate: 'DESC' }
      });

      if (!commandes || commandes.length === 0) {
        return this.createEmptyResponse();
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
                        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

      const results = {
        annualProducts: {} as Record<number, {
          productId: number;
          productName: string;
          totalProfit: number;
          totalQuantity: number;
        }>,
        monthlyProducts: {} as Record<number, Record<number, {
          productId: number;
          productName: string;
          totalProfit: number;
          totalQuantity: number;
        }>>,
        dailyProducts: {} as Record<string, Record<number, {
          productId: number;
          productName: string;
          totalProfit: number;
          totalQuantity: number;
        }>>,
        annualTotal: 0,
        monthlyTotals: {} as Record<number, {
          month: number;
          monthName: string;
          totalProfit: number;
        }>,
        dailyTotals: {} as Record<string, {
          date: string;
          totalProfit: number;
        }>,
        bestSellingProduct: null as null | {
          productId: number;
          productName: string;
          totalProfit: number;
          totalQuantity: number;
        },
        monthComparison: null as null | {
          difference: number;
          percentage: number;
        },
        lastUpdated: new Date()
      };

      // Process all orders
      for (const commande of commandes) {
        if (!commande.orderDate) {
          console.warn('Commande sans date:', commande.id);
          continue;
        }

        const orderDate = new Date(commande.orderDate);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();
        const orderDay = orderDate.getDate();
        const dateKey = `${orderYear}-${String(orderMonth + 1).padStart(2, '0')}-${String(orderDay).padStart(2, '0')}`;

        // Filter for current year only
        if (orderYear !== currentYear) continue;

        for (const item of commande.items) {
          // Verify product belongs to the seller (userid)
          if (!item.product || !item.product.user || item.product.user.id !== userid) {
            continue;
          }

          const productId = item.product.id;
          const productName = item.product.name;
          const profit = this.calculateItemProfit(item);
          const quantity = item.quantity;

          // Update statistics
          this.updateStats(results.annualProducts, productId, productName, profit, quantity);
          results.annualTotal += profit;

          if (!results.monthlyProducts[orderMonth]) {
            results.monthlyProducts[orderMonth] = {};
            results.monthlyTotals[orderMonth] = {
              month: orderMonth,
              monthName: monthNames[orderMonth],
              totalProfit: 0
            };
          }
          this.updateStats(results.monthlyProducts[orderMonth], productId, productName, profit, quantity);
          results.monthlyTotals[orderMonth].totalProfit += profit;

          if (!results.dailyProducts[dateKey]) {
            results.dailyProducts[dateKey] = {};
            results.dailyTotals[dateKey] = {
              date: dateKey,
              totalProfit: 0
            };
          }
          this.updateStats(results.dailyProducts[dateKey], productId, productName, profit, quantity);
          results.dailyTotals[dateKey].totalProfit += profit;
        }
      }

      // Find best selling product
      this.findBestSellingProduct(results);

      // Calculate month comparison
      this.calculateMonthComparison(results, currentMonth);

      return results;

    } catch (error) {
      console.error('Error in getProductProfits:', error);
      return this.createEmptyResponse();
    }
  }

  // Helper method to calculate item profit
  private calculateItemProfit(item: OrderItemEntity): number {
    if (!item.product) {
      console.warn('Item sans produit:', item.id);
      return 0;
    }
    
    const sellingPrice = item.product.discountedPrice ?? item.product.price;
    const purchasePrice = item.product.prixachat ?? 0;
    
    if (isNaN(sellingPrice) || isNaN(purchasePrice)) {
      console.error('Prix invalide pour le produit:', item.product.id);
      return 0;
    }
    
    return (sellingPrice - purchasePrice) * item.quantity;
  }

  // Helper method to update statistics
  private updateStats(
    target: Record<number, any>,
    productId: number,
    productName: string,
    profit: number,
    quantity: number
  ) {
    if (!target[productId]) {
      target[productId] = {
        productId,
        productName,
        totalProfit: 0,
        totalQuantity: 0
      };
    }
    target[productId].totalProfit += profit;
    target[productId].totalQuantity += quantity;
  }

  // Helper method to find best selling product
  private findBestSellingProduct(results: any) {
    let maxProfit = 0;
    Object.values(results.annualProducts).forEach((product: any) => {
      if (product.totalProfit > maxProfit) {
        maxProfit = product.totalProfit;
        results.bestSellingProduct = { ...product };
      }
    });
  }

  // Helper method to calculate month comparison
  private calculateMonthComparison(results: any, currentMonth: number) {
    if (currentMonth > 0) {
      const currentMonthTotal = results.monthlyTotals[currentMonth]?.totalProfit || 0;
      const previousMonthTotal = results.monthlyTotals[currentMonth - 1]?.totalProfit || 0;
      
      results.monthComparison = {
        difference: currentMonthTotal - previousMonthTotal,
        percentage: previousMonthTotal > 0 
          ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal * 100)
          : 100
      };
    }
  }

  // Helper method to create empty response
  private createEmptyResponse() {
    return {
      annualProducts: {},
      monthlyProducts: {},
      dailyProducts: {},
      annualTotal: 0,
      monthlyTotals: {},
      dailyTotals: {},
      bestSellingProduct: null,
      monthComparison: null,
      lastUpdated: new Date()
    };
  }

  // Method to force refresh statistics
  async refreshStatistics(userid: number) {
    await this.commandeRepository.manager.connection.queryResultCache?.remove(['profits_cache_key']);
    return this.getProductProfits(userid);
  }
}