// SEO-enriched content and static data for Ashva Experts

export const siteConfig = {
  name: "Ashva Experts",
  tagline: "Pure Water on Subscription",
  description:
    "India's most trusted water purifier subscription service. Get RO, UV, Copper & Alkaline purifiers installed in 48 hours with free maintenance, filter replacement, and 24/7 support. Starting at just ₹399/month.",
  url: "https://www.ashvaexperts.com",
  phone: "+91 98765 43210",
  email: "hello@ashvaexperts.com",
  supportEmail: "support@ashvaexperts.com",
  legalEmail: "legal@ashvaexperts.com",
  privacyEmail: "privacy@ashvaexperts.com",
  whatsapp: "919876543210",
  address: {
    street: "123 Water Tower Road, HSR Layout",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560102",
    country: "India",
  },
  social: {
    facebook: "https://facebook.com/ashvaexperts",
    instagram: "https://instagram.com/ashvaexperts",
    twitter: "https://twitter.com/ashvaexperts",
    linkedin: "https://linkedin.com/company/ashvaexperts",
    youtube: "https://youtube.com/@ashvaexperts",
  },
};

export const heroContent = {
  headline: "Pure Water on Subscription. Installed in 48 Hours.",
  subheadline:
    "Premium RO water purifiers with free installation, maintenance, and filter replacement. No upfront cost. Cancel anytime.",
  ctaPrimary: "Check Availability",
  ctaSecondary: "View Plans",
  trustBadges: [
    { icon: "shield-check", text: "Free Installation" },
    { icon: "wrench", text: "Free Maintenance" },
    { icon: "refresh-cw", text: "Filter Replacement Included" },
    { icon: "clock", text: "48-Hour Installation" },
  ],
  stats: [
    { value: "50,000+", label: "Happy Families" },
    { value: "100+", label: "Cities Served" },
    { value: "4.8★", label: "Customer Rating" },
    { value: "48hrs", label: "Avg. Installation" },
  ],
};

export const howItWorksSteps = [
  {
    step: 1,
    title: "Check Availability",
    description:
      "Enter your pincode to see if we serve your area. We're rapidly expanding across India with service in 100+ cities.",
    icon: "map-pin",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  },
  {
    step: 2,
    title: "Choose Your Plan",
    description:
      "Select from our range of RO, UV, Copper, and Alkaline purifiers. Our water quality quiz helps you find the perfect match for your needs.",
    icon: "list-checks",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  },
  {
    step: 3,
    title: "Get Installed & Enjoy",
    description:
      "Our certified technicians install your purifier within 48 hours. Sit back and enjoy pure, healthy water with zero maintenance hassle.",
    icon: "droplets",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=400&fit=crop",
  },
];

export const howItWorksDetailed = [
  {
    step: 1,
    title: "Check Your Area",
    shortTitle: "Check",
    description: "Enter your pincode to instantly verify service availability in your area.",
    details: [
      "Instant pincode verification",
      "See available purifier models",
      "Get estimated installation time",
    ],
    icon: "map-pin",
  },
  {
    step: 2,
    title: "Choose Your Purifier",
    shortTitle: "Choose",
    description: "Select from RO, UV, Copper, or Alkaline purifiers based on your water quality and needs.",
    details: [
      "Take our 2-minute water quality quiz",
      "Compare features side-by-side",
      "Get personalized recommendations",
    ],
    icon: "list-checks",
  },
  {
    step: 3,
    title: "Select Your Plan",
    shortTitle: "Plan",
    description: "Pick monthly or prepaid billing. Prepaid plans offer up to 15% savings.",
    details: [
      "Flexible monthly payments",
      "Save up to 15% with prepaid",
      "No hidden charges, ever",
    ],
    icon: "credit-card",
  },
  {
    step: 4,
    title: "Schedule Installation",
    shortTitle: "Schedule",
    description: "Choose your preferred date and time slot. We'll be there within 48 hours.",
    details: [
      "Pick your convenient slot",
      "Same-day slots available",
      "SMS & WhatsApp reminders",
    ],
    icon: "calendar",
  },
  {
    step: 5,
    title: "Professional Setup",
    shortTitle: "Install",
    description: "Our certified technicians handle everything - from setup to testing.",
    details: [
      "Background-verified technicians",
      "Complete installation in 30-45 mins",
      "Water quality testing included",
    ],
    icon: "wrench",
  },
  {
    step: 6,
    title: "Enjoy Pure Water",
    shortTitle: "Enjoy",
    description: "Start enjoying pure, healthy water. We handle all maintenance automatically.",
    details: [
      "Track usage via our app",
      "Automatic service reminders",
      "24/7 customer support",
    ],
    icon: "droplets",
  },
];

