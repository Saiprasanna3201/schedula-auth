import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvailabilityTables1749100000000 implements MigrationInterface {
  name = 'AddAvailabilityTables1749100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Day of week enum
    await queryRunner.query(`
      CREATE TYPE "public"."day_of_week_enum" AS ENUM(
        'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'
      )
    `);

    // Recurring availability table
    await queryRunner.query(`
      CREATE TABLE "recurring_availability" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "doctorId"   uuid NOT NULL,
        "dayOfWeek"  "public"."day_of_week_enum" NOT NULL,
        "startTime"  time NOT NULL,
        "endTime"    time NOT NULL,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recurring_availability" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recurring_availability_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Custom availability override table
    await queryRunner.query(`
      CREATE TABLE "custom_availability" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "doctorId"   uuid NOT NULL,
        "date"       date NOT NULL,
        "startTime"  time NOT NULL,
        "endTime"    time NOT NULL,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_custom_availability" PRIMARY KEY ("id"),
        CONSTRAINT "FK_custom_availability_doctor"
          FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "custom_availability"`);
    await queryRunner.query(`DROP TABLE "recurring_availability"`);
    await queryRunner.query(`DROP TYPE "public"."day_of_week_enum"`);
  }
}
