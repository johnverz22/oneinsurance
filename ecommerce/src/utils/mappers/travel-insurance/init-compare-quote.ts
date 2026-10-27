import { TravelInsuranceFormData } from '@/types/travel-insurance/travel-insurance-request'

/**
 * Flat compare-quote init payload — docs/api_docs_latest/compare-quote-flat-payload-fe.md.
 * The backend rejects the old InsureMo-shaped body with a 422.
 */
export interface InitCompareQuoteRequest {
  origin_country: string
  destination_countries: string[]
  return_destination?: string
  departure_date: string | null
  return_date: string | null
  traveler_count: number
  principal_date_of_birth: string | null
  agent_code: string
  slug: string
}

/**
 * Maps internal coverage-map country codes to ISO 3166-1 alpha-2 codes
 * required by the IGW compare-quote API.
 *
 * Domestic city codes (MANILA, CEBU CITY, etc.) all map to "PH" because
 * the API only accepts country-level ISO codes.
 */
const COUNTRY_TO_ISO2: Record<string, string> = {
  // Origin
  PHILIPPINES: 'PH',

  // APAC
  BANGLADESH: 'BD',
  BHUTAN: 'BT',
  BRUNELDARUSSALAM: 'BN',
  CAMBODIA: 'KH',
  CHINA: 'CN',
  CHINAHONGKONGSAR: 'HK',
  CHINAMACAUSAR: 'MO',
  CHINATIBET: 'CN',
  EASTTIMOR: 'TL',
  EGYPT: 'EG',
  INDIA: 'IN',
  INDONESIA: 'ID',
  JAPAN: 'JP',
  KOREASOUTH: 'KR',
  LAOPDR: 'LA',
  MALAYSIA: 'MY',
  MALDIVES: 'MV',
  MONGOLIA: 'MN',
  MYANMARBURMA: 'MM',
  NEPAL: 'NP',
  SINGAPORE: 'SG',
  SRILANKA: 'LK',
  TAIWAN: 'TW',
  THAILAND: 'TH',
  TIMORLESTE: 'TL',
  TURKEY: 'TR',
  VARIOUSASIA: 'PH', // fallback — shouldn't be sent
  VIETNAM: 'VN',

  // SCHENGEN
  ALBANIA: 'AL',
  ANDORRA: 'AD',
  AUSTRIA: 'AT',
  BELGIUM: 'BE',
  BOSNIAHERZEGOVINA: 'BA',
  BRITISHINDIANOCEANTERRITORY: 'IO',
  BULGARIA: 'BG',
  CROATIA: 'HR',
  CYPRUS: 'CY',
  CZECHREPUBLIC: 'CZ',
  DENMARK: 'DK',
  ESTONIA: 'EE',
  FAROEISLANDS: 'FO',
  FINLAND: 'FI',
  FRANCE: 'FR',
  GERMANY: 'DE',
  GIBRALTAR: 'GI',
  GREECE: 'GR',
  GREENLAND: 'GL',
  GUERNSEY: 'GG',
  HUNGARY: 'HU',
  ICELAND: 'IS',
  IRELAND: 'IE',
  'ISLE OF MAN': 'IM',
  ITALY: 'IT',
  JERSEY: 'JE',
  KOSOVO: 'XK',
  LATVIA: 'LV',
  LIECHTENSTEIN: 'LI',
  LITHUANIA: 'LT',
  LUXEMBOURG: 'LU',
  MACEDONIAREPOF: 'MK',
  MALTA: 'MT',
  MOLDOVA: 'MD',
  MONACO: 'MC',
  MONTENEGRO: 'ME',
  NETHERLANDS: 'NL',
  NORTHERNIRELAND: 'GB',
  NORWAY: 'NO',
  POLAND: 'PL',
  PORTUGAL: 'PT',
  ROMANIA: 'RO',
  SAINTBARTHELEMY: 'BL',
  SAINTPIERREANDMIQUELON: 'PM',
  SANMARINO: 'SM',
  SCOTLAND: 'GB',
  SERBIA: 'RS',
  SINTMAARTEN: 'SX',
  SLOVAKIA: 'SK',
  SLOVENIA: 'SI',
  SPAIN: 'ES',
  'SVALBARD AND JAN MAYEN': 'SJ',
  SWEDEN: 'SE',
  SWITZERLAND: 'CH',
  TURKSANDCAICOSISLANDS: 'TC',
  UNITEDKINGDOM: 'GB',
  VARIOUSSCHENGEN: 'DE', // fallback
  VATICANCITYSTATE: 'VA',
  WALES: 'GB',

  // WORLD
  ALGERIA: 'DZ',
  AMERICANSAMOA: 'AS',
  ANGOLA: 'AO',
  ANGUILLA: 'AI',
  ANTARCTICA: 'AQ',
  ANTIGUAANDBARBUDA: 'AG',
  ARGENTINA: 'AR',
  ARMENIA: 'AM',
  ARUBA: 'AW',
  AUSTRALIA: 'AU',
  AZERBAIJAN: 'AZ',
  BAHAMAS: 'BS',
  BAHRAIN: 'BH',
  BARBADOS: 'BB',
  BELIZE: 'BZ',
  BENIN: 'BJ',
  BERMUDA: 'BM',
  BOLIVIA: 'BO',
  BOTSWANA: 'BW',
  BRASIL: 'BR',
  BRITISHVIRGINISLANDS: 'VG',
  BURUNDI: 'BI',
  CAMEROON: 'CM',
  CANADA: 'CA',
  CAPEVERDE: 'CV',
  CAYMANISLANDS: 'KY',
  CHAD: 'TD',
  CHILE: 'CL',
  CHRISTMASISLAND: 'CX',
  COCOSISLAND: 'CC',
  COLOMBIA: 'CO',
  COMOROS: 'KM',
  CONGODEMREPKINSHASA: 'CD',
  CONGOREPBRAZZAVILLE: 'CG',
  COOKISLANDS: 'CK',
  COSTARICA: 'CR',
  'COTEDIVOIREIVORY COAST': 'CI',
  CUBA: 'CU',
  CURACAO: 'CW',
  DJIBOUTI: 'DJ',
  DOMINICA: 'DM',
  DOMINICANREPUBLIC: 'DO',
  ECUADOR: 'EC',
  ELSALVADOR: 'SV',
  EQUATORIALGUINEA: 'GQ',
  ERITREA: 'ER',
  ETHIOPIA: 'ET',
  FALKLANDISLANDS: 'FK',
  FIJI: 'FJ',
  FRENCHGUIANA: 'GF',
  FRENCHPOLYNESIATAHITI: 'PF',
  GABON: 'GA',
  GAMBIATHE: 'GM',
  GEORGIA: 'GE',
  GHANA: 'GH',
  GRENADA: 'GD',
  GUADELOUPE: 'GP',
  GUAM: 'GU',
  GUATEMALA: 'GT',
  GUINEA: 'GN',
  'GUINEA BISSAU': 'GW',
  GUYANA: 'GY',
  HAITI: 'HT',
  HAWAII: 'US',
  HONDURAS: 'HN',
  ISRAEL: 'IL',
  IVORYCOAST: 'CI',
  JAMAICA: 'JM',
  JORDAN: 'JO',
  KAZAKHZSTAN: 'KZ',
  KENYA: 'KE',
  KIRIBATI: 'KI',
  KUWAIT: 'KW',
  KYRGYZSTAN: 'KG',
  LESOTHO: 'LS',
  LIBERIA: 'LR',
  MADAGASCAR: 'MG',
  MALAWI: 'MW',
  MALI: 'ML',
  MARSHALLISLANDS: 'MH',
  MARTINIQUE: 'MQ',
  MAURITANIA: 'MR',
  MAURITIUS: 'MU',
  MAYOTTE: 'YT',
  MEXICO: 'MX',
  MICRONESIA: 'FM',
  MONTSERRAT: 'MS',
  MOROCCO: 'MA',
  MOZAMBIQUE: 'MZ',
  NAMIBIA: 'NA',
  NAURU: 'NR',
  NETHERLANDSANTILLES: 'AN',
  NEWCALEDONIA: 'NC',
  NEWZEALAND: 'NZ',
  NICARAGUA: 'NI',
  NIGER: 'NE',
  NIUE: 'NU',
  NORTHERNMARIANAISLANDS: 'MP',
  OMAN: 'OM',
  PAKISTAN: 'PK',
  PALAU: 'PW',
  PALESTINIANTERRITORIES: 'PS',
  PANAMA: 'PA',
  PAPUANEWGUINEA: 'PG',
  PARAGUAY: 'PY',
  PERU: 'PE',
  PITCAIRN: 'PN',
  'PUERTO RICO': 'PR',
  QATAR: 'QA',
  REUNION: 'RE',
  RWANDA: 'RW',
  SAINTHELENA: 'SH',
  SAINTKITTSANDNEVIS: 'KN',
  SAINTLUCIA: 'LC',
  SAINTMARTIN: 'MF',
  SAINTVINCENTANDGRENADINES: 'VC',
  SAMOA: 'WS',
  SAOTOMEANDPRINCIPE: 'ST',
  SAUDIARABIA: 'SA',
  SENEGAL: 'SN',
  SEYCHELLES: 'SC',
  SIERRALEONE: 'SL',
  SOLOMONISLANDS: 'SB',
  SOUTHAFRICA: 'ZA',
  SOUTHSUDAN: 'SS',
  SUDAN: 'SD',
  SURINAME: 'SR',
  SWAZILAND: 'SZ',
  TAJIKISTAN: 'TJ',
  TANZANIA: 'TZ',
  TOGO: 'TG',
  TOKELAU: 'TK',
  TONGA: 'TO',
  TRINIDADANDTOBAGO: 'TT',
  TUNISIA: 'TN',
  TURKMENISTAN: 'TM',
  TUVALU: 'TV',
  UGANDA: 'UG',
  UNITEDARABEMIRATES: 'AE',
  UNITEDSTATES: 'US',
  URUGUAY: 'UY',
  USVIRGINISLANDS: 'VI',
  UZBEKISTAN: 'UZ',
  VANUATU: 'VU',
  VARIOUSWORLD: 'PH', // fallback
  VENEZUELA: 'VE',
  WESTERNSAHARA: 'EH',
  ZAMBIA: 'ZM',
  ZIMBABWE: 'ZW',
}

