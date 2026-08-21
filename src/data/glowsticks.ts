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
  image: any;
  name: string;
  category: string;
  price: number;
  rating: number;
  quantity:1;
  description: string;
};

export const glowsticks: GlowStick[] = [
  // --- Category: Glow Sticks (8 products) ---
  {
    id: 1,
    name: "Multi-Color Classic Glow Stick Assortment",
    category: "Glow Sticks",
    price: 1.99,
    rating: 4.8,
    description: "A vibrant mix of traditional bright green, yellow, orange, red, and blue glow sticks designed for maximum brightness and long-lasting nighttime fun.",
    image: glowstick1,
    quantity:1
  },
  {
    id: 3,
    name: "Neon Rainbow Glow Sticks",
    category: "Glow Sticks",
    price: 1.99,
    rating: 4.7,
    description: "A dazzling transition of vivid red, orange, green, and pink tones arranged in a brilliant rainbow spectrum.",
    image: glowstick3,
    quantity:1
  },
  {
    id: 11,
    name: "Classic Thin Glow Sticks (Assorted Colors)",
    category: "Glow Sticks",
    price: 3.49,
    rating: 4.8,
    description: "Standard slim-profile glow sticks in a mix of vibrant neon colors for high-visibility fun.",
    image: glowstick11,
    quantity:1
  },
  {
    id: 17,
    name: "Mixed Glow Stick Assortment",
    category: "Glow Sticks",
    price: 2.49,
    rating: 4.6,
    description: "A vibrant assortment of standard multicolored glow sticks scattered across a dark surface for evening events.",
    image: glowstick17,
    quantity:1
  },
  {
    id: 28,
    name: "Classic Neon Glow Bracelets",
    category: "Glow Sticks",
    price: 2.49,
    rating: 4.6,
    description: "Flexible, bendable colorful bracelets that loop comfortably around the wrist to light up parties and concerts.",
    image: glowstick28,
    quantity:1
  },
  {
    id: 29,
    name: "Standard Glow Sticks Assortment",
    category: "Glow Sticks",
    price: 3.99,
    rating: 4.8,
    description: "A vibrant lineup of classic multi-color glow sticks standing upright for high-visibility party and event fun.",
    image: glowstick29,
    quantity:1
  },
  {
    id: 30,
    name: "Rainbow Glow Stick Lineup",
    category: "Glow Sticks",
    price: 2.99,
    rating: 4.7,
    description: "A bright, colorful assortment of slim neon glow sticks aligned in a full spectrum of shades.",
    image: glowstick30,
    quantity:1
  },
  {
    id: 31,
    name: "Textured Glow Sticks Assortment",
    category: "Glow Sticks",
    price: 12.99,
    rating: 4.9,
    description: "A selection of textured, high-visibility multi-color glow tubes designed for nighttime visibility and events.",
    image: glowstick31,
    quantity:1
  },

  // --- Category: Wearable Glow Accessories (8 products) ---
  {
    id: 4,
    name: "Flexible Neon Glow Strings / Wavy Glow Lines",
    category: "Wearable Glow Accessories",
    price: 1.99,
    rating: 4.8,
    description: "Thin, highly flexible, and bendable neon glowing filaments that can be shaped into custom curves and unique decorative lines.",
    image: glowstick4,
    quantity:1
  },
  {
    id: 5,
    name: "Rainbow Glow Bracelets / Necklaces",
    category: "Wearable Glow Accessories",
    price: 2.49,
    rating: 4.9,
    description: "Flexible, vibrant multi-colored bendable sticks linked into circular loops to wear as bright party bracelets or necklaces.",
    image: glowstick5,
    quantity:1
  },
  {
    id: 6,
    name: "Mesh Textured Glow Bracelets",
    category: "Wearable Glow Accessories",
    price: 2.99,
    rating: 4.8,
    description: "Multi-toned textured mesh bands designed to shift and display a spectrum of brilliant colors for nighttime events.",
    image: glowstick6,
    quantity:1
  },
  {
    id: 8,
    name: "Neon Shutter Shades",
    category: "Wearable Glow Accessories",
    price: 2.79,
    rating: 4.8,
    description: "High-visibility glowing novelty shutter shade glasses featuring a vibrant neon frame for parties, concerts, and raves.",
    image: glowstick8,
    quantity:1
  },
  {
    id: 9,
    name: "Glow Bunny Ears / Headband",
    category: "Wearable Glow Accessories",
    price: 2.79,
    rating: 4.8,
    description: "Fun, bendable glowing headband accessories shaped like bunny or animal ears, perfect for parties and festivals.",
    image: glowstick9,
    quantity:1
  },
  {
    id: 10,
    name: "LED Glow Rings / Diamond Glow Rings",
    category: "Wearable Glow Accessories",
    price: 3.49,
    rating: 4.9,
    description: "Large, flashing novelty rings featuring bright gem-shaped tops that light up for evening events.",
    image: glowstick10,
    quantity:1
  },
  {
    id: 15,
    name: "Mini Glow Sticks / Lanyard Glow Sticks",
    category: "Wearable Glow Accessories",
    price: 4.99,
    rating: 4.9,
    description: "Short, compact mini glow sticks equipped with hanging top loops, perfect for wearing as pendants or attaching to gear.",
    image: glowstick15,
    quantity:1
  },
  {
    id: 26,
    name: "Glow Stick Lanyards / Necklaces with Connectors",
    category: "Wearable Glow Accessories",
    price: 3.49,
    rating: 4.9,
    description: "Thin, flexible glow sticks attached to string lanyards designed to be worn easily around the neck at events.",
    image: glowstick26,
    quantity:1
  },

  // --- Category: Bulk Party Supplies (8 products) ---
  {
    id: 20,
    name: "Multi-Color Bulk Glow Stick Bundle",
    category: "Bulk Party Supplies",
    price: 14.99,
    rating: 4.9,
    description: "A massive, tightly bound fan of vibrant neon glow sticks featuring a full rainbow spectrum of colors.",
    image: glowstick20,
    quantity:1
  },
  {
    id: 21,
    name: "Festival Glow Stick Bucket",
    category: "Bulk Party Supplies",
    price: 19.99,
    rating: 4.9,
    description: "A large black container packed full of vibrant, multi-colored neon glow sticks designed for festivals and large events.",
    image: glowstick21,
    quantity:1
  },
  {
    id: 22,
    name: "Neon Glow Stick Display Box",
    category: "Bulk Party Supplies",
    price: 24.99,
    rating: 4.8,
    description: "An open display box featuring organized rows of brightly glowing, textured multi-color glow sticks.",
    image: glowstick22,
    quantity:1
  },
  {
    id: 23,
    name: "Mixed Glow Stick & Accessory Kit",
    category: "Bulk Party Supplies",
    price: 17.99,
    rating: 4.7,
    description: "A comprehensive mix of glowing items, including standard glow sticks, coiled bracelets, and connectors for celebrations.",
    image: glowstick23,
    quantity:1
  },
  {
    id: 24,
    name: "Bulk Glitter Glow Stick Box",
    category: "Bulk Party Supplies",
    price: 2.99,
    rating: 4.7,
    description: "A cardboard display box filled with a dense bundle of textured glitter-style glow sticks in a rainbow of bright colors.",
    image: glowstick24,
    quantity:1
  },
  {
    id: 32,
    name: "Thick Mega Glow Sticks",
    category: "Bulk Party Supplies",
    price: 3.99,
    rating: 5.0,
    description: "Extra-thick, bright neon glow sticks providing powerful illumination for parties and outdoor gatherings.",
    image: glowstick32,
    quantity:1
  },
  {
    id: 2,
    name: "Glitter Glow Tubes Assortment",
    category: "Bulk Party Supplies",
    price: 1.99,
    rating: 4.7,
    description: "Eye-catching, textured glow tubes packed with sparkling glitter details across a multi-color spectrum for an extra shimmering effect.",
    image: glowstick2,
    quantity:1
  },
  {
    id: 12,
    name: "Jumbo Foam Glow Batons / Multi-Color Glow Sticks",
    category: "Bulk Party Supplies",
    price: 3.49,
    rating: 4.8,
    description: "Extra-large, thick glow sticks featuring a bright gradient color spectrum for maximum visibility.",
    image: glowstick12,
    quantity:1
  },

  // --- Category: Special Effects & Gear (8 products) ---
  {
    id: 7,
    name: "Glow Stick Connectors & Adapters",
    category: "Special Effects & Gear",
    price: 2.79,
    rating: 4.9,
    description: "Transparent modular connector pieces used to link and build custom structures, shapes, or giant loops out of standard glow sticks.",
    image: glowstick7,
    quantity:1
  },
  {
    id: 13,
    name: "Flower Glow Stick Assembly / Shape",
    category: "Special Effects & Gear",
    price: 1.49,
    rating: 4.7,
    description: "Flexible glow sticks arranged and connected into an intricate, decorative flower shape for parties and evening fun.",
    image: glowstick13,
    quantity:1
  },
  {
    id: 14,
    name: "Glowing Bouncing Balls / LED Balls",
    category: "Special Effects & Gear",
    price: 1.99,
    rating: 4.8,
    description: "Smooth, colorful spheres that illuminate brightly, designed for fun nighttime games and sensory play.",
    image: glowstick14,
    quantity:1
  },
  {
    id: 16,
    name: "Glow Stick Holder / Storage Station",
    category: "Special Effects & Gear",
    price: 3.99,
    rating: 4.7,
    description: "A vertical upright container holding bundled bright neon glow sticks, keeping them organized and ready for distribution.",
    image: glowstick16,
    quantity:1
  },
  {
    id: 18,
    name: "Orange Industrial Glow Sticks Bundle",
    category: "Special Effects & Gear",
    price: 4.99,
    rating: 4.8,
    description: "Ten colorful mini glow sticks ideal for party favors, games, and group activities.",
    image: glowstick18,
    quantity:1
  },
  {
    id: 19,
    name: "Green Glow Foam Sticks / Novelty Wands",
    category: "Special Effects & Gear",
    price: 9.99,
    rating: 4.9,
    description: "Bright green illuminated foam wands equipped with specialized handles, perfect for concerts and night parties.",
    image: glowstick19,
    quantity:1
  },
  {
    id: 25,
    name: "Liquid Glitter Sensory Tubes",
    category: "Special Effects & Gear",
    price: 3.99,
    rating: 4.8,
    description: "Transparent vertical tubes filled with swirling floating glitter and colorful liquid for a mesmerizing sensory experience.",
    image: glowstick25,
    quantity:1
  },
  {
    id: 27,
    name: "Heavy-Duty Industrial Glow Sticks",
    category: "Special Effects & Gear",
    price: 4.49,
    rating: 4.8,
    description: "Thick, high-visibility textured glow sticks built to provide dependable illumination for extended outdoor or emergency use.",
    image: glowstick27,
    quantity:1
  }
];

export default glowsticks;
