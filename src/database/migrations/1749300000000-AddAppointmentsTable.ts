import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentsTable1749300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "appointment_status_enum" AS ENUM ('BOOKED', 'CANCELLED');
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patientId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "doctorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "slotId" UUID NOT NULL REFERENCES "slots"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "startTime" TIME NOT NULL,
        "endTime" TIME NOT NULL,
        "status" "appointment_status_enum" NOT NULL DEFAULT 'BOOKED',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_patient" ON "appointments" ("patientId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_doctor" ON "appointments" ("doctorId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_date" ON "appointments" ("date");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
  }
}
