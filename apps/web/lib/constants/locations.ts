/**
 * Location reference data for country/state/city dropdowns.
 *
 * Countries and their states are served by the backend `/geo/locations`
 * endpoint (single source of truth). City data lives here as a constant so the
 * app never makes users type a city name, and so new cities can be added
 * without a backend deploy.
 */

/** The 36 states + FCT of Nigeria (matches the backend reference data). */
export const NIGERIA_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT (Abuja)',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

/** Major cities / towns keyed by Nigerian state name. */
export const NIGERIA_STATE_CITIES: Record<string, string[]> = {
  Abia: ['Umuahia', 'Aba', 'Ohafia', 'Arochukwu', 'Bende', 'Isuikwuato', 'Ukwa', 'Uzuakoli'],
  Adamawa: ['Yola', 'Jimeta', 'Mubi', 'Numan', 'Gombi', 'Hong', 'Michika', 'Mayo Belwa', 'Ganye'],
  'Akwa Ibom': ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron', 'Abak', 'Ukanafun', 'Ibeno', 'Itu', 'Etinan'],
  Anambra: ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata', 'Ihiala', 'Ogidi', 'Ojoto', 'Oba'],
  Bauchi: ['Bauchi', 'Azare', 'Misau', "Jama'are", 'Katagum', 'Ningi', 'Darazo', 'Gamawa'],
  Bayelsa: ['Yenagoa', 'Brass', 'Sagbama', 'Ogbia', 'Nembe', 'Ekeremor', 'Amassoma'],
  Benue: ['Makurdi', 'Otukpo', 'Gboko', 'Katsina-Ala', 'Vandeikya', 'Adikpo', 'Oju', 'Aliade'],
  Borno: ['Maiduguri', 'Biu', 'Bama', 'Dikwa', 'Gwoza', 'Monguno', 'Jere', 'Konduga'],
  'Cross River': ['Calabar', 'Ugep', 'Ikom', 'Ogoja', 'Obudu', 'Akamkpa', 'Obubra'],
  Delta: ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor', 'Ozoro', 'Effurun', 'Oleh', 'Uvwie'],
  Ebonyi: ['Abakaliki', 'Afikpo', 'Onueke', 'Ishiagu', 'Ezzamgbo', 'Edda', 'Amasiri'],
  Edo: ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Irrua', 'Ubiaja', 'Igueben', 'Ehor', 'Okada'],
  Ekiti: ['Ado-Ekiti', 'Ikere-Ekiti', 'Ijero-Ekiti', 'Efon-Alaaye', 'Ise-Ekiti', 'Aramoko', 'Oye'],
  Enugu: ['Enugu', 'Nsukka', 'Awgu', 'Oji River', 'Udi', 'Agbani', 'Enugu Ezike', 'Nike'],
  'FCT (Abuja)': [
    'Abuja',
    'Gwagwalada',
    'Kubwa',
    'Bwari',
    'Karu',
    'Kuje',
    'Lugbe',
    'Nyanya',
    'Maitama',
  ],
  Gombe: ['Gombe', 'Kumo', 'Billiri', 'Dukku', 'Kaltungo', 'Nafada', 'Deba'],
  Imo: ['Owerri', 'Orlu', 'Okigwe', 'Mbaise', 'Oguta', 'Ngor-Okpala', 'Ihiala', 'Umuguma'],
  Jigawa: ['Dutse', 'Hadejia', 'Gumel', 'Birnin Kudu', 'Kazaure', 'Ringim', 'Gwaram'],
  Kaduna: ['Kaduna', 'Zaria', 'Kafanchan', 'Sabon Gari', 'Saminaka', 'Birnin Gwari', 'Soba'],
  Kano: ['Kano', 'Dala', 'Fagge', 'Wudil', 'Rano', 'Gwarzo', 'Bichi', 'Tudun Wada'],
  Katsina: ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Dutsin-Ma', 'Kankia', 'Batsari'],
  Kebbi: ['Birnin Kebbi', 'Argungu', 'Yauri', 'Zuru', 'Jega', 'Bunza', 'Kamba'],
  Kogi: ['Lokoja', 'Okene', 'Idah', 'Kabba', 'Ankpa', 'Dekina', 'Ajaokuta', 'Ogaminana'],
  Kwara: ['Ilorin', 'Offa', 'Ijagbo', 'Lafiagi', 'Share', 'Kaiama', 'Patigi', 'Ilorin South'],
  Lagos: [
    'Ikeja',
    'Lekki',
    'Victoria Island',
    'Surulere',
    'Yaba',
    'Ajah',
    'Badagry',
    'Epe',
    'Ikorodu',
    'Eti-Osa',
    'Alimosho',
    'Amuwo-Odofin',
    'Oshodi',
    'Ikoyi',
  ],
  Nasarawa: ['Lafia', 'Keffi', 'Akwanga', 'Karu', 'Nasarawa', 'Doma', 'Wamba'],
  Niger: ['Minna', 'Bida', 'Suleja', 'Kontagora', 'Mokwa', 'Agaie', 'Lapai', 'Kutigi'],
  Ogun: [
    'Abeokuta',
    'Ijebu Ode',
    'Sagamu',
    'Ota',
    'Ilaro',
    'Ijebu-Igbo',
    'Ifo',
    'Sango-Ota',
    'Ago-Iwoye',
  ],
  Ondo: ['Akure', 'Ondo', 'Okitipupa', 'Ore', 'Owo', 'Ikare', 'Idanre', 'Odigbo'],
  Osun: ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Ila-Orangun', 'Iwo', 'Ejigbo', 'Iragbiji'],
  Oyo: ['Ibadan', 'Ogbomoso', 'Oyo', 'Iseyin', 'Okeho', 'Saki', 'Igboho', 'Ibarapa', 'Eruwa'],
  Plateau: ['Jos', 'Bukuru', 'Pankshin', 'Barkin Ladi', 'Shendam', 'Mangu', 'Vom'],
  Rivers: [
    'Port Harcourt',
    'Bonny',
    'Okrika',
    'Eleme',
    'Obio-Akpor',
    'Degema',
    'Ahoada',
    'Omoku',
    'Igwuruta',
  ],
  Sokoto: ['Sokoto', 'Tambuwal', 'Gwadabawa', 'Wurno', 'Binji', 'Isa'],
  Taraba: ['Jalingo', 'Wukari', 'Bali', 'Gembu', 'Ibi', 'Serti', 'Zing'],
  Yobe: ['Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam', 'Bade', 'Fika'],
  Zamfara: ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Anka', 'Gummi', 'Tsafe'],
};

