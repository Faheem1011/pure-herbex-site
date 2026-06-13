export interface FacebookReview {
  id: string;
  name: string;
  avatar: string;
  timeAgo: string;
  text: string;
  reactions: number;
  showPopularHeader?: boolean;
  popularCount?: string;
  brandReply?: string;
  /** Urdu RTL comment */
  rtl?: boolean;
}

export const facebookReviews: FacebookReview[] = [
  {
    id: "1",
    name: "Ahmed Raza",
    avatar: "/reviews/avatars/avatar-1.png",
    timeAgo: "15w",
    text: "Bohat hi acha product hai main use kar raha hun aur 2 dost bhi use kar rahe hain. Chemical timing pills se headache aata tha — Pure Herbex se energy natural feel hoti hai. COD Lahore 2 din me aya.",
    reactions: 18,
    showPopularHeader: true,
    popularCount: "12.4K",
    brandReply: "Bohat shukriya Ahmed bhai feedback ke liye! Consistency se 30 din me best results aate hain.",
  },
  {
    id: "2",
    name: "عثمان خان",
    avatar: "/reviews/avatars/avatar-2.png",
    timeAgo: "11w",
    text: "السلام علیکم۔ میں کراچی سے ہوں۔ پیکنگ بالکل سادہ تھی کوئی لیبل نہیں۔ توانائی میں فرق محسوس ہوا تقریباً 3 ہفتوں بعد۔ واٹس ایپ پر آرڈر بہت آسان تھا۔",
    reactions: 14,
    rtl: true,
    brandReply: "شکریہ عثمان بھائی! Discreet delivery ہمیشہ guaranteed ہے۔",
  },
  {
    id: "3",
    name: "Bilal Sheikh",
    avatar: "/reviews/avatars/avatar-3.png",
    timeAgo: "8w",
    text: "Best herbal stamina formula Ma sha Allah ❤️ Keep up the amazing work. Multan se order kiya tha 2 din me parcel mil gaya.",
    reactions: 22,
    brandReply: "Thank you Bilal! ❤️ Glad discreet packaging worked for you.",
  },
  {
    id: "4",
    name: "Tariq Mehmood",
    avatar: "/reviews/avatars/avatar-4.png",
    timeAgo: "6w",
    text: "Office ke baad thakawat bilkul khatam. 32 herbs ka combination strong hai. Rs 3000 COD — advance payment nahi chahi.",
    reactions: 9,
    brandReply: "Bohat shukriya Tariq sahab! Ashwagandha + Shilajit stack stamina ke liye best hai.",
  },
  {
    id: "5",
    name: "Dr. Farooq Ahmed",
    avatar: "/reviews/avatars/avatar-5.png",
    timeAgo: "5w",
    text: "As a wellness consultant I checked ingredients list — Musli Sufaid, Saffron, Tribulus concentrations are solid. Medical-grade herbal, not street jari booti.",
    reactions: 31,
    showPopularHeader: true,
    popularCount: "8.2K",
    brandReply: "Thank you Dr. Farooq for the professional review!",
  },
  {
    id: "6",
    name: "Kamran Shah",
    avatar: "/reviews/avatars/avatar-6.png",
    timeAgo: "4w",
    text: "Peshawar delivery 3 din. Pehle skeptical tha par WhatsApp support ne sab explain kar diya. No side effects unlike blue pills.",
    reactions: 7,
    brandReply: "Shukriya Kamran bhai — hum hamesha WhatsApp par available hain.",
  },
  {
    id: "7",
    name: "سارہ احمد",
    avatar: "/reviews/avatars/avatar-7.png",
    timeAgo: "3w",
    text: "میں نے شوہر کے لیے آرڈر کیا تھا۔ ڈیلیوری ڈسکریٹ تھی۔ وہ کہتے ہیں توانائی اور اعتماد دونوں بہتر ہوئے ہیں۔ شکریہ Pure Herbex۔",
    reactions: 19,
    rtl: true,
    brandReply: "شکریہ Sara! Privacy ہمارے لیے سب سے اہم ہے۔",
  },
  {
    id: "8",
    name: "Zahid Ali",
    avatar: "/reviews/avatars/avatar-8.png",
    timeAgo: "3w",
    text: "Faisalabad se hun. Result 10-12 din me feel hua. Energy level high hai ab. Dost ko bhi recommend kiya.",
    reactions: 11,
    brandReply: "Bohat shukriya Zahid bhai! Referral par next order par discount bhi milti hai.",
  },
  {
    id: "9",
    name: "Sajid Jamil",
    avatar: "/reviews/avatars/avatar-9.png",
    timeAgo: "2w",
    text: "Discreet packaging 10/10. Plain box tha koi sex wellness mention nahi. Herbal timing ke liye best option Pakistan me.",
    reactions: 16,
    brandReply: "Thank you Sajid! Exactly why we use plain brown packaging only.",
  },
  {
    id: "10",
    name: "Imran Qureshi",
    avatar: "/reviews/avatars/avatar-10.png",
    timeAgo: "1w",
    text: "Rawalpindi 24 hours delivery. Salajeet + Ashwagandha wala formula genuine lagta hai. 3 week use — stamina clear improve.",
    reactions: 5,
    brandReply: "Shukriya Imran sahab! 60-90 din consistent use se peak results milte hain.",
  },
];
