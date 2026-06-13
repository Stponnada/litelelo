// Curated list of Indian cities for the hometown picker.
// `aliases` capture alternate spellings/old names so "Bengaluru", "Bangalore",
// and "Bengaluru " all canonicalize to one display value. Students from places
// not in this list can still type a custom value (free-text fallback) — the
// list exists to *reduce* fragmentation, not to gate small towns/villages.

export interface PlaceOption {
    name: string;
    aliases?: string[];
}

export const INDIAN_CITIES: PlaceOption[] = [
    { name: 'Bangalore', aliases: ['Bengaluru', 'Banglore', 'Bengalore'] },
    { name: 'Mumbai', aliases: ['Bombay'] },
    { name: 'Delhi', aliases: ['New Delhi', 'NCR'] },
    { name: 'Hyderabad', aliases: ['Secunderabad'] },
    { name: 'Chennai', aliases: ['Madras'] },
    { name: 'Kolkata', aliases: ['Calcutta'] },
    { name: 'Pune', aliases: ['Poona'] },
    { name: 'Ahmedabad', aliases: ['Amdavad'] },
    { name: 'Gurugram', aliases: ['Gurgaon'] },
    { name: 'Noida' },
    { name: 'Jaipur' },
    { name: 'Lucknow' },
    { name: 'Kanpur' },
    { name: 'Nagpur' },
    { name: 'Indore' },
    { name: 'Bhopal' },
    { name: 'Visakhapatnam', aliases: ['Vizag', 'Vishakhapatnam'] },
    { name: 'Vijayawada' },
    { name: 'Guntur' },
    { name: 'Tirupati' },
    { name: 'Warangal' },
    { name: 'Patna' },
    { name: 'Ranchi' },
    { name: 'Raipur' },
    { name: 'Bhubaneswar', aliases: ['Bhubaneshwar'] },
    { name: 'Cuttack' },
    { name: 'Guwahati' },
    { name: 'Surat' },
    { name: 'Vadodara', aliases: ['Baroda'] },
    { name: 'Rajkot' },
    { name: 'Nashik', aliases: ['Nasik'] },
    { name: 'Nagercoil' },
    { name: 'Coimbatore' },
    { name: 'Madurai' },
    { name: 'Tiruchirappalli', aliases: ['Trichy'] },
    { name: 'Salem' },
    { name: 'Kochi', aliases: ['Cochin', 'Ernakulam'] },
    { name: 'Thiruvananthapuram', aliases: ['Trivandrum'] },
    { name: 'Kozhikode', aliases: ['Calicut'] },
    { name: 'Thrissur', aliases: ['Trichur'] },
    { name: 'Kannur' },
    { name: 'Kottayam' },
    { name: 'Mangalore', aliases: ['Mangaluru'] },
    { name: 'Mysore', aliases: ['Mysuru'] },
    { name: 'Hubli', aliases: ['Hubballi'] },
    { name: 'Belgaum', aliases: ['Belagavi'] },
    { name: 'Chandigarh' },
    { name: 'Ludhiana' },
    { name: 'Amritsar' },
    { name: 'Jalandhar' },
    { name: 'Patiala' },
    { name: 'Ambala' },
    { name: 'Faridabad' },
    { name: 'Dehradun' },
    { name: 'Haridwar' },
    { name: 'Meerut' },
    { name: 'Agra' },
    { name: 'Varanasi', aliases: ['Banaras', 'Benares'] },
    { name: 'Allahabad', aliases: ['Prayagraj'] },
    { name: 'Gorakhpur' },
    { name: 'Bareilly' },
    { name: 'Aligarh' },
    { name: 'Jhansi' },
    { name: 'Gwalior' },
    { name: 'Jabalpur' },
    { name: 'Ujjain' },
    { name: 'Jodhpur' },
    { name: 'Udaipur' },
    { name: 'Kota' },
    { name: 'Ajmer' },
    { name: 'Bikaner' },
    { name: 'Jamshedpur', aliases: ['Tatanagar'] },
    { name: 'Dhanbad' },
    { name: 'Bokaro' },
    { name: 'Siliguri' },
    { name: 'Durgapur' },
    { name: 'Asansol' },
    { name: 'Howrah' },
    { name: 'Aurangabad' },
    { name: 'Solapur' },
    { name: 'Kolhapur' },
    { name: 'Nanded' },
    { name: 'Amravati' },
    { name: 'Navi Mumbai' },
    { name: 'Thane' },
    { name: 'Panaji', aliases: ['Panjim', 'Goa'] },
    { name: 'Margao' },
    { name: 'Shillong' },
    { name: 'Imphal' },
    { name: 'Agartala' },
    { name: 'Aizawl' },
    { name: 'Itanagar' },
    { name: 'Kohima' },
    { name: 'Gangtok' },
    { name: 'Jammu' },
    { name: 'Srinagar' },
    { name: 'Shimla' },
];

/**
 * Map an arbitrary input to a canonical city name when it matches a known
 * city or alias (case-insensitive). Returns the trimmed input unchanged when
 * there's no match, so custom places (villages, towns) are preserved as typed.
 */
export function canonicalizeCity(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    for (const city of INDIAN_CITIES) {
        if (city.name.toLowerCase() === lower) return city.name;
        if (city.aliases?.some(a => a.toLowerCase() === lower)) return city.name;
    }
    return trimmed;
}
