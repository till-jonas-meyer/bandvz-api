import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from "typeorm";
import { Band } from '../band/Band'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  activationCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  resetCode: string | null;

  @Column()
  active: boolean;

  @OneToMany(() => Band, (band) => band.user)
  bands: Band[];
}