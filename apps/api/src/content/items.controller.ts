import { Controller, Get, NotFoundException, Param, UseInterceptors } from '@nestjs/common';
import type { ItemDetail } from '@tokito/shared';
import { PublicCacheInterceptor } from './cache';
import { ItemsService } from './items.service';
import { idSchema, parseParam } from './schemas/params.schema';

@UseInterceptors(PublicCacheInterceptor)
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<ItemDetail> {
    const detail = await this.items.getDetail(parseParam(idSchema, id, 'id'));
    if (!detail) {
      throw new NotFoundException(`No existe el ítem "${id}"`);
    }
    return detail;
  }
}
