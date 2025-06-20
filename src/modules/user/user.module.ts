import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './controller/user.controller';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import Booking from '../booking/entity/booking.entity';
import { ReviewModule } from '../review/review.module';
import Review from '../review/enitity/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Booking,Review]), CloudinaryModule,ReviewModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [TypeOrmModule]
})
export class UserModule { }