export const subscriptionBenefits = [
  {
    icon: "shield-check",
    title: "Zero Upfront Cost",
    description: "No need to spend ₹15,000-35,000 on buying a purifier. Just pay monthly.",
  },
  {
    icon: "wrench",
    title: "Free Maintenance Forever",
    description: "Regular servicing, repairs, and part replacements - all included.",
  },
  {
    icon: "filter",
    title: "Free Filter Replacements",
    description: "All filters and membranes replaced on schedule at no extra cost.",
  },
  {
    icon: "clock",
    title: "Same-Day Service",
    description: "Report issues before 2 PM, get technician visit the same day.",
  },
  {
    icon: "refresh-cw",
    title: "Free Upgrades",
    description: "Upgrade to a better purifier anytime. We'll swap it out for free.",
  },
  {
    icon: "x-circle",
    title: "Cancel Anytime",
    description: "No long-term commitment. Cancel after the lock-in period ends.",
  },
];

export const plans = [
  {
    id: "basic-ro",
    name: "Basic RO",
    slug: "basic-ro",
    description:
      "Perfect for municipal water with low TDS. Our 5-stage RO purification removes impurities while retaining essential minerals for healthy drinking water.",
    shortDescription: "5-stage RO purification for municipal water",
    monthlyPrice: 399,
    originalPrice: 499,
    depositAmount: 0,
    lockInMonths: 6,
    category: "home" as const,
    purifierType: "ro" as const,
    features: [
      "5-stage RO purification",
      "8L storage tank",
      "Free installation",
      "Quarterly maintenance",
      "Filter replacement included",
      "24/7 customer support",
    ],
    inclusions: [
      { title: "Installation", description: "Professional installation within 48 hours", icon: "wrench" },
      { title: "Maintenance", description: "Quarterly preventive maintenance visits", icon: "settings" },
      { title: "Filters", description: "All filter replacements included", icon: "filter" },
      { title: "Support", description: "24/7 WhatsApp & phone support", icon: "headphones" },
    ],
    specs: {
      stages: 5,
      tankCapacity: "8L",
      maxTds: 1500,
      warranty: "1 year",
      purificationRate: "12 L/hr",
    },
    badge: null,
    bestFor: "Municipal water with TDS below 500 ppm",
    imageUrl: "https://images.unsplash.com/photo-1624958723474-ba6d0c4d1c7a?w=600&h=600&fit=crop",
    isPopular: false,
    isActive: true,
    prepaidOptions: [
      { months: 3, discountPercent: 5, totalPrice: 1137, savingsAmount: 60 },
      { months: 6, discountPercent: 10, totalPrice: 2154, savingsAmount: 240 },
      { months: 12, discountPercent: 15, totalPrice: 4069, savingsAmount: 719 },
    ],
  },
  {
    id: "advanced-ro-uv",
    name: "Advanced RO+UV",
    slug: "advanced-ro-uv",
    description:
      "Our most popular choice for borewell and tanker water. 7-stage RO+UV purification eliminates bacteria, viruses, and heavy metals for crystal-clear water.",
    shortDescription: "7-stage RO+UV for borewell & tanker water",
    monthlyPrice: 549,
    originalPrice: 699,
    depositAmount: 0,
    lockInMonths: 6,
    category: "home" as const,
    purifierType: "ro-uv" as const,
    features: [
      "7-stage RO+UV purification",
      "10L storage tank",
      "Free installation",
      "Monthly maintenance",
      "Filter replacement included",
      "TDS controller",
      "UV sterilization",
      "24/7 priority support",
    ],
    inclusions: [
      { title: "Installation", description: "Professional installation within 48 hours", icon: "wrench" },
      { title: "Maintenance", description: "Monthly preventive maintenance visits", icon: "settings" },
      { title: "Filters", description: "All filter replacements included", icon: "filter" },
      { title: "Support", description: "24/7 priority WhatsApp & phone support", icon: "headphones" },
    ],
    specs: {
      stages: 7,
      tankCapacity: "10L",
      maxTds: 2000,
      warranty: "1 year",
      purificationRate: "15 L/hr",
    },
    badge: "Most Popular",
    bestFor: "Borewell & tanker water with high TDS",
    imageUrl: "https://images.unsplash.com/photo-1585687433141-694dd7c4e0b9?w=600&h=600&fit=crop",
    isPopular: true,
    isActive: true,
    prepaidOptions: [
      { months: 3, discountPercent: 5, totalPrice: 1565, savingsAmount: 82 },
      { months: 6, discountPercent: 10, totalPrice: 2965, savingsAmount: 329 },
      { months: 12, discountPercent: 15, totalPrice: 5600, savingsAmount: 988 },
    ],
  },
  {
    id: "premium-copper",
    name: "Premium Copper+",
    slug: "premium-copper",
    description:
      "Experience the ancient wisdom of copper-infused water with modern 8-stage purification. Boosts immunity, aids digestion, and provides antioxidant benefits.",
    shortDescription: "8-stage RO+UV+Copper for health-conscious families",
    monthlyPrice: 749,
    originalPrice: 999,
    depositAmount: 0,
    lockInMonths: 6,
    category: "home" as const,
    purifierType: "ro-uv-copper" as const,
    features: [
      "8-stage RO+UV+Copper purification",
      "12L storage tank",
      "Free installation",
      "Monthly maintenance",
      "Filter replacement included",
      "TDS controller",
      "Copper infusion technology",
      "Alkaline boost",
      "24/7 VIP support",
    ],
    inclusions: [
      { title: "Installation", description: "Professional installation within 24 hours", icon: "wrench" },
      { title: "Maintenance", description: "Monthly preventive maintenance visits", icon: "settings" },
      { title: "Filters", description: "All filter & copper cartridge replacements", icon: "filter" },
      { title: "Support", description: "24/7 VIP WhatsApp & phone support", icon: "headphones" },
    ],
    specs: {
      stages: 8,
      tankCapacity: "12L",
      maxTds: 2500,
      warranty: "2 years",
      purificationRate: "18 L/hr",
    },
    badge: "Best Value",
    bestFor: "Health-conscious families seeking copper benefits",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
    isPopular: false,
    isActive: true,
    prepaidOptions: [
      { months: 3, discountPercent: 5, totalPrice: 2135, savingsAmount: 112 },
      { months: 6, discountPercent: 10, totalPrice: 4045, savingsAmount: 449 },
      { months: 12, discountPercent: 15, totalPrice: 7640, savingsAmount: 1348 },
    ],
  },
  {
    id: "alkaline-pro",
    name: "Alkaline Pro",
    slug: "alkaline-pro",
    description:
      "Elevate your hydration with pH-balanced alkaline water. Our 7-stage purification with alkaline enhancement helps neutralize acidity and improve overall wellness.",
    shortDescription: "7-stage RO+Alkaline for wellness enthusiasts",
    monthlyPrice: 649,
    originalPrice: 849,
    depositAmount: 0,
    lockInMonths: 6,
    category: "home" as const,
    purifierType: "ro-alkaline" as const,
    features: [
      "7-stage RO+Alkaline purification",
      "10L storage tank",
      "Free installation",
      "Monthly maintenance",
      "Filter replacement included",
      "pH balance (8-9.5)",
      "Mineral retention",
      "24/7 priority support",
    ],
    inclusions: [
      { title: "Installation", description: "Professional installation within 48 hours", icon: "wrench" },
      { title: "Maintenance", description: "Monthly preventive maintenance visits", icon: "settings" },
      { title: "Filters", description: "All filter replacements included", icon: "filter" },
      { title: "Support", description: "24/7 priority WhatsApp & phone support", icon: "headphones" },
    ],
    specs: {
      stages: 7,
      tankCapacity: "10L",
      maxTds: 2000,
      warranty: "1 year",
      purificationRate: "15 L/hr",
    },
    badge: null,
    bestFor: "Those seeking alkaline water health benefits",
    imageUrl: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&h=600&fit=crop",
    isPopular: false,
    isActive: true,
    prepaidOptions: [
      { months: 3, discountPercent: 5, totalPrice: 1850, savingsAmount: 97 },
      { months: 6, discountPercent: 10, totalPrice: 3505, savingsAmount: 389 },
      { months: 12, discountPercent: 15, totalPrice: 6620, savingsAmount: 1168 },
    ],
  },
];

