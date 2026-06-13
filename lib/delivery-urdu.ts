import type { DeliveryCity } from "@/lib/delivery-locations";

export function buildUrduSeoTitle(city: DeliveryCity): string {
  return `پور ہربیکس ${city.name} ڈیلیوری | ہربل ٹائمنگ Rs. 3000 COD`;
}

export function buildUrduSeoDescription(city: DeliveryCity): string {
  return `پور ہربیکس الٹرا فورس ${city.name}، ${city.province} میں دستیاب۔ Rs. 3,000 کیش آن ڈیلیوری، خفیہ پیکنگ، ${city.deliveryDays}۔ 32 جڑی بوٹیوں کا فارمولا۔`;
}

export function buildUrduIntro(city: DeliveryCity): string[] {
  return [
    `کیا آپ <strong>${city.name}</strong> میں قابلِ اعتماد ہربل سٹیمنا سپلیمنٹ تلاش کر رہے ہیں؟ <strong>پور ہربیکس الٹرا فورس</strong> پاکستان بھر میں <strong>کیش آن ڈیلیوری (COD)</strong> کے ساتھ پہنچایا جاتا ہے — خفیہ پیکنگ، کوئی ایڈوانس ادائیگی نہیں۔`,
    `ہمارا 32 جڑی بوٹیوں کا میڈیکل گریڈ فارمولا (سلاجیت، اشوگندھا، گکھرو، زعفران) اوکاڑہ، پنجاب سے بھیجا جاتا ہے۔ <strong>${city.name}</strong> میں عام ڈیلیوری کا وقت: <strong>${city.deliveryDays}</strong>۔`,
    `قریبی علاقے جن میں ہم ڈیلیور کرتے ہیں: <strong>${city.nearbyAreas.join("، ")}</strong>۔`,
    `واٹس ایپ پر آرڈر کریں: <strong>+92 316 0924151</strong> — اپنا نام، مکمل پتہ (${city.name})، اور فون نمبر بھیجیں۔`,
    `کیمیائی ٹائمنگ گولیوں کے برعکس، پور ہربیکس قدرتی طریقے سے 21–90 دن میں سٹیمنا، خون کی گردش، اور اعتماد بحال کرتا ہے — بغیر کسی سائیڈ ایفیکٹ کے۔`,
  ];
}

export function buildUrduFaqs(city: DeliveryCity) {
  return [
    {
      q: `کیا پور ہربیکس ${city.name} میں ڈیلیور ہوتا ہے؟`,
      a: `جی ہاں، ہم ${city.name} اور اردگرد تمام علاقوں میں ڈیلیور کرتے ہیں۔ Rs. 3,000 کیش آن ڈیلیوری۔`,
    },
    {
      q: `${city.name} میں ڈیلیوری میں کتنا وقت لگتا ہے؟`,
      a: `عام طور پر ${city.deliveryDays}۔ تعطیلات یا موسم کی وجہ سے تھوڑا فرق ہو سکتا ہے۔`,
    },
    {
      q: `کیا پیکنگ خفیہ ہے؟`,
      a: `بالکل — عام بھورے رنگ کا ڈبہ، باہر کوئی پروڈکٹ کا نام نہیں۔`,
    },
    {
      q: `قیمت کیا ہے؟`,
      a: `پورے پاکستان میں Rs. 3,000 فی بوتل (60 کیپسول) — ${city.name} میں بھی۔`,
    },
  ];
}

export function getUrduWhatsAppLink(cityName: string): string {
  const text = encodeURIComponent(
    `السلام علیکم، میں پور ہربیکس الٹرا فورس (Rs. 3000 COD) ${cityName} میں منگوانا چاہتا ہوں۔`
  );
  return `https://wa.me/923160924151?text=${text}`;
}
