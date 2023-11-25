import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemsController } from './items.controller';
import { ItemSchema } from './schemas/item.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'images', schema: ItemSchema}])],
  controllers: [ItemsController],
  providers: [],
})
export class ItemModule {}
