-- CreateEnum
CREATE TYPE "ListingIntent" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'LAND', 'OFFICE', 'COMMERCIAL', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'UNDER_OFFER', 'SOLD', 'RENTED', 'OFF_MARKET');

-- CreateEnum
CREATE TYPE "Furnishing" AS ENUM ('UNFURNISHED', 'SEMI', 'FURNISHED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CustomerKind" AS ENUM ('BUYER', 'TENANT', 'SELLER', 'LANDLORD', 'INVESTOR');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "FollowUpKind" AS ENUM ('CALL', 'VISIT', 'EMAIL', 'WHATSAPP', 'NOTE', 'REQUIREMENT_CHANGE');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "intent" "ListingIntent" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "priceInr" INTEGER NOT NULL,
    "depositInr" INTEGER,
    "maintenanceInr" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "areaSqft" INTEGER,
    "floor" INTEGER,
    "totalFloors" INTEGER,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "addressLine" TEXT,
    "furnishing" "Furnishing" NOT NULL DEFAULT 'UNFURNISHED',
    "amenities" TEXT[],
    "description" TEXT NOT NULL,
    "listedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "kind" "CustomerKind" NOT NULL,
    "assignedUserId" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "intent" "ListingIntent" NOT NULL,
    "propertyTypes" "PropertyType"[],
    "minPriceInr" INTEGER,
    "maxPriceInr" INTEGER,
    "minBedrooms" INTEGER,
    "maxBedrooms" INTEGER,
    "minAreaSqft" INTEGER,
    "cities" TEXT[],
    "localities" TEXT[],
    "amenities" TEXT[],
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "requirementId" TEXT,
    "kind" "FollowUpKind" NOT NULL,
    "notes" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Property_organizationId_intent_status_idx" ON "Property"("organizationId", "intent", "status");

-- CreateIndex
CREATE INDEX "Property_organizationId_city_idx" ON "Property"("organizationId", "city");

-- CreateIndex
CREATE INDEX "Property_organizationId_updatedAt_idx" ON "Property"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Customer_organizationId_assignedUserId_idx" ON "Customer"("organizationId", "assignedUserId");

-- CreateIndex
CREATE INDEX "Customer_organizationId_updatedAt_idx" ON "Customer"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Requirement_organizationId_customerId_active_idx" ON "Requirement"("organizationId", "customerId", "active");

-- CreateIndex
CREATE INDEX "Enquiry_organizationId_status_createdAt_idx" ON "Enquiry"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_organizationId_customerId_idx" ON "Enquiry"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "FollowUp_organizationId_dueAt_idx" ON "FollowUp"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUp_organizationId_customerId_idx" ON "FollowUp"("organizationId", "customerId");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
