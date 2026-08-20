import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderColumnToTrack1787209851961 implements MigrationInterface {
    name = 'AddOrderColumnToTrack1787209851961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "track" ADD "order" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "track" DROP COLUMN "order"`);
    }

}
