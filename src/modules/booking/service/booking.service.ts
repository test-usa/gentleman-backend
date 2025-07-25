import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Booking, {
  BookingStatus,
  BookingWorkStatus,
  PaymentStatus as bookingPaymentStatu,
  PaymentStatus as bookingPaymentStatus,
} from '../entity/booking.entity';
import { Repository } from 'typeorm';
import { CreateBookingDto } from '../dto/create-booking.dto';
import {
  UpdateBookingDto,
  UpdateBookingStatusDto,
  UpdateBookingWorkStatusDto,
  UpdatePaymentStatusDto,
} from '../dto/update-booking.dto';
import ApiError from 'src/common/errors/ApiError';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { VehicleTypeEntity } from 'src/modules/vehicleTypes/entity/vehicle-type.entity';
import { CategoryEntity } from 'src/modules/category/entity/category.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { PaymentStatus } from 'src/modules/payment/entity/payment.enum';
import { PaymentEntity } from 'src/modules/payment/entity/payment.entity';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { VehicleEntity } from 'src/modules/vehicle/entity/vehicle.entity';

@Injectable()
export class BookingService {
  private stripe: Stripe;
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleTypeRepo: Repository<VehicleTypeEntity>,

    @InjectRepository(User)
    private readonly providerRepo: Repository<User>,

    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(VehicleEntity)
    private readonly vehicleRepo: Repository<VehicleEntity>,

