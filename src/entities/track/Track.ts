import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne
} from 'typeorm';
import { Band } from '../band/Band';

@Entity()
export class Track {

  @PrimaryColumn('uuid')
  uuid: string;

  @Column()
  title: string;

  @ManyToOne(() => Band, (band) => band.tracks, { onDelete: 'CASCADE' })
  band: Band;

  @Column()
  order: number;
}