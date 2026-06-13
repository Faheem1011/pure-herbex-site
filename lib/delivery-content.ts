import type { DeliveryCity } from "@/lib/delivery-locations";

const PROVINCE_INTROS: Record<string, string> = {
  punjab:
    "Punjab is our home province — Pure Herbex Ultra Force is formulated, packed, and dispatched from Okara. Most Punjab orders benefit from the shortest delivery windows in our entire network.",
  sindh:
    "Sindh customers from Karachi to interior Sindh receive the same medical-grade herbal formula trusted across Pakistan, shipped in completely discreet packaging with Cash on Delivery.",
  "khyber-pakhtunkhwa":
    "Khyber Pakhtunkhwa orders are handled through our northern courier partners. Whether you are in Peshawar, Abbottabad, or Swat, your privacy and COD convenience remain our priority.",
  balochistan:
    "We proudly deliver to Balochistan — Quetta, Gwadar, Turbat, and beyond. Extended routes mean slightly longer timelines, but every order ships with the same plain packaging and no advance payment.",
  islamabad:
    "Islamabad Capital Territory enjoys express routing from our Okara warehouse, often arriving within 24–48 hours alongside Rawalpindi twin-city deliveries.",
  "gilgit-baltistan":
    "Gilgit-Baltistan customers can order Pure Herbex Ultra Force with nationwide COD. Mountain-region deliveries use extended courier schedules with full tracking support via WhatsApp.",
  "azad-kashmir":
    "Azad Jammu & Kashmir is fully covered — from Mirpur to Muzaffarabad. We serve AJK residents with the same Rs. 3,000 price and discreet delivery standard as mainland Pakistan.",
};

const TIER_NOTES: Record<number, string> = {
  1: "Express zone: your order is prioritised on daily dispatch runs from Okara with typical arrival in 1–2 business days after confirmation on WhatsApp.",
  2: "Standard zone: reliable courier coverage with expected delivery in 2–4 business days. You pay only when the parcel arrives — Cash on Delivery.",
  3: "Extended zone: interior and northern routes may take 3–5 business days. We confirm tracking details on WhatsApp once your parcel is handed to the courier.",
  4: "Remote zone: far-flung areas including coastal Balochistan and high-altitude GB routes. Allow 5–6 business days; COD still applies with no upfront payment.",
};

export function buildCitySeoTitle(city: DeliveryCity): string {
  return `Pure Herbex Delivery in ${city.name} | Herbal Stamina COD ${city.province}`;
}

export function buildCitySeoDescription(city: DeliveryCity): string {
  return `Order Pure Herbex Ultra Force in ${city.name}, ${city.province}. Rs. 3,000 Cash on Delivery, discreet packaging, ${city.deliveryDays}. 32-herb medical-grade formula — ship nationwide from Okara.`;
}

export function buildCityFaqs(city: DeliveryCity) {
  return [
    {
      question: `Does Pure Herbex deliver to ${city.name}?`,
      answer: `Yes. We deliver Pure Herbex Ultra Force to ${city.name} and surrounding areas including ${city.nearbyAreas.slice(0, 3).join(", ")}. Order via WhatsApp for Cash on Delivery.`,
    },
    {
      question: `How long does delivery take in ${city.name}?`,
      answer: `Typical delivery to ${city.name} is ${city.deliveryDays} after your order is confirmed. Timelines may vary slightly during holidays or severe weather.`,
    },
    {
      question: `Is Cash on Delivery available in ${city.name}?`,
      answer: `Absolutely. We offer free Cash on Delivery across ${city.name} — pay Rs. 3,000 only when your discreet parcel arrives. No advance payment or hidden fees.`,
    },
    {
      question: `Is the packaging discreet for ${city.name} orders?`,
      answer: `Every ${city.name} order ships in a plain, unmarked brown envelope or box with no product branding on the outside. Your privacy is protected.`,
    },
    {
      question: `What is the price of Pure Herbex Ultra Force in ${city.name}?`,
      answer: `The price is Rs. 3,000 for a full bottle (60 capsules) everywhere in Pakistan including ${city.name}. Same price, same formula, nationwide.`,
    },
  ];
}

export function buildCityIntroParagraphs(city: DeliveryCity): string[] {
  const paragraphs: string[] = [];

  paragraphs.push(
    `Looking for a trusted <strong>herbal stamina supplement in ${city.name}</strong>? Pure Herbex Ultra Force delivers directly to your doorstep across ${city.province} with <strong>Cash on Delivery (COD)</strong>, discreet plain packaging, and no advance payment. Our medical-grade 32-herb formula — featuring Shilajit, Ashwagandha, Tribulus, and Saffron — is shipped nationwide from our Okara, Punjab facility.`
  );

  if (city.localNote) {
    paragraphs.push(city.localNote);
  }

  paragraphs.push(PROVINCE_INTROS[city.provinceSlug] || PROVINCE_INTROS.punjab);
  paragraphs.push(TIER_NOTES[city.tier]);

  paragraphs.push(
    `Customers in ${city.name} and nearby zones — <strong>${city.nearbyAreas.join(", ")}</strong> — order daily through WhatsApp at <strong>+92 316 0924151</strong>. Simply send your name, complete address, and phone number. Our team confirms your order and dispatches within hours during business days.`
  );

  paragraphs.push(
    `Unlike chemical timing tablets sold at local pharmacies in ${city.name}, Pure Herbex Ultra Force works cumulatively over 21–90 days to restore natural stamina, vascular health, and confidence — with <strong>zero reported side effects</strong> from our herbal-only formula.`
  );

  return paragraphs;
}
