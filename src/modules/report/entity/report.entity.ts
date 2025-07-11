import { Column, Entity, ManyToOne } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { AbstractionEntity } from 'src/database/abstraction.entity';
import Booking from 'src/modules/booking/entity/booking.entity';

@Entity('reports')
export class Report extends AbstractionEntity{
 

  @Column('text')
  description: string;

  @Column('simple-array', { nullable: true })
  imageUrls: string[];

  @Column()
  refundType: 'FULL' | 'PARTIAL' | 'EXPERIENCE_ONLY';

  @Column()
  requestedAmount: string;

  @ManyToOne(() => User, (user) => user.reports)
  user: User;

  @ManyToOne(() => Booking, (booking) => booking.reports)
booking: Booking;

  constructor(entity?: Partial<Report>) {
    super();
    Object.assign(this, entity);
  }

}
