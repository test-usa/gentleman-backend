import { AbstractionEntity } from 'src/database/abstraction.entity';
import Booking from 'src/modules/booking/entity/booking.entity';
import {
  Entity,
  Column,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

@Entity()
export class VehicleTypeEntity extends AbstractionEntity {

  @Column()
  name: string;

  @Column()
  icon: string;

  @OneToMany(() => VehicleTypeEntity, (vehicleTypeEntity) => vehicleTypeEntity.vehicleTypes)
  vehicleTypes: VehicleTypeEntity[]

  @OneToOne(() => Booking, (booking) => booking.vehicleType, { eager: true })
  @JoinColumn()
  booking: Booking



  constructor(entity?: Partial<VehicleTypeEntity>) {
    super();
    Object.assign(this, entity);
  }
}
