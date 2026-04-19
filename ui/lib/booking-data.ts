export type WasteType = "general" | "heavy" | "plasterboard";

export type PlasterboardOption = "bagged" | "sheeted" | "sealed";

export type Address = {
  id: string;
  line1: string;
  city: string;
};

export type SkipDefinition = {
  size: string;
  price: number;
  hireDays: number;
  availability: "available" | "limited" | "unavailable";
  allowedForHeavyWaste: boolean;
  description: string;
};

export type SkipContract = {
  size: string;
  price: number;
  disabled: boolean;
};

export type UiSkipOption = SkipDefinition & {
  disabled: boolean;
};

export const wasteTypeOptions: Array<{
  id: WasteType;
  title: string;
  summary: string;
  badge: string;
}> = [
  {
    id: "general",
    title: "General waste",
    summary: "Mixed household and renovation waste that does not need specialist handling.",
    badge: "Standard",
  },
  {
    id: "heavy",
    title: "Heavy waste",
    summary: "Rubble, soil, and dense loads that require tighter skip-size restrictions.",
    badge: "Weight restricted",
  },
  {
    id: "plasterboard",
    title: "Plasterboard",
    summary: "Separated gypsum waste with a required handling method before booking.",
    badge: "Branched flow",
  },
];

export const plasterboardHandlingOptions: Array<{
  id: PlasterboardOption;
  title: string;
  summary: string;
  surcharge: number;
}> = [
  {
    id: "bagged",
    title: "Bagged plasterboard",
    summary: "Small volumes packed into sealed rubble bags for controlled collection.",
    surcharge: 18,
  },
  {
    id: "sheeted",
    title: "Sheeted stacks",
    summary: "Broken boards stacked separately for straightforward loading on site.",
    surcharge: 28,
  },
  {
    id: "sealed",
    title: "Sealed wrapped load",
    summary: "Higher-containment handling for larger or mixed-condition plasterboard waste.",
    surcharge: 38,
  },
];

export const postcodeFixtures: Record<string, Address[]> = {
  "SW1A 1AA": [
    { id: "addr_1", line1: "1 Buckingham Gate", city: "London" },
    { id: "addr_2", line1: "2 Buckingham Gate", city: "London" },
    { id: "addr_3", line1: "3 Birdcage Walk", city: "London" },
    { id: "addr_4", line1: "4 Birdcage Walk", city: "London" },
    { id: "addr_5", line1: "5 Queen Anne's Gate", city: "London" },
    { id: "addr_6", line1: "6 Queen Anne's Gate", city: "London" },
    { id: "addr_7", line1: "7 Great Smith Street", city: "London" },
    { id: "addr_8", line1: "8 Great Smith Street", city: "London" },
    { id: "addr_9", line1: "9 Petty France", city: "London" },
    { id: "addr_10", line1: "10 Petty France", city: "London" },
    { id: "addr_11", line1: "11 Storey's Gate", city: "London" },
    { id: "addr_12", line1: "12 Storey's Gate", city: "London" },
  ],
  "EC1A 1BB": [],
  "M1 1AE": [
    { id: "addr_13", line1: "1 Portland Street", city: "Manchester" },
    { id: "addr_14", line1: "2 Portland Street", city: "Manchester" },
    { id: "addr_15", line1: "3 Oxford Street", city: "Manchester" },
    { id: "addr_16", line1: "4 Oxford Street", city: "Manchester" },
    { id: "addr_17", line1: "5 Princess Street", city: "Manchester" },
    { id: "addr_18", line1: "6 Princess Street", city: "Manchester" },
  ],
  "BS1 4DJ": [
    { id: "addr_19", line1: "1 Welsh Back", city: "Bristol" },
    { id: "addr_20", line1: "2 Welsh Back", city: "Bristol" },
    { id: "addr_21", line1: "3 Queen Square", city: "Bristol" },
    { id: "addr_22", line1: "4 Queen Square", city: "Bristol" },
  ],
};