export const testimonials = [
  {
    id: "1",
    name: "Priya Sharma",
    location: "Bangalore, Karnataka",
    rating: 5,
    quote:
      "Switched from buying a purifier to Ashva's subscription and it's the best decision. No more worrying about maintenance or filter changes. Their technician comes every month like clockwork!",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    planName: "Advanced RO+UV",
    verifiedCustomer: true,
  },
  {
    id: "2",
    name: "Rajesh Kumar",
    location: "Hyderabad, Telangana",
    rating: 5,
    quote:
      "Our borewell water had very high TDS. Ashva's RO+UV purifier handles it perfectly. The water tastes great and my family's health has improved noticeably.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    planName: "Advanced RO+UV",
    verifiedCustomer: true,
  },
  {
    id: "3",
    name: "Anita Desai",
    location: "Mumbai, Maharashtra",
    rating: 5,
    quote:
      "I love the copper-infused water! It's like having the benefits of traditional copper vessels with modern purification. The subscription model is so convenient.",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    planName: "Premium Copper+",
    verifiedCustomer: true,
  },
  {
    id: "4",
    name: "Vikram Patel",
    location: "Pune, Maharashtra",
    rating: 5,
    quote:
      "Running a small office with 15 people, the subscription model saves us so much hassle. One call and any issue is resolved within 24 hours. Highly recommend!",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    planName: "Advanced RO+UV",
    verifiedCustomer: true,
  },
  {
    id: "5",
    name: "Meera Krishnan",
    location: "Chennai, Tamil Nadu",
    rating: 5,
    quote:
      "As a mother of two, I was always worried about water quality. Ashva's purifier gives me peace of mind. The alkaline water is an added bonus for our health.",
    avatarUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
    planName: "Alkaline Pro",
    verifiedCustomer: true,
  },
  {
    id: "6",
    name: "Suresh Reddy",
    location: "Bangalore, Karnataka",
    rating: 5,
    quote:
      "Installation was done in just one day! The technician was professional and explained everything clearly. The monthly maintenance is a game-changer.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    planName: "Basic RO",
    verifiedCustomer: true,
  },
];

