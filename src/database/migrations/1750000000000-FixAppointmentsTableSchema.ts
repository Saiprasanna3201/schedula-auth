import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAppointmentsTableSchema1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old table entirely (test data only, safe to recreate)
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum";`);

    // Recreate to match current Appointment entity exactly
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "doctorId" UUID NOT NULL REFERENCES "doctor_profiles"("id") ON DELETE CASCADE,
        "patientId" UUID NOT NULL REFERENCES "patient_profiles"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "startTime" VARCHAR(5) NOT NULL,
        "endTime" VARCHAR(5) NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'BOOKED',
        "tokenNumber" INT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "IDX_appointments_doctor" ON "appointments" ("doctorId");`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_patient" ON "appointments" ("patientId");`);
    await queryRunner.query(`CREATE INDEX "IDX_appointments_date" ON "appointments" ("date");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments" CASCADE;`);
  }
}