/**
 * Converts a coverage-map country code to its ISO2 equivalent.
 * Domestic city codes (MANILA, CEBU CITY, etc.) are not in the map
 * and fall back to "PH" since the API only accepts country-level codes.
 */
function toIso2(code: string): string {
  return COUNTRY_TO_ISO2[code] ?? 'PH'
}

export function travelInsuranceSchemaToInitCompareQuote(
  travelInsurance: TravelInsuranceFormData,
  agentCode?: string
): InitCompareQuoteRequest {
  const dateOfBirth = travelInsurance.dateOfBirth
    ? new Date(travelInsurance.dateOfBirth).toISOString().split('T').at(0)
    : null

  const departureDate = travelInsurance.departureDate
    ? new Date(travelInsurance.departureDate).toISOString().split('T').at(0)
    : null

  const returnDate = travelInsurance.returnDate
    ? new Date(travelInsurance.returnDate).toISOString().split('T').at(0)
    : null

  const returnDestination = travelInsurance.returnDestination
  const outboundLegs =
    returnDestination && travelInsurance.travelDetailList.length > 1
      ? travelInsurance.travelDetailList.slice(0, -1)
      : travelInsurance.travelDetailList

  // One entry per destination country — the API requires each once.
  const destinationCountries = [
    ...new Set(outboundLegs.map((td) => toIso2(td.TravelCountry))),
  ]

  return {
    origin_country: toIso2(
      travelInsurance.travelDetailList[0]?.PlaceOfOrgin ?? 'PHILIPPINES'
    ),
    destination_countries: destinationCountries,
    // Omit the key entirely when there is no return destination (per spec).
    ...(returnDestination
      ? { return_destination: toIso2(returnDestination) }
      : {}),
    departure_date: departureDate ?? null,
    return_date: returnDate ?? null,
    traveler_count: travelInsurance.noOfAdults + travelInsurance.noOfChildren,
    principal_date_of_birth: dateOfBirth ?? null,
    agent_code: agentCode ?? '',
    slug: 'travel-insurance',
  }
}
