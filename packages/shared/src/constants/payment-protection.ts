/**
 * How Payment Protection releases rent, said the same way everywhere (web, mobile and the API's trust chain).
 * The rule: rent paid through Sureground is held and released to the landlord when the renter confirms move-in, or
 * automatically on its scheduled release date, whichever comes first. A dispute raised before release keeps it held.
 */
export const RENT_PROTECTION_RULE =
  'Sureground holds your rent and releases it to the landlord when you confirm move-in or on its scheduled release date, whichever comes first. A dispute raised before then keeps it held until it is resolved.';

/** The same rule in the third person, as one clause for lists of facts. No full stop, so it can be joined. */
export const RENT_RELEASE_RULE =
  'Rent is released to the landlord when the renter confirms move-in or on its scheduled release date, whichever comes first';
