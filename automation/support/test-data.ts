export const lookupFixtures = {
  populated: {
    postcode: "SW1A 1AA",
    addressCount: 12,
  },
  empty: {
    postcode: "EC1A 1BB",
  },
  delayed: {
    postcode: "M1 1AE",
    addressCount: 6,
  },
  retryableFailure: {
    postcode: "BS1 4DJ",
    addressCount: 4,
    errorMessage: "Temporary lookup outage for this postcode. Please retry the search.",
  },
  unsupported: {
    postcode: "W1A 0AX",
    errorMessage:
      "No fixture data is available for this postcode yet. You can enter the address manually.",
  },
} as const;

export const manualAddress = {
  line1: "Broadcast House",
  city: "London",
} as const;
