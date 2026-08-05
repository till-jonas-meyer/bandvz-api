import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

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
}