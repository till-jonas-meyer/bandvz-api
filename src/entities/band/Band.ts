import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { User } from '../user/User';
import { Track } from '../track/Track';

export enum BandStatus {
  draft = 'draft',
  active = 'active'
};

@Entity()
export class Band {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'uuid', nullable: true })
  imgUuid: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  imgExt: string | null;

  @Column({ type: 'enum', enum: BandStatus, default: BandStatus.draft })
  status: BandStatus

  @ManyToOne(() => User, (user) => user.bands, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Track, (track) => track.band)
  tracks: Track[];
}
