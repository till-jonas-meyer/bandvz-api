import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileExtToTrack1788072248978 implements MigrationInterface {
    name = 'AddFileExtToTrack1788072248978'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "track" ADD "fileExt" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "track" DROP COLUMN "fileExt"`);
    }

}
