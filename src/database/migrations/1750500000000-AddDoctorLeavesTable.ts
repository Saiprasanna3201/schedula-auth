import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorLeavesTable1750500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doctor_leaves" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "doctorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "leaveDate" DATE NOT NULL,
        "reason" VARCHAR NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE ("doctorId", "leaveDate")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_doctor_leaves_doctorId" ON "doctor_leaves" ("doctorId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_doctor_leaves_leaveDate" ON "doctor_leaves" ("leaveDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "doctor_leaves";`);
  }
}
