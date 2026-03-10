export const CURRENCIES = [
  { code: 'DZD', symbol: 'DA', label: 'Dinar Algérien', locale: 'fr-DZ' },
  { code: 'EUR', symbol: '€', label: 'Euro', locale: 'fr-FR' },
  { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
  { code: 'MAD', symbol: 'DH', label: 'Dirham Marocain', locale: 'fr-MA' },
  { code: 'TND', symbol: 'DT', label: 'Dinar Tunisien', locale: 'fr-TN' },
  { code: 'XAF', symbol: 'FCFA', label: 'Franc CFA (CEMAC)', locale: 'fr-CM' },
  { code: 'XOF', symbol: 'FCFA', label: 'Franc CFA (BCEAO)', locale: 'fr-SN' },
  { code: 'SAR', symbol: 'SR', label: 'Riyal Saoudien', locale: 'ar-SA' },
  { code: 'AED', symbol: 'DH', label: 'Dirham des Émirats', locale: 'ar-AE' },
  { code: 'CAD', symbol: '$', label: 'Dollar Canadien', locale: 'en-CA' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse', locale: 'fr-CH' },
  { code: 'TRY', symbol: '₺', label: 'Lire Turque', locale: 'tr-TR' },
  { code: 'CNY', symbol: '¥', label: 'Yuan Chinois', locale: 'zh-CN' },
  { code: 'JPY', symbol: '¥', label: 'Yen Japonais', locale: 'ja-JP' },
];

export function getCurrencyConfig(code: string = 'DZD') {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}
