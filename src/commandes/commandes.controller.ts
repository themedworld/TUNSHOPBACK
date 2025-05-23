import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { CommandesService } from './commandes.service';
import { CreateCommandeDto } from './dto/create-commande.dto';

@Controller('commandes')
export class CommandesController {
  constructor(private readonly commandesService: CommandesService) {}

  @Post()
  create(@Body() createCommandeDto: CreateCommandeDto) {
    return this.commandesService.create(createCommandeDto);
  }

@Get('seller/:sellerId/products')
async getSoldProducts(@Param('sellerId') sellerId: string) {
  return this.commandesService.getSoldProducts(+sellerId);
}
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.commandesService.findByUser(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commandesService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCommandeDto: any) {
    return this.commandesService.update(+id, updateCommandeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commandesService.remove(+id);
  }
}