/**
 * Fallback major cities for countries without per-state city data. Kept small —
 * the primary market is Nigeria; these cover the most common alternatives so
 * the city field is never a manual text box.
 */
export const COUNTRY_MAJOR_CITIES: Record<string, string[]> = {
  Nigeria: [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan',
    'Benin City',
    'Enugu',
    'Aba',
    'Jos',
    'Ilorin',
  ],
  Ghana: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Sunyani'],
  Kenya: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi'],
  'South Africa': [
    'Johannesburg',
    'Cape Town',
    'Durban',
    'Pretoria',
    'Port Elizabeth',
    'Bloemfontein',
  ],
  Egypt: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Sharm El Sheikh'],
  Ethiopia: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Bahir Dar', 'Hawassa'],
  Tanzania: ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Zanzibar', 'Mbeya'],
  Uganda: ['Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu', 'Mbale'],
  "Côte d'Ivoire": ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Daloa', 'San-Pédro'],
  Cameroon: ['Douala', 'Yaoundé', 'Bamenda', 'Garoua', 'Bafoussam', 'Kribi'],
  'United States': [
    'New York',
    'Los Angeles',
    'Houston',
    'Miami',
    'Atlanta',
    'Chicago',
    'Dallas',
    'Washington DC',
  ],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  India: ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad'],
  China: ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Chengdu'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
};

/** Every Nigerian city, deduped and sorted — used by marketplace "All cities" filters. */
export const ALL_NIGERIAN_CITIES = [...new Set(Object.values(NIGERIA_STATE_CITIES).flat())].sort(
  (a, b) => a.localeCompare(b)
);

/**
 * Returns the city options for a given state, falling back to the country's
 * major cities when the state has no dedicated city list.
 */
export const getCitiesFor = (state: string, country?: string): string[] => {
  const stateCities = NIGERIA_STATE_CITIES[state];
  if (stateCities && stateCities.length > 0) return stateCities;
  if (country) {
    const countryCities = COUNTRY_MAJOR_CITIES[country];
    if (countryCities && countryCities.length > 0) return countryCities;
  }
  return [];
};
