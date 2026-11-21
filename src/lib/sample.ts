import "server-only";
import { getPrisma } from "./db";
import { HttpError } from "./http";
import { managerOnly, type TenantContext } from "./tenant";

export async function loadSampleDesk(ctx: TenantContext) {
  managerOnly(ctx);
  const prisma = getPrisma();
  const existing = await prisma.property.count({ where: { organizationId: ctx.organizationId } });
  if (existing > 0) throw new HttpError(409, "Sample inventory is only added to an empty brokerage.");

  const org = ctx.organizationId;
  const user = ctx.user.id;

  await prisma.property.createMany({
    data: [
      {
        organizationId: org,
        title: "Indiranagar third-floor flat",
        propertyType: "APARTMENT",
        intent: "SALE",
        status: "AVAILABLE",
        priceInr: 9_400_000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqft: 1240,
        floor: 3,
        totalFloors: 4,
        city: "Bengaluru",
        locality: "Indiranagar",
        furnishing: "SEMI",
        amenities: ["parking", "lift", "power backup"],
        description: "East-facing apartment on a quiet lane, one block from 100 Feet Road. Vitrified floors and a covered car park.",
        listedByUserId: user,
      },
      {
        organizationId: org,
        title: "Koramangala 4th Block two-bed",
        propertyType: "APARTMENT",
        intent: "SALE",
        status: "AVAILABLE",
        priceInr: 11_200_000,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 980,
        city: "Bengaluru",
        locality: "Koramangala",
        furnishing: "FURNISHED",
        amenities: ["parking", "gym"],
        description: "Furnished two-bedroom in a gated block. Slightly above a 1 crore cap, useful as a stretch option.",
        listedByUserId: user,
      },
      {
        organizationId: org,
        title: "Whitefield villa plot",
        propertyType: "PLOT",
        intent: "SALE",
        status: "AVAILABLE",
        priceInr: 8_500_000,
        areaSqft: 2400,
        city: "Bengaluru",
        locality: "Whitefield",
        furnishing: "NOT_APPLICABLE",
        amenities: ["gated community"],
        description: "Corner plot in a plotted development with a formed approach road.",
        listedByUserId: user,
      },
      {
        organizationId: org,
        title: "Bandra west one-bed rental",
        propertyType: "APARTMENT",
        intent: "RENT",
        status: "AVAILABLE",
        priceInr: 85_000,
        depositInr: 300_000,
        bedrooms: 1,
        bathrooms: 1,
        areaSqft: 620,
        city: "Mumbai",
        locality: "Bandra West",
        furnishing: "FURNISHED",
        amenities: ["lift", "security"],
        description: "Furnished rental two minutes from the station, available from the first of next month.",
        listedByUserId: user,
      },
      {
        organizationId: org,
        title: "Juhu garden house",
        propertyType: "HOUSE",
        intent: "RENT",
        status: "UNDER_OFFER",
        priceInr: 250_000,
        bedrooms: 4,
        bathrooms: 4,
        areaSqft: 2800,
        city: "Mumbai",
        locality: "Juhu",
        furnishing: "SEMI",
        amenities: ["parking", "garden"],
        description: "Independent house with a small garden. Another family has an offer in, so treat it as tentative.",
        listedByUserId: user,
      },
      {
        organizationId: org,
        title: "Kalyani Nagar office floor",
        propertyType: "OFFICE",
        intent: "RENT",
        status: "AVAILABLE",
        priceInr: 140_000,
        areaSqft: 1800,
        city: "Pune",
        locality: "Kalyani Nagar",
        furnishing: "UNFURNISHED",
        amenities: ["parking", "lift", "power backup"],
        description: "Bare shell office on the second floor with two reserved basement parks.",
        listedByUserId: user,
      },
    ],
  });

  const buyer = await prisma.customer.create({
    data: {
      organizationId: org,
      name: "Meera Iyer",
      phone: "9845011122",
      email: "meera.iyer@example.com",
      kind: "BUYER",
      assignedUserId: user,
      notes: "Moving from a rented flat. Wants to be in before the school term.",
      requirements: {
        create: {
          organizationId: org,
          version: 1,
          active: true,
          intent: "SALE",
          propertyTypes: ["APARTMENT"],
          minPriceInr: 8_000_000,
          maxPriceInr: 10_000_000,
          minBedrooms: 2,
          maxBedrooms: 3,
          minAreaSqft: 900,
          cities: ["Bengaluru"],
          localities: ["Indiranagar"],
          amenities: ["parking", "lift"],
          notes: "Prefer a lift building. Indiranagar first, nearby neighbourhoods acceptable.",
          createdByUserId: user,
        },
      },
    },
  });

  await prisma.customer.create({
    data: {
      organizationId: org,
      name: "Arjun Deshpande",
      phone: "9820099001",
      email: "arjun.deshpande@example.com",
      kind: "TENANT",
      assignedUserId: user,
      notes: "Relocating for a six-month contract. Can stretch the rent slightly.",
      requirements: {
        create: {
          organizationId: org,
          version: 1,
          active: true,
          intent: "RENT",
          propertyTypes: ["APARTMENT", "HOUSE"],
          maxPriceInr: 120_000,
          minBedrooms: 1,
          cities: ["Mumbai"],
          localities: ["Bandra West"],
          amenities: ["lift"],
          createdByUserId: user,
        },
      },
      enquiries: {
        create: {
          organizationId: org,
          source: "Walk-in",
          message: "Asked about furnished flats near Bandra station, budget about 1 lakh a month.",
          status: "CONTACTED",
          createdByUserId: user,
        },
      },
    },
  });

  await prisma.followUp.create({
    data: {
      organizationId: org,
      customerId: buyer.id,
      kind: "CALL",
      notes: "Confirm whether a 2nd bedroom is enough if the flat is in Indiranagar.",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdByUserId: user,
    },
  });
}
