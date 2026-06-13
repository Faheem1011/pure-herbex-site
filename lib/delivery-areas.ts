export type DeliveryArea = {
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  province: string;
  deliveryDays: string;
  urduName: string;
  seoKeywords: string[];
};

export const deliveryAreas: DeliveryArea[] = [
  // Lahore
  { slug: "lahore-dha", name: "DHA Lahore", citySlug: "lahore", cityName: "Lahore", province: "Punjab", deliveryDays: "1–2 days", urduName: "ڈی ایچ اے لاہور", seoKeywords: ["Pure Herbex DHA Lahore", "herbal COD DHA Lahore"] },
  { slug: "lahore-gulberg", name: "Gulberg Lahore", citySlug: "lahore", cityName: "Lahore", province: "Punjab", deliveryDays: "1–2 days", urduName: "گلبرگ لاہور", seoKeywords: ["herbal stamina Gulberg", "timing medicine Gulberg Lahore"] },
  { slug: "lahore-johar-town", name: "Johar Town", citySlug: "lahore", cityName: "Lahore", province: "Punjab", deliveryDays: "1–2 days", urduName: "جوہر ٹاؤن", seoKeywords: ["Pure Herbex Johar Town", "COD Johar Town Lahore"] },
  { slug: "lahore-model-town", name: "Model Town Lahore", citySlug: "lahore", cityName: "Lahore", province: "Punjab", deliveryDays: "1–2 days", urduName: "ماڈل ٹاؤن لاہور", seoKeywords: ["herbal delivery Model Town Lahore"] },
  { slug: "lahore-cantt", name: "Lahore Cantt", citySlug: "lahore", cityName: "Lahore", province: "Punjab", deliveryDays: "1–2 days", urduName: "لاہور کینٹ", seoKeywords: ["Pure Herbex Lahore Cantt COD"] },
  { slug: "lahore-wapda-town", name: "Wapda Town", citySlug: "lahore", cityName: "Lahore", province: "Punjab", deliveryDays: "1–2 days", urduName: "واپڈا ٹاؤن", seoKeywords: ["herbal capsules Wapda Town"] },
  // Karachi
  { slug: "karachi-clifton", name: "Clifton Karachi", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "کلفٹن کراچی", seoKeywords: ["Pure Herbex Clifton", "herbal COD Clifton Karachi"] },
  { slug: "karachi-dha", name: "DHA Karachi", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "ڈی ایچ اے کراچی", seoKeywords: ["timing medicine DHA Karachi"] },
  { slug: "karachi-gulshan", name: "Gulshan-e-Iqbal", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "گلشنِ اقبال", seoKeywords: ["Pure Herbex Gulshan Karachi"] },
  { slug: "karachi-north-nazimabad", name: "North Nazimabad", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "نارتھ ناظم آباد", seoKeywords: ["herbal stamina North Nazimabad"] },
  { slug: "karachi-malir", name: "Malir Karachi", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "ملیر کراچی", seoKeywords: ["Pure Herbex Malir delivery"] },
  { slug: "karachi-korangi", name: "Korangi", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "کورنگی", seoKeywords: ["herbal COD Korangi Karachi"] },
  { slug: "karachi-saddar", name: "Saddar Karachi", citySlug: "karachi", cityName: "Karachi", province: "Sindh", deliveryDays: "2–3 days", urduName: "صدر کراچی", seoKeywords: ["Pure Herbex Saddar Karachi"] },
  // Islamabad
  { slug: "islamabad-f6", name: "F-6 Islamabad", citySlug: "islamabad", cityName: "Islamabad", province: "Islamabad", deliveryDays: "1–2 days", urduName: "ایف سکس اسلام آباد", seoKeywords: ["herbal delivery F-6 Islamabad"] },
  { slug: "islamabad-f7", name: "F-7 Islamabad", citySlug: "islamabad", cityName: "Islamabad", province: "Islamabad", deliveryDays: "1–2 days", urduName: "ایف سات اسلام آباد", seoKeywords: ["Pure Herbex F-7 COD"] },
  { slug: "islamabad-g11", name: "G-11 Islamabad", citySlug: "islamabad", cityName: "Islamabad", province: "Islamabad", deliveryDays: "1–2 days", urduName: "جی گیارہ اسلام آباد", seoKeywords: ["herbal stamina G-11"] },
  { slug: "islamabad-bahria-town", name: "Bahria Town Islamabad", citySlug: "islamabad", cityName: "Islamabad", province: "Islamabad", deliveryDays: "1–2 days", urduName: "بہریہ ٹاؤن اسلام آباد", seoKeywords: ["Pure Herbex Bahria Town Islamabad"] },
  { slug: "islamabad-dha", name: "DHA Islamabad", citySlug: "islamabad", cityName: "Islamabad", province: "Islamabad", deliveryDays: "1–2 days", urduName: "ڈی ایچ اے اسلام آباد", seoKeywords: ["timing medicine DHA Islamabad"] },
  // Rawalpindi
  { slug: "rawalpindi-saddar", name: "Saddar Rawalpindi", citySlug: "rawalpindi", cityName: "Rawalpindi", province: "Punjab", deliveryDays: "1–2 days", urduName: "صدر راولپنڈی", seoKeywords: ["Pure Herbex Saddar Rawalpindi"] },
  { slug: "rawalpindi-satellite-town", name: "Satellite Town", citySlug: "rawalpindi", cityName: "Rawalpindi", province: "Punjab", deliveryDays: "1–2 days", urduName: "سیلائٹ ٹاؤن راولپنڈی", seoKeywords: ["herbal COD Satellite Town"] },
  { slug: "rawalpindi-chaklala", name: "Chaklala", citySlug: "rawalpindi", cityName: "Rawalpindi", province: "Punjab", deliveryDays: "1–2 days", urduName: "چکلالہ", seoKeywords: ["Pure Herbex Chaklala delivery"] },
  // Faisalabad
  { slug: "faisalabad-d-ground", name: "D Ground Faisalabad", citySlug: "faisalabad", cityName: "Faisalabad", province: "Punjab", deliveryDays: "2 days", urduName: "ڈی گراؤنڈ فیصل آباد", seoKeywords: ["herbal stamina D Ground Faisalabad"] },
  { slug: "faisalabad-susan-road", name: "Susan Road", citySlug: "faisalabad", cityName: "Faisalabad", province: "Punjab", deliveryDays: "2 days", urduName: "سوسن روڈ", seoKeywords: ["Pure Herbex Susan Road Faisalabad"] },
  // Multan
  { slug: "multan-cantt", name: "Multan Cantt", citySlug: "multan", cityName: "Multan", province: "Punjab", deliveryDays: "2–3 days", urduName: "ملتان کینٹ", seoKeywords: ["herbal COD Multan Cantt"] },
  { slug: "multan-gulgasht", name: "Gulgasht Colony", citySlug: "multan", cityName: "Multan", province: "Punjab", deliveryDays: "2–3 days", urduName: "گلگشت کالونی", seoKeywords: ["Pure Herbex Gulgasht Multan"] },
  // Peshawar
  { slug: "peshawar-hayatabad", name: "Hayatabad", citySlug: "peshawar", cityName: "Peshawar", province: "Khyber Pakhtunkhwa", deliveryDays: "2–3 days", urduName: "حیات آباد پشاور", seoKeywords: ["herbal delivery Hayatabad Peshawar"] },
  { slug: "peshawar-university-town", name: "University Town", citySlug: "peshawar", cityName: "Peshawar", province: "Khyber Pakhtunkhwa", deliveryDays: "2–3 days", urduName: "یونیورسٹی ٹاؤن پشاور", seoKeywords: ["Pure Herbex University Town Peshawar"] },
  // Hyderabad
  { slug: "hyderabad-latifabad", name: "Latifabad", citySlug: "hyderabad", cityName: "Hyderabad", province: "Sindh", deliveryDays: "2–3 days", urduName: "لطیف آباد حیدرآباد", seoKeywords: ["herbal COD Latifabad"] },
  { slug: "hyderabad-qasimabad", name: "Qasimabad", citySlug: "hyderabad", cityName: "Hyderabad", province: "Sindh", deliveryDays: "2–3 days", urduName: "قاسم آباد", seoKeywords: ["Pure Herbex Qasimabad Hyderabad"] },
  // Gujranwala & Sialkot
  { slug: "gujranwala-model-town", name: "Model Town Gujranwala", citySlug: "gujranwala", cityName: "Gujranwala", province: "Punjab", deliveryDays: "2 days", urduName: "ماڈل ٹاؤن گوجرانوالہ", seoKeywords: ["Pure Herbex Gujranwala Model Town"] },
  { slug: "sialkot-cantt", name: "Sialkot Cantt", citySlug: "sialkot", cityName: "Sialkot", province: "Punjab", deliveryDays: "2–3 days", urduName: "سیالکوٹ کینٹ", seoKeywords: ["herbal delivery Sialkot Cantt"] },
];

export function getAreaBySlug(slug: string): DeliveryArea | undefined {
  return deliveryAreas.find((a) => a.slug === slug);
}

export function getAreasByCity(citySlug: string): DeliveryArea[] {
  return deliveryAreas.filter((a) => a.citySlug === citySlug);
}
