/**
 * Verified A-ONE Foods Company Profile & Knowledge Base
 * 
 * Rules:
 * - Only verified data allowed.
 * - Anti-hallucination fallback strings are strictly defined here.
 */

export const AONE_COMPANY = {
  name: "A-ONE Foods",
  tagline: "Taste of Purity, Tradition of Quality",
  urduTagline: "خالص ذائقہ، روایتی معیار",
  description:
    "A-ONE Foods is a premier Pakistani food brand bringing authentic taste, traditional savories, pure recipe spices, and frozen delicacies to households nationwide.",
  
  // Official Verified Social Media
  social: {
    instagram: "https://www.instagram.com/aone_foods/",
    instagramHandle: "@aone_foods",
  },

  // Official Verified Contact & Distribution
  contact: {
    phone: "041-8735036",
    mobile: "0300-4166555",
    whatsapp: "+923004166555",
    whatsappDisplay: "+92 300 4166555",
    whatsappUrl: "https://wa.me/923004166555?text=Hello%20A-ONE%20Foods%20Team%2C%20I%20have%20an%20inquiry.",
    email: "info@aonefoods.pk",
    headOffice: "Main Jaranwala Road, Near National Silk Mills, Faisalabad, Pakistan",
    secondaryBranch: "Faizan-e-Madina Chowk, Susan Road, Madina Town, Faisalabad, Pakistan",
    hours: "Monday – Saturday: 9:00 AM – 8:00 PM (PKT)",
    distributionCities: [
      "Faisalabad",
      "Lahore",
      "Karachi",
      "Islamabad",
      "Rawalpindi",
      "Multan",
      "Gujranwala",
      "Sialkot",
      "Peshawar"
    ]
  },

  // Distributor Inquiry Requirements
  distributorInfo: {
    minimumOrderRequirement: "Available on inquiry based on city zone and distributor tier.",
    requiredFields: ["Full Name", "Phone / WhatsApp Number", "City / Territory", "Inquiry Type"],
    process: "Submit your details through this assistant. Our corporate sales & distribution desk will contact you within 24-48 business hours with the catalogue and commercial terms."
  },

  // Anti-Hallucination Guardrail Templates
  guardrails: {
    unknownEnglish: "I don't have verified information about that yet. I can help you contact the A-ONE Foods team instead.",
    unknownUrdu: "مجھے اس معلومات کی تصدیق نہیں مل رہی۔ آپ چاہیں تو میں آپ کی inquiry A-ONE Foods team تک پہنچانے میں مدد کر سکتا ہوں۔",
    unknownRomanUrdu: "Mujhe is maloomat ki tasdeeq nahi mil rahi. Aap chahein to main aap ki inquiry A-ONE Foods team tak pohnchane mein madad kar sakta hoon."
  },

  // Verified Common FAQs
  faqs: [
    {
      q: "Where are A-ONE Foods products available?",
      urQ: "اے ون فوڈز کے پروڈکٹس کہاں ملتے ہیں؟",
      a: "A-ONE Foods products are distributed across Pakistan in leading supermarkets, general grocery stores, and through authorized regional distributors in major cities like Faisalabad, Lahore, Karachi, and Islamabad.",
      urA: "اے ون فوڈز کے پروڈکٹس پاکستان کے بڑے سپر مارکیٹس، جنرل سٹورز اور فیصل آباد، لاہور، کراچی اور اسلام آباد سمیت تمام بڑے شہروں کے باضابطہ ڈسٹری بیوٹرز سے دستیاب ہیں۔"
    },
    {
      q: "How can I become an authorized distributor?",
      urQ: "ڈسٹری بیوٹر کیسے بن سکتے ہیں؟",
      a: "You can apply directly here! Click 'Become a Distributor' or provide your Name, Phone Number, City, and Company Name. Our sales management team will connect with you within 24-48 hours.",
      urA: "آپ یہیں پر 'Become a Distributor' پر کلک کر کے یا اپنا نام، فون نمبر اور شہر بتا کر درخواست دے سکتے ہیں۔ ہماری سیلز ٹیم ۲۴ سے ۴۸ گھنٹوں میں رابطہ کرے گی۔"
    },
    {
      q: "Are all A-ONE Foods products Halal certified?",
      urQ: "کیا تمام پروڈکٹس حلال ہیں؟",
      a: "Yes, 100% of A-ONE Foods ingredients and products are strictly certified Halal and produced in hygienic, food-grade compliant facilities.",
      urA: "جی ہاں، اے ون فوڈز کے ۱۰۰ فیصد پروڈکٹس باقاعدہ حلال تصدیق شدہ ہیں اور اعلیٰ حفظانِ صحت کے اصولوں کے تحت تیار کیے جاتے ہیں۔"
    },
    {
      q: "What is the official Instagram for A-ONE Foods?",
      urQ: "اے ون فوڈز کا آفیشل انسٹاگرام کیا ہے؟",
      a: "You can follow our official Instagram page at https://www.instagram.com/aone_foods/ for the latest updates, recipes, and seasonal specials.",
      urA: "ہمارا آفیشل انسٹاگرام پیج https://www.instagram.com/aone_foods/ ہے، جہاں آپ تازہ ترین معلومات دیکھ سکتے ہیں۔"
    }
  ]
};
