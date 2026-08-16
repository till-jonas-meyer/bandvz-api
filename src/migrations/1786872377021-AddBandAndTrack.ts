import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBandAndTrack1786872377021 implements MigrationInterface {
    name = 'AddBandAndTrack1786872377021'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "track" ("uuid" uuid NOT NULL, "title" character varying NOT NULL, "bandId" integer, CONSTRAINT "PK_59e8272c520a2de3a012b3ec28b" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TYPE "public"."band_status_enum" AS ENUM('draft', 'active')`);
        await queryRunner.query(`CREATE TABLE "band" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "imgUuid" uuid, "status" "public"."band_status_enum" NOT NULL DEFAULT 'draft', "userId" integer, CONSTRAINT "PK_e808d7dacf72163737ce93d7b23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "track" ADD CONSTRAINT "FK_2ceecca65935d976384d499853d" FOREIGN KEY ("bandId") REFERENCES "band"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "band" ADD CONSTRAINT "FK_b4b95fe3503748fcdda151dd719" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "band" DROP CONSTRAINT "FK_b4b95fe3503748fcdda151dd719"`);
        await queryRunner.query(`ALTER TABLE "track" DROP CONSTRAINT "FK_2ceecca65935d976384d499853d"`);
        await queryRunner.query(`DROP TABLE "band"`);
        await queryRunner.query(`DROP TYPE "public"."band_status_enum"`);
        await queryRunner.query(`DROP TABLE "track"`);
    }

}