export const skipDefinitions: SkipDefinition[] = [
  {
    size: "4-yard",
    price: 120,
    hireDays: 7,
    availability: "available",
    allowedForHeavyWaste: true,
    description: "Best for compact clearances and smaller renovation jobs.",
  },
  {
    size: "6-yard",
    price: 170,
    hireDays: 10,
    availability: "available",
    allowedForHeavyWaste: true,
    description: "A practical builder's skip for medium household projects.",
  },
  {
    size: "8-yard",
    price: 210,
    hireDays: 10,
    availability: "available",
    allowedForHeavyWaste: true,
    description: "Versatile for room-by-room refurbishment and mixed bulky waste.",
  },
  {
    size: "10-yard",
    price: 245,
    hireDays: 14,
    availability: "limited",
    allowedForHeavyWaste: false,
    description: "Useful for larger clear-outs where the load stays relatively light.",
  },
  {
    size: "12-yard",
    price: 260,
    hireDays: 14,
    availability: "limited",
    allowedForHeavyWaste: false,
    description: "Higher-volume skip with restrictions for dense or heavy materials.",
  },
  {
    size: "14-yard",
    price: 320,
    hireDays: 14,
    availability: "available",
    allowedForHeavyWaste: true,
    description: "Ideal for bigger projects that still fit standard access constraints.",
  },
  {
    size: "16-yard",
    price: 375,
    hireDays: 21,
    availability: "limited",
    allowedForHeavyWaste: true,
    description: "Large-capacity option for extended site clearances.",
  },
  {
    size: "20-yard",
    price: 430,
    hireDays: 21,
    availability: "unavailable",
    allowedForHeavyWaste: true,
    description: "Roll-on skip currently unavailable in this prototype region.",
  },
];

export function normalisePostcode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function compactPostcode(value: string) {
  return normalisePostcode(value).replace(/\s+/g, "");
}

export function isValidUkPostcode(value: string) {
  const postcode = normalisePostcode(value);
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(postcode);
}

export function formatAddress(address: Address) {
  return `${address.line1}, ${address.city}`;
}

export function getSkipDefinition(size: string) {
  return skipDefinitions.find((skip) => skip.size === size);
}

export function getSkipContractCatalogue(heavyWaste: boolean): SkipContract[] {
  return skipDefinitions.map((skip) => ({
    size: skip.size,
    price: skip.price,
    disabled:
      skip.availability === "unavailable" ||
      (heavyWaste && !skip.allowedForHeavyWaste),
  }));
}

export function getUiSkipCatalogue(heavyWaste: boolean): UiSkipOption[] {
  return skipDefinitions.map((skip) => ({
    ...skip,
    disabled:
      skip.availability === "unavailable" ||
      (heavyWaste && !skip.allowedForHeavyWaste),
  }));
}

export function getPlasterboardHandlingDetails(option: PlasterboardOption | null) {
  return plasterboardHandlingOptions.find((item) => item.id === option) ?? null;
}

export function calculateCharges(input: {
  skipPrice: number;
  heavyWaste: boolean;
  plasterboard: boolean;
  plasterboardOption: PlasterboardOption | null;
}) {
  const serviceFee = 24;
  const environmentalFee = 16;
  const heavyWasteSurcharge = input.heavyWaste ? 42 : 0;
  const plasterboardHandlingFee = input.plasterboard
    ? (getPlasterboardHandlingDetails(input.plasterboardOption)?.surcharge ?? 0)
    : 0;
  const subtotal =
    input.skipPrice +
    serviceFee +
    environmentalFee +
    heavyWasteSurcharge +
    plasterboardHandlingFee;
  const vat = Number((subtotal * 0.2).toFixed(2));
  const total = Number((subtotal + vat).toFixed(2));

  return {
    serviceFee,
    environmentalFee,
    heavyWasteSurcharge,
    plasterboardHandlingFee,
    subtotal,
    vat,
    total,
  };
}
