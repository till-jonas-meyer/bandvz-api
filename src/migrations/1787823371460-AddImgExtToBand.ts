import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImgExtToBand1787823371460 implements MigrationInterface {
    name = 'AddImgExtToBand1787823371460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "band" ADD "imgExt" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "band" DROP COLUMN "imgExt"`);
    }

}
