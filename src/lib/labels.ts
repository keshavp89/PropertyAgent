export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "PLOT",
  "LAND",
  "OFFICE",
  "COMMERCIAL",
  "WAREHOUSE",
] as const;

export const INTENTS = ["SALE", "RENT"] as const;
export const STATUSES = ["AVAILABLE", "UNDER_OFFER", "SOLD", "RENTED", "OFF_MARKET"] as const;
export const FURNISHINGS = ["UNFURNISHED", "SEMI", "FURNISHED", "NOT_APPLICABLE"] as const;
export const CUSTOMER_KINDS = ["BUYER", "TENANT", "SELLER", "LANDLORD", "INVESTOR"] as const;
export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "VIEWING", "NEGOTIATING", "WON", "LOST"] as const;
export const FOLLOW_UP_KINDS = ["CALL", "VISIT", "EMAIL", "WHATSAPP", "NOTE", "REQUIREMENT_CHANGE"] as const;

const WORDS: Record<string, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  VILLA: "Villa",
  PLOT: "Plot",
  LAND: "Land",
  OFFICE: "Office",
  COMMERCIAL: "Commercial",
  WAREHOUSE: "Warehouse",
  SALE: "Sale",
  RENT: "Rent",
  AVAILABLE: "Available",
  UNDER_OFFER: "Under offer",
  SOLD: "Sold",
  RENTED: "Rented",
  OFF_MARKET: "Off market",
  UNFURNISHED: "Unfurnished",
  SEMI: "Semi-furnished",
  FURNISHED: "Furnished",
  NOT_APPLICABLE: "Not applicable",
  BUYER: "Buyer",
  TENANT: "Tenant",
  SELLER: "Seller",
  LANDLORD: "Landlord",
  INVESTOR: "Investor",
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VIEWING: "Viewing",
  NEGOTIATING: "Negotiating",
  WON: "Won",
  LOST: "Lost",
  CALL: "Call",
  VISIT: "Visit",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  NOTE: "Note",
  REQUIREMENT_CHANGE: "Requirement change",
  strong: "Strong",
  possible: "Possible",
  stretch: "Stretch",
};

export function label(value: string) {
  return WORDS[value] ?? value;
}

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function priceLabel(intent: string, value: number) {
  const amount = formatInr(value);
  return intent === "RENT" ? `${amount} / month` : amount;
}

export function formatWhen(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
