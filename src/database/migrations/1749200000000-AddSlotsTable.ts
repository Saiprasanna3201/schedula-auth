import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlotsTable1749200000000 implements MigrationInterface {
  name = 'AddSlotsTable1749200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."slot_status_enum" AS ENUM('AVAILABLE', 'BOOKED')
    `);

    await queryRunner.query(`
      CREATE TABLE "slots" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "doctorId"        uuid NOT NULL,
        "date"            date NOT NULL,
        "startTime"       time NOT NULL,
        "endTime"         time NOT NULL,
        "status"          "public"."slot_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "durationMinutes" integer NOT NULL,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_slots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_slots_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_slots_doctor_date" ON "slots" ("doctorId", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_slots_doctor_date"`);
    await queryRunner.query(`DROP TABLE "slots"`);
    await queryRunner.query(`DROP TYPE "public"."slot_status_enum"`);
  }
}
