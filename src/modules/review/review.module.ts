import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Booking from '../booking/entity/booking.entity';
import { ReviewController } from './controller/review.controller';
import { ReviewService } from './service/service.service';
import Review from './enitity/review.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking])],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule { }
