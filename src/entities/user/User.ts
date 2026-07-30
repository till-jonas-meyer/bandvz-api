import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  activationCode: string;

  @Column({ nullable: true })
  resetCode: string;

  @Column()
  active: boolean;
}