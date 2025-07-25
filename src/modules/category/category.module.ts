import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './service/category.service';
import { CategoryController } from './controller/category.controller';
import { CategoryEntity } from './entity/category.entity';
import { ServiceModule } from '../services/services.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import Booking from '../booking/entity/booking.entity';



@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, Booking]), ServiceModule, CloudinaryModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule { }
