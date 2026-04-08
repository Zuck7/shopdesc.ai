import "dotenv/config";
import { eq } from "drizzle-orm";
import { connectDB, db, getPool } from "../config/db.js";
import { users, products as productsTable } from "../models/schema.js";

const categories = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Beauty",
  "Toys",
  "Kitchen",
  "Office",
  "Automotive",
  "Health",
];

const products = [
  { name: "Wireless Noise-Cancelling Headphones", category: "Electronics", features: ["Active noise cancellation", "40-hour battery life", "Bluetooth 5.3"], benefits: ["Immersive audio experience", "All-day listening"], price: 149.99, tags: ["audio", "wireless", "premium"] },
  { name: "Organic Cotton T-Shirt", category: "Clothing", features: ["100% organic cotton", "Pre-shrunk fabric", "Tagless design"], benefits: ["Eco-friendly comfort", "Soft and breathable"], price: 29.99, tags: ["organic", "sustainable", "basics"] },
  { name: "Smart LED Desk Lamp", category: "Home & Garden", features: ["Adjustable color temperature", "USB charging port", "Touch controls"], benefits: ["Reduces eye strain", "Multi-functional workspace light"], price: 45.00, tags: ["smart", "lighting", "office"] },
  { name: "Running Shoes Pro X", category: "Sports", features: ["Carbon fiber plate", "Responsive foam midsole", "Breathable mesh upper"], benefits: ["Faster race times", "Lightweight energy return"], price: 179.99, tags: ["running", "performance", "footwear"] },
  { name: "Vitamin C Brightening Serum", category: "Beauty", features: ["20% vitamin C", "Hyaluronic acid", "Ferulic acid"], benefits: ["Brighter skin tone", "Reduces dark spots"], price: 38.00, tags: ["skincare", "serum", "anti-aging"] },
  { name: "Building Blocks Set (500 pieces)", category: "Toys", features: ["Compatible with major brands", "BPA-free plastic", "Storage box included"], benefits: ["Encourages creativity", "Hours of fun"], price: 34.99, tags: ["educational", "creative", "kids"] },
  { name: "Stainless Steel Chef Knife", category: "Kitchen", features: ["German steel blade", "Full tang construction", "Ergonomic handle"], benefits: ["Precision cutting", "Long-lasting sharpness"], price: 59.99, tags: ["cooking", "professional", "cutlery"] },
  { name: "Ergonomic Office Chair", category: "Office", features: ["Lumbar support", "Adjustable armrests", "Mesh back"], benefits: ["All-day comfort", "Better posture"], price: 349.00, tags: ["ergonomic", "furniture", "productivity"] },
  { name: "Car Phone Mount", category: "Automotive", features: ["360-degree rotation", "One-hand operation", "Universal fit"], benefits: ["Safe hands-free driving", "Easy navigation access"], price: 19.99, tags: ["car", "accessories", "phone"] },
  { name: "Protein Powder – Vanilla", category: "Health", features: ["25g protein per serving", "No artificial sweeteners", "Grass-fed whey"], benefits: ["Supports muscle recovery", "Clean nutrition"], price: 44.99, tags: ["protein", "fitness", "supplement"] },
  { name: "Bluetooth Portable Speaker", category: "Electronics", features: ["IPX7 waterproof", "12-hour battery", "Built-in microphone"], benefits: ["Music anywhere", "Pool and beach friendly"], price: 69.99, tags: ["audio", "portable", "outdoor"] },
  { name: "Linen Blend Blazer", category: "Clothing", features: ["Linen-cotton blend", "Slim fit", "Two-button closure"], benefits: ["Breathable summer style", "Versatile dress-up piece"], price: 129.00, tags: ["formal", "blazer", "menswear"] },
  { name: "Robot Vacuum Cleaner", category: "Home & Garden", features: ["LiDAR navigation", "Auto-empty dock", "App control"], benefits: ["Effortless clean floors", "Set it and forget it"], price: 399.00, tags: ["smart", "cleaning", "robot"] },
  { name: "Yoga Mat – Extra Thick", category: "Sports", features: ["6mm thickness", "Non-slip surface", "Carrying strap included"], benefits: ["Joint protection", "Stability in every pose"], price: 29.99, tags: ["yoga", "fitness", "mat"] },
  { name: "Retinol Night Cream", category: "Beauty", features: ["0.5% retinol", "Peptide complex", "Fragrance-free"], benefits: ["Smoother skin overnight", "Reduces fine lines"], price: 42.00, tags: ["skincare", "night-cream", "anti-aging"] },
  { name: "Remote Control Car", category: "Toys", features: ["4WD off-road", "Rechargeable battery", "2.4GHz remote"], benefits: ["Outdoor adventure fun", "Fast and durable"], price: 49.99, tags: ["rc", "outdoor", "kids"] },
  { name: "Cast Iron Dutch Oven", category: "Kitchen", features: ["5-quart capacity", "Enameled interior", "Oven-safe to 500°F"], benefits: ["Perfect braises and stews", "Even heat distribution"], price: 79.99, tags: ["cooking", "cast-iron", "bakeware"] },
  { name: "Standing Desk Converter", category: "Office", features: ["Gas-spring lift", "Keyboard tray", "32-inch surface"], benefits: ["Sit-stand flexibility", "Improved energy levels"], price: 199.00, tags: ["ergonomic", "desk", "health"] },
  { name: "Dash Cam 4K", category: "Automotive", features: ["4K UHD recording", "Night vision", "GPS tracking"], benefits: ["Evidence in accidents", "Peace of mind driving"], price: 129.99, tags: ["car", "camera", "safety"] },
  { name: "Omega-3 Fish Oil Capsules", category: "Health", features: ["1000mg EPA/DHA", "Triple-strength", "Lemon flavored"], benefits: ["Heart health support", "No fishy aftertaste"], price: 24.99, tags: ["omega-3", "supplement", "heart"] },
  { name: "Mechanical Gaming Keyboard", category: "Electronics", features: ["Cherry MX switches", "RGB per-key lighting", "Aluminum frame"], benefits: ["Precise tactile feedback", "Built to last"], price: 119.99, tags: ["gaming", "keyboard", "mechanical"] },
  { name: "Cashmere Scarf", category: "Clothing", features: ["100% cashmere wool", "Hand-finished edges", "200cm length"], benefits: ["Luxurious warmth", "Timeless accessory"], price: 89.00, tags: ["cashmere", "accessories", "winter"] },
  { name: "Air Purifier HEPA", category: "Home & Garden", features: ["H13 True HEPA filter", "Covers 500 sq ft", "Whisper-quiet mode"], benefits: ["Cleaner air at home", "Allergy relief"], price: 159.00, tags: ["air-quality", "health", "smart"] },
  { name: "Resistance Bands Set", category: "Sports", features: ["5 resistance levels", "Latex-free", "Door anchor included"], benefits: ["Full-body workout anywhere", "Progressive strength training"], price: 24.99, tags: ["fitness", "bands", "workout"] },
  { name: "Hyaluronic Acid Moisturizer", category: "Beauty", features: ["Triple-weight hyaluronic acid", "Ceramide complex", "Oil-free"], benefits: ["12-hour hydration", "Plumper skin"], price: 32.00, tags: ["skincare", "moisturizer", "hydration"] },
  { name: "Wooden Train Set", category: "Toys", features: ["60 pieces", "Compatible with major brands", "Non-toxic paint"], benefits: ["Encourages imagination", "Safe for toddlers"], price: 39.99, tags: ["wooden", "educational", "toddler"] },
  { name: "Espresso Machine", category: "Kitchen", features: ["15-bar pressure", "Built-in grinder", "Steam wand"], benefits: ["Cafe-quality espresso at home", "Fresh flavor every cup"], price: 299.00, tags: ["coffee", "espresso", "barista"] },
  { name: "Laptop Stand – Aluminum", category: "Office", features: ["Adjustable height", "Heat dissipation", "Foldable design"], benefits: ["Better screen ergonomics", "Cooler laptop"], price: 39.99, tags: ["laptop", "ergonomic", "portable"] },
  { name: "Tire Pressure Gauge Digital", category: "Automotive", features: ["Backlit LCD", "0.1 PSI accuracy", "Auto shut-off"], benefits: ["Accurate tire checks", "Safer driving"], price: 14.99, tags: ["car", "tools", "safety"] },
  { name: "Probiotic Daily Supplement", category: "Health", features: ["50 billion CFU", "15 strains", "Shelf-stable"], benefits: ["Gut health support", "Improved digestion"], price: 29.99, tags: ["probiotic", "gut-health", "supplement"] },
  { name: "USB-C Hub 7-in-1", category: "Electronics", features: ["4K HDMI", "100W passthrough charging", "SD card reader"], benefits: ["All ports in one hub", "Expand your laptop"], price: 44.99, tags: ["usb-c", "hub", "accessories"] },
  { name: "Waterproof Hiking Jacket", category: "Clothing", features: ["3-layer Gore-Tex", "Sealed seams", "Adjustable hood"], benefits: ["Stay dry in any weather", "Lightweight packability"], price: 199.00, tags: ["outdoor", "hiking", "rain"] },
  { name: "Smart Thermostat", category: "Home & Garden", features: ["Wi-Fi enabled", "Learning algorithm", "Geofencing"], benefits: ["Lower energy bills", "Comfort on autopilot"], price: 179.00, tags: ["smart", "energy", "climate"] },
  { name: "Foam Roller Set", category: "Sports", features: ["High-density EVA foam", "3 sizes included", "Textured surface"], benefits: ["Faster muscle recovery", "Deep tissue massage"], price: 34.99, tags: ["recovery", "fitness", "massage"] },
  { name: "SPF 50 Mineral Sunscreen", category: "Beauty", features: ["Zinc oxide formula", "Reef-safe", "Water resistant 80min"], benefits: ["Broad spectrum protection", "Safe for sensitive skin"], price: 22.00, tags: ["sunscreen", "skincare", "spf"] },
  { name: "Science Experiment Kit", category: "Toys", features: ["20 experiments", "Lab goggles included", "Ages 8+"], benefits: ["Hands-on STEM learning", "Sparks curiosity"], price: 29.99, tags: ["stem", "educational", "science"] },
  { name: "Non-Stick Frying Pan", category: "Kitchen", features: ["Ceramic coating", "PFOA-free", "Induction compatible"], benefits: ["Easy food release", "Healthier cooking"], price: 34.99, tags: ["cooking", "non-stick", "pan"] },
  { name: "Wireless Mouse – Silent", category: "Office", features: ["Silent click buttons", "DPI adjustable", "USB-C rechargeable"], benefits: ["No click noise distractions", "Weeks of battery life"], price: 29.99, tags: ["mouse", "wireless", "office"] },
  { name: "Portable Jump Starter", category: "Automotive", features: ["2000A peak", "Built-in flashlight", "USB power bank"], benefits: ["Start your car anywhere", "Emergency power source"], price: 89.99, tags: ["car", "emergency", "battery"] },
  { name: "Magnesium Glycinate Capsules", category: "Health", features: ["400mg elemental magnesium", "Highly absorbable", "Third-party tested"], benefits: ["Better sleep quality", "Muscle relaxation"], price: 19.99, tags: ["magnesium", "sleep", "supplement"] },
  { name: "4K Webcam with Microphone", category: "Electronics", features: ["4K resolution", "Auto-focus", "Dual stereo mic"], benefits: ["Crystal clear video calls", "Professional streaming"], price: 79.99, tags: ["webcam", "video", "streaming"] },
  { name: "Merino Wool Socks (3-Pack)", category: "Clothing", features: ["100% merino wool", "Moisture wicking", "Reinforced heel"], benefits: ["Warm and odor-free", "Long-lasting comfort"], price: 34.99, tags: ["socks", "merino", "basics"] },
  { name: "Solar Garden Lights (8-Pack)", category: "Home & Garden", features: ["Solar powered", "Auto on/off", "Stainless steel"], benefits: ["No wiring needed", "Beautiful nighttime ambiance"], price: 29.99, tags: ["solar", "garden", "lighting"] },
  { name: "Jump Rope – Weighted", category: "Sports", features: ["Adjustable weight", "Ball bearing handles", "Steel cable"], benefits: ["Effective cardio workout", "Improved coordination"], price: 19.99, tags: ["cardio", "fitness", "jump-rope"] },
  { name: "Lip Balm Set – Organic", category: "Beauty", features: ["4 flavors", "Beeswax formula", "SPF 15"], benefits: ["All-day moisture", "Natural ingredients"], price: 12.99, tags: ["lips", "organic", "skincare"] },
  { name: "Magnetic Building Tiles", category: "Toys", features: ["100 pieces", "Strong magnets", "Clear colors"], benefits: ["3D creative play", "STEM development"], price: 44.99, tags: ["magnetic", "educational", "building"] },
  { name: "Bamboo Cutting Board Set", category: "Kitchen", features: ["3 sizes", "Organic bamboo", "Juice grooves"], benefits: ["Knife-friendly surface", "Eco-friendly choice"], price: 27.99, tags: ["bamboo", "cutting-board", "eco"] },
  { name: "Monitor Light Bar", category: "Office", features: ["Auto dimming", "No screen glare", "USB powered"], benefits: ["Comfortable night work", "Space-saving design"], price: 49.99, tags: ["lighting", "monitor", "ergonomic"] },
  { name: "Car Seat Organizer", category: "Automotive", features: ["Multiple pockets", "Tablet holder", "Waterproof fabric"], benefits: ["Tidy back seat", "Easy kid access"], price: 22.99, tags: ["car", "organizer", "family"] },
  { name: "Collagen Peptides Powder", category: "Health", features: ["Type I & III collagen", "Grass-fed bovine", "Unflavored"], benefits: ["Healthier skin and joints", "Mixes into anything"], price: 34.99, tags: ["collagen", "skin", "supplement"] },
];

async function seed() {
  await connectDB();
  console.log("Connected to PostgreSQL");

  // Create a seed user
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, "seed@shopdesc.ai"))
    .limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: "Seed User",
        email: "seed@shopdesc.ai",
        passwordHash: "not-a-real-hash",
      })
      .returning();
    console.log("Created seed user");
  }

  if (!user) {
    throw new Error("Failed to create or find seed user");
  }

  // Clear existing seed products
  await db.delete(productsTable).where(eq(productsTable.userId, user.id));

  const docs = products.map((p) => ({
    userId: user.id,
    source: "manual" as const,
    name: p.name,
    category: p.category,
    features: p.features,
    benefits: p.benefits,
    price: String(p.price),
    currency: "USD",
    images: [] as string[],
    tags: p.tags,
  }));

  await db.insert(productsTable).values(docs);
  console.log(`Inserted ${docs.length} sample products`);

  await getPool().end();
  console.log("Done");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
