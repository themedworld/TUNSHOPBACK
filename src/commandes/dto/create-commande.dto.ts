
import { IsNotEmpty, IsString, IsNumber, IsPositive, IsArray, IsUrl, IsOptional, IsEnum, IsDecimal } from 'class-validator';
export class CreateCommandeDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['Paymee', 'CIB', 'Flouci', 'COD', 'Other'])
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNotEmpty()
  items: CreateCommandeItemDto[];
}

export class CreateCommandeItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsDecimal()
  @IsNotEmpty()
  unitPrice: number;
}