export const trustPoints = [
  {
    icon: "shield-check",
    title: "100% Service Guarantee",
    description:
      "If we can't fix an issue within 48 hours, we'll replace your purifier at no extra cost. Your satisfaction is our priority.",
  },
  {
    icon: "users",
    title: "Certified Technicians",
    description:
      "All our technicians are background-verified and trained professionals with an average 5+ years of experience.",
  },
  {
    icon: "clock",
    title: "Same-Day Response",
    description:
      "Report an issue before 2 PM and our technician will be at your doorstep the same day. Guaranteed.",
  },
  {
    icon: "refresh-cw",
    title: "Free Replacements",
    description:
      "All filters, membranes, and parts are replaced free of cost as part of your subscription. No hidden charges ever.",
  },
  {
    icon: "award",
    title: "ISO Certified Process",
    description:
      "Our installation and maintenance processes are ISO 9001:2015 certified for consistent quality and safety.",
  },
  {
    icon: "heart",
    title: "50,000+ Happy Families",
    description:
      "Join thousands of families across India who trust Ashva Experts for their daily drinking water needs.",
  },
];

export const faqs = [
  {
    id: "1",
    question: "How does the subscription model work?",
    answer:
      "You pay a fixed monthly fee that includes the purifier, installation, all maintenance visits, filter replacements, and 24/7 support. There's no upfront cost for the purifier. You can cancel anytime after the minimum lock-in period (usually 6 months).",
    category: "general",
    order: 1,
  },
  {
    id: "2",
    question: "What's included in the monthly subscription?",
    answer:
      "Your subscription includes: the water purifier on rent, professional installation, regular maintenance visits (monthly/quarterly based on plan), all filter and membrane replacements, repair services, and 24/7 customer support via phone and WhatsApp.",
    category: "general",
    order: 2,
  },
  {
    id: "3",
    question: "How quickly can you install the purifier?",
    answer:
      "We typically install within 48 hours of order confirmation in most cities. For Premium Copper+ plans, we offer priority 24-hour installation. You can choose your preferred installation slot during checkout.",
    category: "installation",
    order: 3,
  },
  {
    id: "4",
    question: "What if I need to relocate?",
    answer:
      "We offer free relocation within the same city once per year. For additional relocations or inter-city moves, a nominal fee applies. Just raise a request through your customer portal or WhatsApp, and we'll handle everything.",
    category: "service",
    order: 4,
  },
  {
    id: "5",
    question: "How do I know which purifier is right for my water?",
    answer:
      "Take our 2-minute Water Quality Quiz! It asks about your water source (municipal/borewell/tanker), family size, and preferences to recommend the perfect purifier. You can also call us for a free water quality consultation.",
    category: "general",
    order: 5,
  },
  {
    id: "6",
    question: "What happens if the purifier stops working?",
    answer:
      "Simply raise a service request via our app, website, or WhatsApp. For issues reported before 2 PM, we guarantee same-day technician visit. If the purifier can't be repaired on-site, we'll replace it within 48 hours at no extra cost.",
    category: "service",
    order: 6,
  },
  {
    id: "7",
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes! You can upgrade to a higher plan anytime, and we'll adjust your billing accordingly. Downgrades are allowed after completing your current lock-in period. Contact support to make changes.",
    category: "billing",
    order: 7,
  },
  {
    id: "8",
    question: "What are the payment options?",
    answer:
      "We accept all major payment methods: UPI, credit/debit cards, net banking, and wallets. You can also opt for auto-pay via UPI mandate for hassle-free monthly payments. Prepaid plans (3/6/12 months) offer additional savings.",
    category: "billing",
    order: 8,
  },
  {
    id: "9",
    question: "Is there any security deposit required?",
    answer:
      "No security deposit is required for any of our plans. You only pay the monthly subscription fee. This makes it completely risk-free to try our service.",
    category: "billing",
    order: 9,
  },
  {
    id: "10",
    question: "What is the minimum commitment period?",
    answer:
      "The minimum lock-in period is 6 months for all plans. After this period, you can cancel anytime with just 7 days notice. During the lock-in period, early cancellation charges may apply.",
    category: "billing",
    order: 10,
  },
  {
    id: "11",
    question: "Do I need to provide water connection for installation?",
    answer:
      "Yes, you need a water inlet connection (tap or pipe) and a power socket near the installation location. Our technician will assess the site and may suggest the best placement for optimal performance.",
    category: "installation",
    order: 11,
  },
  {
    id: "12",
    question: "How often do you replace filters?",
    answer:
      "Filter replacement frequency depends on usage and water quality. Typically, sediment filters are replaced every 3-4 months, carbon filters every 6 months, and RO membranes annually. Our technicians monitor and replace them proactively.",
    category: "service",
    order: 12,
  },
  {
    id: "13",
    question: "What water sources do your purifiers support?",
    answer:
      "Our purifiers work with municipal corporation water, borewell water, and tanker water. For very high TDS water (above 2000 ppm), we recommend our Advanced RO+UV or Premium Copper+ plans for best results.",
    category: "general",
    order: 13,
  },
  {
    id: "14",
    question: "Is the water from RO purifiers safe for infants?",
    answer:
      "Yes, absolutely! RO purified water is safe for infants and the entire family. Our purifiers include mineral retention technology to ensure essential minerals are retained while removing harmful contaminants.",
    category: "general",
    order: 14,
  },
  {
    id: "15",
    question: "What is copper-infused water and its benefits?",
    answer:
      "Copper-infused water contains trace amounts of copper, an essential mineral. It may help boost immunity, aid digestion, support joint health, and provide antioxidant benefits. Our Premium Copper+ plan uses a specialized copper infusion cartridge.",
    category: "general",
    order: 15,
  },
  {
    id: "16",
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel by calling our support number, raising a request on WhatsApp, or through your customer portal. We require 7 days notice. Our team will schedule a pickup of the purifier at a convenient time.",
    category: "billing",
    order: 16,
  },
  {
    id: "17",
    question: "What happens if I miss a monthly payment?",
    answer:
      "We send payment reminders 3 days before and on the due date. If payment is missed, you have a 7-day grace period. After this, service may be paused until payment is received. No late fees are charged during the grace period.",
    category: "billing",
    order: 17,
  },
  {
    id: "18",
    question: "Do you provide service on weekends?",
    answer:
      "Yes, we provide installation and repair services on Saturdays. For emergencies, limited support is available on Sundays as well. You can choose weekend slots during booking.",
    category: "service",
    order: 18,
  },
];

