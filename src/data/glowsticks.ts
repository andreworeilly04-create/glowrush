import glowstick1 from './01-standard-glow-sticks-6-inch.png'
import glowstick2 from './02-premium-glow-sticks-8-inch.png'
import glowstick3 from './03-jumbo-glow-sticks-12-inch.png'
import glowstick4 from './04-glow-necklaces-22-inch.png'
import glowstick5 from './05-glow-bracelets.png'
import glowstick6 from './06-premium-glow-bracelets.png'
import glowstick7 from './07-glow-stick-connectors-pack-of-10.png'
import glowstick8 from './08-glow-glasses.png'
import glowstick9 from './09-glow-headbands.png'
import glowstick10 from './10-glow-rings.png'
import glowstick11 from './11-glow-wands.png'
import glowstick12 from './12-foam-glow-sticks-led.png'
import glowstick13 from './13-glow-flowers.png'
import glowstick14 from './14-glow-balls.png'
import glowstick15 from './15-glow-stick-keychains.png'
import glowstick16 from './16-glow-lanterns.png'
import glowstick17 from './17-waterproof-glow-sticks.png'
import glowstick18 from './18-emergency-glow-sticks-12-hour.png'
import glowstick19 from './19-tactical-glow-sticks-green.png'
import glowstick20 from './20-multi-color-glow-sticks-pack-of-50.png'
import glowstick21 from './21-glow-stick-bucket-150-pack.png'
import glowstick22 from './22-festival-glow-pack-100-pack.png'
import glowstick23 from './23-party-mega-pack-200-pieces.png'
import glowstick24 from './24-glow-stick-bulk-box-500-pack.png'
import glowstick25 from './25-confetti-glow-sticks.png'
import glowstick26 from './26-heart-glow-sticks.png'
import glowstick27 from './27-jumbo-thick-glow-sticks-15-inch.png'
import glowstick28 from './28-bendable-glow-sticks.png'
import glowstick29 from './29-glow-shotgun-shells-12-gauge.png'
import glowstick30 from './30-glow-slap-bracelets.png'
import glowstick31 from './31-hanging-glow-lights.png'
import glowstick32 from './32-glow-stick-3-pack.png'
export type GlowStick = {
  id: number;
  image:any;
  name: string;
  category: string;
  price: number;
  rating: number;
  description: string;
};

