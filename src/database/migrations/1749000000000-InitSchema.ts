import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1749000000000 implements MigrationInterface {
  name = 'InitSchema1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Role enum
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('DOCTOR', 'PATIENT')`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create doctor_profiles table
    await queryRunner.query(`
      CREATE TABLE "doctor_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fullName" character varying NOT NULL,
        "specialization" character varying NOT NULL,
        "experience" integer NOT NULL,
        "qualification" character varying NOT NULL,
        "consultationFee" numeric(10,2) NOT NULL,
        "availabilityHours" text,
        "profileDetails" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_doctor_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_doctor_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctor_profiles_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create patient_profiles table
    await queryRunner.query(`
      CREATE TABLE "patient_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fullName" character varying NOT NULL,
        "age" integer NOT NULL,
        "gender" character varying NOT NULL,
        "contactNumber" character varying NOT NULL,
        "address" character varying,
        "basicHealthInfo" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_patient_profiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_patient_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patient_profiles_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patient_profiles"`);
    await queryRunner.query(`DROP TABLE "doctor_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
