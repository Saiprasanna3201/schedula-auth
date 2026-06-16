import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchedulingTables1749400000000 implements MigrationInterface {
  name = 'AddSchedulingTables1749400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."scheduling_type_enum" AS ENUM('STREAM', 'WAVE')
    `);

    await queryRunner.query(`
      CREATE TABLE "doctor_scheduling_config" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "doctorId"              uuid NOT NULL,
        "schedulingType"        "public"."scheduling_type_enum" NOT NULL,
        "slotDurationMinutes"   integer,
        "bufferMinutes"         integer DEFAULT 0,
        "maxPatientsPerWindow"  integer,
        "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_scheduling_config" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_doctor_scheduling_config_doctor" UNIQUE ("doctorId"),
        CONSTRAINT "FK_scheduling_config_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "wave_bookings" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "doctorId"    uuid NOT NULL,
        "patientId"   uuid NOT NULL,
        "date"        date NOT NULL,
        "windowStart" time NOT NULL,
        "windowEnd"   time NOT NULL,
        "tokenNumber" integer NOT NULL,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wave_bookings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wave_bookings_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wave_bookings_patient"
          FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wave_bookings_doctor_date_window"
        ON "wave_bookings" ("doctorId", "date", "windowStart", "windowEnd")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_wave_bookings_doctor_date_window"`);
    await queryRunner.query(`DROP TABLE "wave_bookings"`);
    await queryRunner.query(`DROP TABLE "doctor_scheduling_config"`);
    await queryRunner.query(`DROP TYPE "public"."scheduling_type_enum"`);
  }
}