export const comparisonData = {
  subscription: {
    title: "Ashva Subscription",
    points: [
      { text: "₹399-749/month all-inclusive", positive: true },
      { text: "Free installation & setup", positive: true },
      { text: "Free maintenance forever", positive: true },
      { text: "Free filter replacements", positive: true },
      { text: "24/7 support included", positive: true },
      { text: "Upgrade anytime", positive: true },
      { text: "No repair costs ever", positive: true },
    ],
  },
  buying: {
    title: "Buying a Purifier",
    points: [
      { text: "₹15,000-35,000 upfront cost", positive: false },
      { text: "₹500-1,500 installation fee", positive: false },
      { text: "₹2,000-4,000/year AMC", positive: false },
      { text: "₹3,000-6,000/year filters", positive: false },
      { text: "Limited warranty period", positive: false },
      { text: "Stuck with same model", positive: false },
      { text: "Repair costs after warranty", positive: false },
    ],
  },
};

export const serviceAreas = [
  { city: "Bangalore", state: "Karnataka", pincodes: 150 },
  { city: "Hyderabad", state: "Telangana", pincodes: 120 },
  { city: "Mumbai", state: "Maharashtra", pincodes: 200 },
  { city: "Pune", state: "Maharashtra", pincodes: 80 },
  { city: "Chennai", state: "Tamil Nadu", pincodes: 100 },
  { city: "Delhi NCR", state: "Delhi", pincodes: 180 },
  { city: "Kolkata", state: "West Bengal", pincodes: 90 },
  { city: "Ahmedabad", state: "Gujarat", pincodes: 60 },
];

export const images = {
  hero: {
    main: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&h=800&fit=crop",
    mobile: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=800&fit=crop",
  },
  purifiers: {
    ro: "https://images.unsplash.com/photo-1624958723474-ba6d0c4d1c7a?w=600&h=600&fit=crop",
    roUv: "https://images.unsplash.com/photo-1585687433141-694dd7c4e0b9?w=600&h=600&fit=crop",
    copper: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop",
    alkaline: "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&h=600&fit=crop",
  },
  lifestyle: {
    family: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&h=600&fit=crop",
    kitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    water: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&h=600&fit=crop",
    technician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop",
  },
  trust: {
    certified: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    support: "https://images.unsplash.com/photo-1553775927-a071d5a6a39a?w=400&h=300&fit=crop",
  },
};
