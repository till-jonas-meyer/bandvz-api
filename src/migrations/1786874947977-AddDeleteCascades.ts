import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeleteCascades1786874947977 implements MigrationInterface {
    name = 'AddDeleteCascades1786874947977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "track" DROP CONSTRAINT "FK_2ceecca65935d976384d499853d"`);
        await queryRunner.query(`ALTER TABLE "band" DROP CONSTRAINT "FK_b4b95fe3503748fcdda151dd719"`);
        await queryRunner.query(`ALTER TABLE "track" ADD CONSTRAINT "FK_2ceecca65935d976384d499853d" FOREIGN KEY ("bandId") REFERENCES "band"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "band" ADD CONSTRAINT "FK_b4b95fe3503748fcdda151dd719" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "band" DROP CONSTRAINT "FK_b4b95fe3503748fcdda151dd719"`);
        await queryRunner.query(`ALTER TABLE "track" DROP CONSTRAINT "FK_2ceecca65935d976384d499853d"`);
        await queryRunner.query(`ALTER TABLE "band" ADD CONSTRAINT "FK_b4b95fe3503748fcdda151dd719" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "track" ADD CONSTRAINT "FK_2ceecca65935d976384d499853d" FOREIGN KEY ("bandId") REFERENCES "band"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
