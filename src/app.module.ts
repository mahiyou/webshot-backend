import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ItemModule } from './items/items.module';
import { MongooseModule } from '@nestjs/mongoose'

@Module({
  imports: [ItemModule, MongooseModule.forRoot('mongodb://127.0.0.1:27017/webshot')],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
