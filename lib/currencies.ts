// lib/currencies.ts

export interface CaribbeanCurrency {
  code: string;
  symbol: string;
  name: string;
}

export const CARIBBEAN_CURRENCIES: CaribbeanCurrency[] = [
  { code: "XCD", symbol: "EC$", name: "Eastern Caribbean Dollar" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "BBD", symbol: "Bds$", name: "Barbadian Dollar" },
  { code: "TTD", symbol: "TT$", name: "Trinidad & Tobago Dollar" },
  { code: "JMD", symbol: "J$", name: "Jamaican Dollar" },
  { code: "GYD", symbol: "G$", name: "Guyanese Dollar" },
];

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // XCD countries
  "Saint Lucia": "XCD",
  "Antigua and Barbuda": "XCD",
  "Dominica": "XCD",
  "Grenada": "XCD",
  "Saint Kitts and Nevis": "XCD",
  "Saint Vincent and the Grenadines": "XCD",
  "Montserrat": "XCD",
  "Anguilla": "XCD",
  // Individual currencies
  "Barbados": "BBD",
  "Trinidad and Tobago": "TTD",
  "Jamaica": "JMD",
  "Guyana": "GYD",
  // USD territories
  "United States Virgin Islands": "USD",
  "British Virgin Islands": "USD",
  "Puerto Rico": "USD",
  "Turks and Caicos Islands": "USD",
};

export function getCurrencyForCountry(country: string): CaribbeanCurrency {
  const code = COUNTRY_CURRENCY_MAP[country] || "XCD";
  return getCurrencyByCode(code) || CARIBBEAN_CURRENCIES[0];
}

export function getCurrencyByCode(code: string): CaribbeanCurrency | undefined {
  return CARIBBEAN_CURRENCIES.find((c) => c.code === code);
}