export const glowsticks: GlowStick[] = [
  {
    id:1,
    name: "Classic Green Glow Stick",
    category: "Classic",
    price: 1.99,
    rating: 4.8,
    description: "Bright green 8-inch glow stick with a reliable long-lasting glow for parties and events.",
    image:glowstick1
  },
  {
    id:2,
    name: "Classic Blue Glow Stick",
    category: "Classic",
    price: 1.99,
    rating: 4.7,
    description: "Vibrant blue glow stick designed for parties, concerts, festivals, and nighttime events.",
    image:glowstick2
  },
  {
    id:3,
    name: "Classic Red Glow Stick",
    category: "Classic",
    price: 1.99,
    rating: 4.7,
    description: "Bold red 8-inch glow stick that adds a bright pop of color to any celebration.",
    image:glowstick3
  },
  {
    id:4,
    name: "Classic Pink Glow Stick",
    category: "Classic",
    price: 1.99,
    rating: 4.8,
    description: "Fun pink glow stick with a bright, colorful glow for parties and celebrations.",
    image:glowstick4
  },
  {
    id:5,
    name: "Rainbow Glow Stick",
    category: "Colorful",
    price: 2.49,
    rating: 4.9,
    description: "Multicolor glow stick featuring a vibrant rainbow effect for an eye-catching look.",
    image:glowstick5
  },
  {
    id:6,
    name: "Color-Changing Glow Stick",
    category: "Colorful",
    price: 2.99,
    rating: 4.8,
    description: "Glow stick that shifts through multiple colors for a dynamic nighttime display.",
    image:glowstick6,
  },
  {
    id:7,
    name: "Ultra Bright Green",
    category: "Ultra Bright",
    price: 2.79,
    rating: 4.9,
    description: "Extra-bright green glow stick made for maximum visibility at festivals and large events.",
    image:glowstick7,
  },
  {
    id:8,
    name: "Ultra Bright Blue",
    category: "Ultra Bright",
    price: 2.79,
    rating: 4.8,
    description: "High-intensity blue glow stick with a powerful glow that stands out in the dark.",
    image:glowstick8,
  },
  {
    id:9,
    name: "Ultra Bright Orange",
    category: "Ultra Bright",
    price: 2.79,
    rating: 4.8,
    description: "High-visibility orange glow stick perfect for energetic parties and outdoor events.",
    image:glowstick9
  },
  {
    id:10,
    name: "Jumbo 12-Inch Glow Stick",
    category: "Jumbo",
    price: 3.49,
    rating: 4.9,
    description: "Oversized 12-inch glow stick delivering a larger, more noticeable glow.",
    image:glowstick10,
  },
  {
    id:11,
    name: "Jumbo Green Glow Stick",
    category: "Jumbo",
    price: 3.49,
    rating: 4.8,
    description: "Large green glow stick designed for standout illumination at events and celebrations.",
    image:glowstick11,
  },
  {
    id:12,
    name: "Jumbo Blue Glow Stick",
    category: "Jumbo",
    price: 3.49,
    rating: 4.8,
    description: "Extra-large blue glow stick with a bright appearance and extended event presence.",
    image:glowstick12,
  },
  {
    id:13,
    name: "Glow Stick Bracelet",
    category: "Wearable",
    price: 1.49,
    rating: 4.7,
    description: "Flexible glow bracelet that easily bends into a wearable accessory for parties.",
    image:glowstick13,
  },
  {
    id:14,
    name: "Glow Stick Necklace",
    category: "Wearable",
    price: 1.99,
    rating: 4.8,
    description: "Wearable glow necklace that adds a colorful illuminated accessory to any outfit.",
    image:glowstick14,
  },
  {
    id:15,
    name: "Glow Stick Glasses",
    category: "Wearable",
    price: 4.99,
    rating: 4.9,
    description: "Fun glowing glasses designed to make party outfits stand out under low light.",
    image:glowstick15,
  },
  {
    id:16,
    name: "Glow Stick Headband",
    category: "Wearable",
    price: 3.99,
    rating: 4.7,
    description: "Flexible glowing headband that adds a playful illuminated touch to party looks.",
    image:glowstick16,
  },
  {
    id:17,
    name: "Mini Glow Sticks 4-Pack",
    category: "Mini",
    price: 2.49,
    rating: 4.6,
    description: "Four compact glow sticks that are easy to hand out as party favors or accessories.",
    image:glowstick17,
  },
  {
    id:18,
    name: "Mini Glow Sticks 10-Pack",
    category: "Mini",
    price: 4.99,
    rating: 4.8,
    description: "Ten colorful mini glow sticks ideal for party favors, games, and group activities.",
    image:glowstick18,
  },
  {
    id:19,
    name: "Mini Glow Sticks 25-Pack",
    category: "Mini",
    price: 9.99,
    rating: 4.9,
    description: "Value pack of 25 mini glow sticks for larger parties, events, and celebrations.",
    image:glowstick19,
  },
  {
    id:20,
    name: "Glow Stick Party Pack",
    category: "Party Packs",
    price: 14.99,
    rating: 4.9,
    description: "Mixed-color glow stick assortment packed for parties, birthdays, and group events.",
    image:glowstick20,
  },
  {
    id:21,
    name: "Glow Stick Festival Pack",
    category: "Party Packs",
    price: 19.99,
    rating: 4.9,
    description: "Large assortment of colorful glow products built for festivals and nighttime gatherings.",
    image:glowstick21,
  },
  {
    id:22,
    name: "Glow Stick Rave Pack",
    category: "Party Packs",
    price: 24.99,
    rating: 4.8,
    description: "Vibrant assortment of glow sticks and accessories made for rave and dance events.",
    image:glowstick22,
  },
  {
    id:23,
    name: "Glow Stick Wedding Pack",
    category: "Party Packs",
    price: 17.99,
    rating: 4.7,
    description: "Elegant mix of glow accessories designed for receptions, send-offs, and nighttime weddings.",
    image:glowstick23,
  },
  {
    id:24,
    name: "Glitter Glow Stick",
    category: "Specialty",
    price: 2.99,
    rating: 4.7,
    description: "Glow stick with a glitter-inspired look for extra visual flair at parties.",
    image:glowstick24,
  },
  {
    id:25,
    name: "Sparkle Glow Wand",
    category: "Specialty",
    price: 3.99,
    rating: 4.8,
    description: "Decorative glowing wand with a playful sparkle effect for celebrations and events.",
    image:glowstick25,
  },
  {
    id:26,
    name: "Super Long-Lasting Glow Stick",
    category: "Long Lasting",
    price: 3.49,
    rating: 4.9,
    description: "Long-duration glow stick designed to keep shining throughout extended events.",
    image:glowstick26,
  },
  {
    id:27,
    name: "24-Hour Glow Stick",
    category: "Long Lasting",
    price: 4.49,
    rating: 4.8,
    description: "Extra-long-lasting glow stick made for overnight events, camping, and extended parties.",
    image:glowstick27,
  },
  {
    id:28,
    name: "Eco Glow Bracelet",
    category: "Eco-Friendly",
    price: 2.49,
    rating: 4.6,
    description: "Eco-conscious glow bracelet option for customers looking for a more sustainable party accessory.",
    image:glowstick28,
  },
  {
    id:29,
    name: "Glow Stick Safety Wand",
    category: "Safety",
    price: 3.99,
    rating: 4.8,
    description: "Bright illuminated wand designed to improve visibility at nighttime events and outdoor activities.",
    image:glowstick29,
  },
  {
    id:30,
    name: "Glow Stick Fishing Float",
    category: "Outdoor",
    price: 2.99,
    rating: 4.7,
    description: "Compact glow stick designed to provide nighttime visibility for fishing and outdoor use.",
    image:glowstick30,
  },
  {
    id:31,
    name: "Glow Stick Camping Pack",
    category: "Outdoor",
    price: 12.99,
    rating: 4.9,
    description: "Assorted glow sticks for camping, nighttime activities, and emergency visibility.",
    image:glowstick31,
  },
  {
    id:32,
    name: "Neon Green Mega Glow Stick",
    category: "Neon",
    price: 3.99,
    rating: 5.0,
    description: "Eye-catching neon green glow stick with an intense look made for standout parties.",
    image:glowstick32,
  },
];

export default glowsticks;
