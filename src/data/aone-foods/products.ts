export interface Product {
  id: string;
  name: string;
  urduName: string;
  category: "Nimko & Snacks" | "Spices & Recipe Mixes" | "Ready-to-Cook & Frozen" | "Traditional Sweets" | "Sauces & Condiments";
  description: string;
  urduDescription: string;
  image: string;
  badge?: string;
  popular?: boolean;
  verifiedSpecs: {
    ingredients?: string[];
    availableSizes: string[];
    shelfLife?: string;
    storage?: string;
    availability: string;
    certifications?: string[];
    servingSuggestion?: string;
  };
  tags: string[];
}

export const AONE_PRODUCTS: Product[] = [
  // --- Nimko & Snacks --------------------------------------------------------
  {
    id: "aone-mix-nimko",
    name: "Special Mix Nimko",
    urduName: "سپیشل مکس نمکو",
    category: "Nimko & Snacks",
    description: "Crispy blend of gram flour sev, roasted peanuts, split lentils (daal), and traditional savory spices. A quintessential Pakistani tea-time favorite.",
    urduDescription: "بیسن کے سیو، بھنے ہوئے مونگ پھلی، دالیں اور روایتی مصالحوں کا خستہ اور مزیدار امتزاج۔ چائے کے ساتھ بہترین۔",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    badge: "Best Seller",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Gram Flour (Besan)", "Vegetable Oil", "Split Chickpeas (Chana Daal)", "Peanuts", "Salt", "Red Chili Powder", "Cumin", "Turmeric"],
      availableSizes: ["50g Pouch", "150g Family Pack", "400g Value Pack", "1kg Tin"],
      shelfLife: "6 Months",
      storage: "Store in a cool, dry place away from direct sunlight. Reseal tightly after opening.",
      availability: "In Stock - Available across major retail stores and authorized distributors in Pakistan.",
      certifications: ["100% Halal Certified", "ISO Quality Certified", "PSQCA Compliant"],
      servingSuggestion: "Serve with piping hot Karak Chai or as a crunchy topping over chaat."
    },
    tags: ["nimko", "snacks", "tea time", "chana daal", "sev", "peanuts", "namkeen", "crispy"]
  },
  {
    id: "aone-daal-moong",
    name: "Salted Daal Moong",
    urduName: "نمکین دال مونگ",
    category: "Nimko & Snacks",
    description: "Light, crispy golden fried split moong lentils delicately seasoned with sea salt. Zero cholesterol and full of light crunch.",
    urduDescription: "ہلکی، خستہ سنہری فرائیڈ مونگ دال جسے ہلکے نمک سے تیار کیا گیا ہے۔ چائے اور ہلکی بھوک کے لیے بہترین۔",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
    badge: "Light & Crunchy",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Moong Lentils (Split Green Gram)", "Corn Oil", "Refined Edible Salt"],
      availableSizes: ["65g Pouch", "180g Pack", "450g Mega Pack"],
      shelfLife: "6 Months",
      storage: "Store in an airtight container in a dry place.",
      availability: "In Stock - Distributed nationwide in Punjab, Sindh, KPK & Islamabad.",
      certifications: ["100% Halal", "PSQCA Certified"],
      servingSuggestion: "Enjoy straight from the pack with a squeeze of fresh lemon if desired."
    },
    tags: ["daal moong", "nimko", "salted", "healthy crunch", "namkeen", "lentils"]
  },
  {
    id: "aone-masala-peanuts",
    name: "Spicy Masala Peanuts",
    urduName: "مصالحہ دار مونگ پھلی",
    category: "Nimko & Snacks",
    description: "Premium jumbo peanuts double-coated in spiced gram flour batter and fried to supreme crispiness.",
    urduDescription: "اعلیٰ کوالٹی کی مونگ پھلی جس پر چٹپٹے مصالحہ دار بیسن کا خول چڑھا کر خستہ فرائی کیا گیا ہے۔",
    image: "https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?auto=format&fit=crop&w=600&q=80",
    popular: false,
    verifiedSpecs: {
      ingredients: ["Selected Peanuts", "Gram Flour", "Refined Vegetable Oil", "Chaat Masala", "Kashmiri Chili", "Citric Acid"],
      availableSizes: ["60g Pouch", "150g Pouch", "500g Jar"],
      shelfLife: "6 Months",
      storage: "Keep away from moisture and direct sunlight.",
      availability: "In Stock - Available through retail networks and wholesale dealers.",
      certifications: ["100% Halal"],
      servingSuggestion: "The ultimate road-trip and evening snack."
    },
    tags: ["peanuts", "masala peanuts", "spicy", "crunchy", "snack", "besan coating"]
  },
  {
    id: "aone-papri-nimko",
    name: "Chatpati Masala Papri",
    urduName: "چٹپٹی مصالحہ پاپڑی",
    category: "Nimko & Snacks",
    description: "Thin, crispy golden flour flakes dusted with our signature tangy and spicy secret spice blend.",
    urduDescription: "باریک، سنہری خستہ پاپڑی جس پر چٹپٹا روایتی مصالحہ چھڑکا گیا ہے۔ دہی بھلے اور چاٹ کے لیے بھی لاجواب۔",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
    popular: false,
    verifiedSpecs: {
      ingredients: ["Wheat Flour (Maida)", "Vegetable Ghee", "Ajwain (Carom Seeds)", "Kala Namak (Black Salt)", "Red Chili", "Amchur"],
      availableSizes: ["100g", "250g Pack"],
      shelfLife: "5 Months",
      storage: "Store sealed to retain maximum crispness.",
      availability: "In Stock nationwide.",
      certifications: ["100% Halal"],
      servingSuggestion: "Crush over homemade Papri Chaat, Dahi Bhallay, or eat straight as a tangy savory snack."
    },
    tags: ["papri", "chaat", "masala", "crispy flakes", "dahi baray", "snack"]
  },

  // --- Spices & Recipe Mixes -------------------------------------------------
  {
    id: "aone-biryani-masala",
    name: "Special Sindhi Biryani Masala",
    urduName: "سپیشل سندھی بریانی مصالحہ",
    category: "Spices & Recipe Mixes",
    description: "Authentic aromatic blend of hand-picked whole and ground spices crafted specifically for regal, restaurant-grade Sindhi Biryani with dried plums (aaloo bukhara).",
    urduDescription: "خوشبودار، اصلی کھڑے اور پیسے ہوئے مصالحوں اور آلو بخارے کا روایتی امتزاج جو ہر دیگ اور گھر کی بریانی کو ذائقہ دار بناتا ہے۔",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
    badge: "Chef's Choice",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Red Chili", "Coriander", "Cumin", "Dried Plums (Aaloo Bukhara)", "Black Pepper", "Cardamom", "Cinnamon", "Cloves", "Nutmeg", "Mace", "Bay Leaves", "Himalayan Pink Salt"],
      availableSizes: ["50g Box (Serves 6-8)", "100g Double Pack (Serves 12-16)", "1kg Catering Pack"],
      shelfLife: "18 Months",
      storage: "Keep inside airtight container in a cool, dry spice cupboard.",
      availability: "In Stock - Supermarkets, local grocery shops, and wholesale grocery dealers.",
      certifications: ["100% Pure & Natural Spices", "No Artificial Preservatives", "Halal"],
      servingSuggestion: "Use 50g pack per 750g meat and 750g Basmati rice for the perfect royal Biryani."
    },
    tags: ["biryani", "masala", "spices", "sindhi biryani", "rice spice", "aaloo bukhara", "recipe mix"]
  },
  {
    id: "aone-karahi-masala",
    name: "Chicken Karahi Gosht Masala",
    urduName: "چکن کڑاہی گوشت مصالحہ",
    category: "Spices & Recipe Mixes",
    description: "Course-ground spice mix loaded with roasted crushed coriander, cumin, black peppercorns, and red chili flakes for authentic Dhaba-style Karahi.",
    urduDescription: "موٹا کٹا ہوا دھنیا، زیرہ، کالی مرچ اور کٹی لال مرچ کا ذائقہ دار مرکب۔ اصلی ڈھابہ سٹائل کڑاہی کے لیے بہترین۔",
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Crushed Red Chili", "Roasted Coriander Seeds", "Cumin", "Black Pepper", "Ginger Powder", "Garlic Powder", "Fenugreek Leaves (Kasuri Methi)", "Salt"],
      availableSizes: ["50g Box", "100g Box"],
      shelfLife: "18 Months",
      storage: "Store away from stove heat and steam.",
      availability: "In Stock across Pakistan.",
      certifications: ["100% Halal", "Natural Ingredients"],
      servingSuggestion: "Cook in ghee or mustard oil with fresh tomatoes, ginger juliennes, and green chilies."
    },
    tags: ["karahi", "chicken karahi", "gosht", "desi food", "spices", "dhaba style", "masala"]
  },
  {
    id: "aone-chaat-masala",
    name: "Royal Chaat Masala",
    urduName: "رائل چاٹ مصالحہ",
    category: "Spices & Recipe Mixes",
    description: "Tangy, zesty, and punchy finishing spice blend with dried mango powder (amchur), black salt, and roasted cumin. Instantly elevates fruits, fries, and savories.",
    urduDescription: "آمچور، کالا نمک اور بھنے زیرے سے تیار کردہ ترش اور چٹپٹا مصالحہ۔ پھلوں، چنا چاٹ اور فرائز پر چھڑکنے کے لیے لاجواب۔",
    image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80",
    badge: "Must Have",
    popular: false,
    verifiedSpecs: {
      ingredients: ["Black Salt (Kala Namak)", "Dried Mango Powder (Amchur)", "Cumin", "Coriander", "Black Pepper", "Red Chili", "Citric Acid", "Pomegranate Seeds (Anardana)"],
      availableSizes: ["70g Sprinkler Bottle", "100g Refill Pouch", "500g Value Tub"],
      shelfLife: "24 Months",
      storage: "Keep bottle tightly closed after use to prevent clumping.",
      availability: "In Stock nationwide.",
      certifications: ["100% Halal", "Pure Ground Spices"],
      servingSuggestion: "Sprinkle generously over fruit chaat, dahi baray, pakoras, or boiled chickpeas."
    },
    tags: ["chaat masala", "amchur", "tangy", "sprinkler", "fruit chaat", "spices"]
  },

  // --- Ready-to-Cook & Frozen Snacks -----------------------------------------
  {
    id: "aone-crispy-samosa",
    name: "Crispy Cocktail Samosas (Frozen)",
    urduName: "خستہ کاک ٹیل سموسے (فروزن)",
    category: "Ready-to-Cook & Frozen",
    description: "Crispy pastry triangles stuffed with delicately spiced potatoes, green peas, and fresh mint. Ready to fry straight from the freezer in under 5 minutes.",
    urduDescription: "خستہ پتی اور مصالحہ دار آلو، مٹر اور پودینے کی فلنگ۔ فریزر سے نکال کر صرف ۵ منٹ میں فرائی کریں۔",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80",
    badge: "Quick Treat",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Wheat Pastry Sheet", "Potatoes", "Green Peas", "Fresh Mint & Coriander", "Spices", "Salt"],
      availableSizes: ["12 Pieces Pack (360g)", "24 Pieces Party Pack (720g)"],
      shelfLife: "9 Months at -18°C",
      storage: "Keep frozen at -18°C or below. Do not refreeze once thawed.",
      availability: "Available at modern trade marts, dairy centers, and frozen food outlets in major cities.",
      certifications: ["100% Halal", "Flash Frozen Freshness"],
      servingSuggestion: "Deep fry in medium-hot oil until golden amber, or air-fry at 180°C with light oil spray."
    },
    tags: ["samosa", "frozen snacks", "cocktail samosa", "iftar", "party snack", "ready to cook"]
  },
  {
    id: "aone-shami-kabab",
    name: "Traditional Beef Shami Kabab",
    urduName: "روایتی بیف شامی کباب",
    category: "Ready-to-Cook & Frozen",
    description: "Authentic melt-in-mouth beef Shami Kababs prepared with slow-cooked shredded beef, chana daal, whole spices, and fresh herbs. Egg-wash and fry.",
    urduDescription: "ریشہ دار گائے کا گوشت، چنا دال اور تازہ دھنیا پودینہ سے بنے روایتی شامی کباب۔ ہلکی آنچ پر انڈے کے ساتھ تلیں۔",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Prime Minced Beef", "Split Bengal Gram (Chana Daal)", "Fresh Mint", "Green Chilies", "Ginger", "Garlic", "Whole Garam Masala", "Salt"],
      availableSizes: ["6 Pieces Pack (300g)", "12 Pieces Family Pack (600g)"],
      shelfLife: "6 Months at -18°C",
      storage: "Keep continuously frozen.",
      availability: "Available in frozen retail freezers across Lahore, Karachi, Faisalabad, and Rawalpindi.",
      certifications: ["100% Zabiha Halal Beef", "Hygenic Processing"],
      servingSuggestion: "Dip in whisked egg and shallow-fry on a tawa until richly browned. Pair with naan and mint raita."
    },
    tags: ["shami kabab", "beef kabab", "frozen", "ready to fry", "dinner", "kabab"]
  },

  // --- Traditional Sweets ---------------------------------------------------
  {
    id: "aone-gulab-jamun",
    name: "Royal Gulab Jamun (Canned)",
    urduName: "شاہی گلاب جامن (کین)",
    category: "Traditional Sweets",
    description: "Tender, khoya-enriched milk dumplings soaked in fragrant saffron and rosewater infused cardamom syrup. Rich, sweet, and comforting.",
    urduDescription: "خالص کھوئے سے تیار کردہ نرم اور رس بھرے گلاب جامن جو زعفران اور عرقِ گلاب کے شربت میں محفوظ ہیں۔",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80",
    badge: "Festive Favorite",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Mawa (Khoya)", "Milk Solids", "Refined Flour", "Sugar Syrup", "Cardamom", "Rose Water", "Saffron Essence"],
      availableSizes: ["500g Can (8-10 Pieces)", "1kg Gift Tin (16-18 Pieces)"],
      shelfLife: "12 Months (Unopened)",
      storage: "Keep in a cool dry place. Once opened, refrigerate and consume within 5 days.",
      availability: "In Stock - Popular for gifts, weddings, and festive occasions.",
      certifications: ["100% Halal", "Pure Milk Ingredients"],
      servingSuggestion: "Warm gently before serving; garnish with crushed pistachios and slivered almonds."
    },
    tags: ["gulab jamun", "sweets", "mithai", "dessert", "canned sweets", "khoya"]
  },
  {
    id: "aone-sohan-halwa",
    name: "Multani Premium Sohan Halwa",
    urduName: "ملتانی پریمیم سوہن حلوہ",
    category: "Traditional Sweets",
    description: "Traditional brittle and chewy caramel halwa made from sprouted wheat (samnak), pure milk, pure desi ghee, and loaded with almonds, walnuts, and pistachios.",
    urduDescription: "انگوری گندم، خالص دودھ اور دیسی گھی سے تیار کردہ روایتی سوہن حلوہ، بادام اور پستہ سے بھرپور۔",
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80",
    popular: false,
    verifiedSpecs: {
      ingredients: ["Sprouted Wheat (Samnak)", "Buffalo Milk", "Pure Desi Ghee", "Sugar", "Almonds", "Pistachios", "Cardamom"],
      availableSizes: ["400g Metal Tin", "800g Gift Box"],
      shelfLife: "4 Months at room temperature",
      storage: "Store at ambient room temperature. Do not refrigerate.",
      availability: "In Stock - Special seasonal batches.",
      certifications: ["100% Halal", "Made with Pure Desi Ghee"],
      servingSuggestion: "A prestigious Pakistani gift item, perfect with winter green tea or milk tea."
    },
    tags: ["sohan halwa", "halwa", "desi ghee", "multani halwa", "mithai", "dry fruits"]
  },

  // --- Sauces & Condiments ---------------------------------------------------
  {
    id: "aone-imli-chutney",
    name: "Tangy Imli Chutney (Tamarind Sauce)",
    urduName: "کھٹی میٹھی املی کی چٹنی",
    category: "Sauces & Condiments",
    description: "Classic sweet and sour tamarind dip infused with jaggery (gur), cumin, ginger, and black salt. The essential companion for samosas, rolls, and BBQ.",
    urduDescription: "گڑ، زیرہ اور سونٹھ کے ساتھ تیار کردہ کھٹی میٹھی املی چٹنی۔ سموسوں، رولز اور باربی کیو کا لازمی ساتھی۔",
    image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=600&q=80",
    badge: "Tangy & Sweet",
    popular: true,
    verifiedSpecs: {
      ingredients: ["Natural Tamarind Pulp", "Jaggery (Gur)", "Sugar", "Dry Ginger (Sonth)", "Roasted Cumin", "Black Salt", "Red Chili Flakes"],
      availableSizes: ["300g Glass Squeeze Bottle", "500g Family Bottle"],
      shelfLife: "12 Months",
      storage: "Refrigerate after opening to preserve peak freshness.",
      availability: "In Stock across all partner retail grocers.",
      certifications: ["100% Halal", "Natural Pulp Only"],
      servingSuggestion: "Drizzle over chaat or use as a direct dipping sauce for fried savories."
    },
    tags: ["imli chutney", "tamarind sauce", "sauces", "dip", "samosa sauce", "chutney"]
  }
];

export const CATEGORIES = [
  "All Products",
  "Nimko & Snacks",
  "Spices & Recipe Mixes",
  "Ready-to-Cook & Frozen",
  "Traditional Sweets",
  "Sauces & Condiments"
] as const;

export function getProductById(id: string): Product | undefined {
  return AONE_PRODUCTS.find((p) => p.id === id || p.id.toLowerCase() === id.toLowerCase());
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return AONE_PRODUCTS;

  return AONE_PRODUCTS.filter((p) => {
    return (
      p.name.toLowerCase().includes(q) ||
      p.urduName.includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}