    private readonly cloudinary: CloudinaryService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('stripe_secret_key') as string,
    );
  }

  //  async createBooking(
  //   dto: CreateBookingDto,
  //   userId: string,
  //   images: Express.Multer.File[],
  //   vehicleImage?: Express.Multer.File,
  // ): Promise<Booking> {
  //   // Validate foreign keys exist

  //   if(dto.vehicleTypesId){
  //     const vehicleTypeExists = await this.vehicleTypeRepo.findOneBy({ id: dto.vehicleTypesId });
  //   if (!vehicleTypeExists) {
  //     throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid vehicleTypesId: not found');
  //   }
  //   }

  //   const providerExists = await this.providerRepo.findOneBy({ id: dto.providerId });
  //   if (!providerExists) {
  //     throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid providerId: not found');
  //   }

  //   const categoryExists = await this.categoryRepo.findOneBy({ id: dto.categoryId });
  //   if (!categoryExists) {
  //     throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid categoryId: not found');
  //   }
  //   console.log(userId)
  //   const userExists = await this.userRepo.findOneBy({ id: userId });
  //   if (!userExists) {
  //     throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid userId: not found');
  //   }

  //   // Upload images

  //   let imageUrls: string[] = [];
  //   let vehicleImageUrl: string | null | undefined = null;

  //   if (images.length) {
  //     try {
  //       const uploadPromises = images.map(file =>
  //         this.cloudinary.uploadFile(file),
  //       );

  //       const results = await Promise.all(uploadPromises);
  //       imageUrls = results.map(res => res.secure_url);
  //     } catch (error) {
  //       throw new ApiError(
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //         'Image upload failed',
  //       );
  //     }
  //   }

  //   if (vehicleImage) {
  //     try {
  //       const result = await this.cloudinary.uploadFile(vehicleImage);
  //       vehicleImageUrl = result.secure_url;
  //     } catch (error) {
  //       throw new ApiError(
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //         'Vehicle image upload failed',
  //       );
  //     }
  //   }

  //   dto.vehicleImage = vehicleImageUrl ?? undefined;

  //   console.log(dto)

  //   const booking = this.bookingRepo.create({
  //     ...dto,
  //     vehicleType: { id: dto.vehicleTypesId },
  //     user: { id: userId },
  //     provider: { id: dto.providerId },
  //     category: { id: dto.categoryId },
  //     dentImg: imageUrls,
  //   });

  //   return this.bookingRepo.save(booking);
  // }

  async createBooking(
    dto: CreateBookingDto,
    userId: string,
    images: Express.Multer.File[],
    vehicleImage?: Express.Multer.File,
  ): Promise<Booking> {
    // Validate foreign keys
    if (dto.vehicleTypesId) {
      const vehicleTypeExists = await this.vehicleTypeRepo.findOneBy({
        id: dto.vehicleTypesId,
      });
      if (!vehicleTypeExists) {
        throw new ApiError(
          HttpStatus.BAD_REQUEST,
          'Invalid vehicleTypesId: not found',
        );
      }
    }

    const providerExists = await this.providerRepo.findOneBy({
      id: dto.providerId,
    });
    if (!providerExists) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Invalid providerId: not found',
      );
    }

    const categoryExists = await this.categoryRepo.findOneBy({
      id: dto.categoryId,
    });
    if (!categoryExists) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        'Invalid categoryId: not found',
      );
    }

    const userExists = await this.userRepo.findOneBy({ id: userId });
    if (!userExists) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid userId: not found');
    }

    if (dto.vehicleId) {
      const vehicleExists = await this.vehicleRepo.findOneBy({
        id: dto.vehicleId,
      });
      if (!vehicleExists) {
        throw new ApiError(
          HttpStatus.BAD_REQUEST,
          'Invalid vehicleId: not found',
        );
      }
    }

    // Upload images
    let imageUrls: string[] = [];
    let vehicleImageUrl: string | undefined = undefined;

    if (images?.length) {
      try {
        const uploadPromises = images.map((file) =>
          this.cloudinary.uploadFile(file),
        );
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map((res) => res.secure_url);
      } catch (error) {
        throw new ApiError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Image upload failed',
        );
      }
    }

    if (vehicleImage) {
      try {
        const result = await this.cloudinary.uploadFile(vehicleImage);
        vehicleImageUrl = result.secure_url;
      } catch (error) {
        throw new ApiError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Vehicle image upload failed',
        );
      }
    }

    dto.vehicleImage = vehicleImageUrl;

    const booking = this.bookingRepo.create({
      ...dto,
      vehicleType: dto.vehicleTypesId ? { id: dto.vehicleTypesId } : undefined,
      user: { id: userId },
      provider: { id: dto.providerId },
      category: { id: dto.categoryId },
      dentImg: imageUrls,
      vehicle: dto.vehicleId ? { id: dto.vehicleId } : undefined,
    });

    return this.bookingRepo.save(booking);
  }

  async updateBooking(id: string, dto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.getBookingById(id);

    Object.assign(booking, {
      ...dto,
      vehicleType: dto.vehicleTypesId
        ? { id: dto.vehicleTypesId }
        : booking.vehicleType,
      user: dto.userId ? { id: dto.userId } : booking.user,
      provider: dto.providerId ? { id: dto.providerId } : booking.provider,
      category: dto.categoryId ? { id: dto.categoryId } : booking.category,
    });

    return this.bookingRepo.save(booking);
  }

  async updateBookingStatus(
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.getBookingById(id);
    booking.status = dto.status;
    return this.bookingRepo.save(booking);
  }

  async updateWorkStatus(
    id: string,
    dto: UpdateBookingWorkStatusDto,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['provider', 'payment'],
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.workStatus === dto.workStatus) {
      throw new Error('Work status is already Completed');
    }

    // Only update workStatus if the booking status is "Accept"
    if (
      booking.status !== BookingStatus.Accept
    ) {
      throw new Error(
        'Cannot update work status unless booking is accepted or completed.',
      );
    }
    // Set the new work status
    booking.workStatus = dto.workStatus;

    // If all 3 conditions met: credit provider balance
    if (booking.workStatus === BookingWorkStatus.Completed) {
      if (booking.status !== BookingStatus.Accept) {
        throw new ForbiddenException('booking status must be Accept');
      }

      if (booking.paymentStatus !== bookingPaymentStatus.Completed) {
        throw new ForbiddenException('paymentStatus must be Completed');
      }

      if (
        booking.workStatus === BookingWorkStatus.Completed &&
        booking.status === BookingStatus.Accept &&
        booking.paymentStatus === bookingPaymentStatus.Completed
      ) {
        const rawAmount = booking.payment?.amount || 0;
        console.log('rawAmount', rawAmount);
        const paymentAmount = Number(rawAmount);

        if (!paymentAmount || isNaN(paymentAmount)) {
          throw new Error('Invalid or missing payment amount');
        }

        const currentBalance = Number(booking.provider.balance) || 0;

        booking.provider.balance = currentBalance + paymentAmount;

        await this.userRepo.save(booking.provider);
      }

      console.log(booking.provider.balance);
    }

    return this.bookingRepo.save(booking);
  }

  async updatePaymentStatus(
    id: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<Booking> {
    const booking = await this.getBookingById(id);
    booking.paymentStatus = dto.paymentStatus;
    return this.bookingRepo.save(booking);
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: [
        'user',
        'provider',
        'vehicleType',
        'category',
        'payment',
        'reviews',
      ],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelBooking(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['payment'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Always update booking status to Reject
    booking.status = BookingStatus.Reject;

    // If there is a completed payment, issue refund
    if (
      booking.payment &&
      booking.payment.status === PaymentStatus.COMPLETED &&
      booking.payment.senderPaymentTransaction
    ) {
      // Refund via Stripe
      await this.stripe.refunds.create({
        payment_intent: booking.payment.senderPaymentTransaction,
      });

      booking.paymentStatus = bookingPaymentStatus.Refund;
      booking.payment.status = PaymentStatus.REFUNDED;

      await this.paymentRepo.save(booking.payment);
    } else {
      // No refund necessary (Pending or no payment)
      booking.paymentStatus = bookingPaymentStatus.Pending;
    }

    await this.bookingRepo.save(booking);

    return {
      message: 'Booking cancelled successfully',
      refundIssued: booking.payment?.status === PaymentStatus.REFUNDED,
      booking,
    };
  }

  async getAllBookings(page: number, limit: number, order: 'ASC' | 'DESC') {
    const [data, total] = await this.bookingRepo.findAndCount({
      order: { createdAt: order },
      relations: ['user', 'payment'],
    });

    return {
      total,
      page,
      limit,
      data,
    };
  }

  async getCustomerAllBookings(customerId: string) {
  const [data] = await this.bookingRepo.findAndCount({
    where: {
      user: { id: customerId },
    },
    relations: [
      'user',
      'payment',
      'provider',
      'vehicleType',
    ],
    order: {
      createdAt: 'DESC',
    },
  });

  return data;
}


  async getBookingsByProvider(

    page: number,
    limit: number,
    order: 'ASC' | 'DESC' = 'DESC',
  ) {
    const [bookings, total] = await this.bookingRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: [
        'user',
        'provider',
        'payment',
        'vehicle',
        'category',
        'vehicleType',
      ],
      order: { createdAt: order },
    });

    return {
      total,
      page,
      limit,
      data: bookings,
    };
  }

  async getPendingBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: {
        status: BookingStatus.Accept,
        provider: { id: userId },
      },
      relations: [
        'user',
        'provider',
        'vehicleType',
        'category',
        'payment',
        'reviews',
      ],
    });
  }

   async getAcceptAndRejectedBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: {
        status: BookingStatus.Pending,
        provider: { id: userId },
      },
      relations: [
        'user',
        'provider',
        'vehicleType',
        'category',
        'payment',
        'reviews',
      ],
    });
  }

  async getCompletedBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: {
        status: BookingStatus.Accept,
        workStatus: BookingWorkStatus.Completed,
        provider: { id: userId },
      },
      relations: [
        'user',
        'provider',
        'vehicleType',
        'category',
        'payment',
        'reviews',
      ],
    });
  }

  async getBookingLocations() {
    return this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.latitude IS NOT NULL')
      .andWhere('booking.longitude IS NOT NULL')
      .select([
        'booking.id',
        'booking.latitude',
        'booking.longitude',
        'booking.status',
        'booking.workStatus',
      ])
      .getMany();
  }
}
