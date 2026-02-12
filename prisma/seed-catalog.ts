// prisma/seed-catalog.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MasterServiceEntry {
  code: string;
  name: string;
  category: string;
  subcategory: string;
  defaultDuration: number;
  description: string;
}

const masterServices: MasterServiceEntry[] = [
  // ─────────────────────────────────────────────────────────────
  // HAIR_SALON
  // ─────────────────────────────────────────────────────────────

  // Consultation
  { code: "HS-CON-001", name: "Hair Consultation", category: "HAIR_SALON", subcategory: "Consultation", defaultDuration: 30, description: "Assessment of hair type, condition, and styling goals" },

  // Cuts
  { code: "HS-CUT-001", name: "Women's Haircut", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 45, description: "Precision cut, wash, and style" },
  { code: "HS-CUT-002", name: "Men's Haircut", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 30, description: "Classic men's cut and style" },
  { code: "HS-CUT-003", name: "Kids Haircut (Under 12)", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 30, description: "Gentle haircut for children" },
  { code: "HS-CUT-004", name: "Bang/Fringe Trim", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 15, description: "Quick trim for bangs or fringe" },
  { code: "HS-CUT-005", name: "Dry Cut / Shape-Up", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 30, description: "Cut on dry hair for precise shaping" },

  // Natural Hair
  { code: "HS-NAT-001", name: "Wash & Go (Natural)", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 60, description: "Wash, condition, and define natural curls" },
  { code: "HS-NAT-002", name: "Twist Out", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 90, description: "Two-strand twist set and style" },
  { code: "HS-NAT-003", name: "Bantu Knots", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 75, description: "Bantu knot set for defined curls" },
  { code: "HS-NAT-004", name: "Flat Twist Style", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 90, description: "Flat twist protective style" },
  { code: "HS-NAT-005", name: "Coil Set", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 120, description: "Finger coil styling for defined look" },
  { code: "HS-NAT-006", name: "Afro Shaping", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 45, description: "Shape and trim natural afro" },
  { code: "HS-NAT-007", name: "Rod Set / Perm Rod Set", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 90, description: "Perm rods for bouncy curls" },
  { code: "HS-NAT-008", name: "Straw Set", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 120, description: "Tight spiral curls using straws" },

  // Braids
  { code: "HS-BRD-001", name: "Cornrows (Straight Back)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 90, description: "Classic straight-back cornrow style" },
  { code: "HS-BRD-002", name: "Cornrows (Design/Pattern)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 150, description: "Intricate cornrow patterns and designs" },
  { code: "HS-BRD-003", name: "Box Braids (Medium)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 240, description: "Medium-sized individual braids" },
  { code: "HS-BRD-004", name: "Box Braids (Small/Micro)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 360, description: "Small to micro-sized individual braids" },
  { code: "HS-BRD-005", name: "Knotless Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 300, description: "Feed-in knotless braiding technique" },
  { code: "HS-BRD-006", name: "Goddess Locs (Crochet)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 180, description: "Goddess locs installed with crochet method" },
  { code: "HS-BRD-007", name: "Passion Twists", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 240, description: "Bohemian-style passion twist braids" },
  { code: "HS-BRD-008", name: "Senegalese Twists", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 240, description: "Rope-style Senegalese twists" },
  { code: "HS-BRD-009", name: "Feed-In Braids (2\u20136 braids)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 90, description: "Stitch/feed-in braids, small count" },
  { code: "HS-BRD-010", name: "Fulani Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 180, description: "Fulani-inspired braided style" },
  { code: "HS-BRD-011", name: "Tribal Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 180, description: "Large tribal-style braids" },
  { code: "HS-BRD-012", name: "Crochet Braids / Locs Install", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 120, description: "Crochet method braid or loc install" },
  { code: "HS-BRD-013", name: "Braid Take-Down", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 60, description: "Careful removal of braids" },

  // Locs
  { code: "HS-LOC-001", name: "Loc Start (Coils/Twists)", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 120, description: "Begin locs with coils or twists" },
  { code: "HS-LOC-002", name: "Loc Retwist", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 90, description: "Maintenance retwist for existing locs" },
  { code: "HS-LOC-003", name: "Loc Retwist & Style", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 120, description: "Retwist with a styled finish" },
  { code: "HS-LOC-004", name: "Loc Interlocking", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 150, description: "Interlock maintenance technique" },
  { code: "HS-LOC-005", name: "Loc Repair (per loc)", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 15, description: "Repair individual damaged locs" },
  { code: "HS-LOC-006", name: "Loc Detox / Deep Cleanse", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 90, description: "Deep cleanse to remove buildup in locs" },
  { code: "HS-LOC-007", name: "Loc Colouring", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 120, description: "Apply colour to locs" },

  // Chemical Services
  { code: "HS-CHM-001", name: "Relaxer (Virgin)", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 120, description: "First-time chemical straightening" },
  { code: "HS-CHM-002", name: "Relaxer (Touch-Up)", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 90, description: "Relaxer applied to new growth" },
  { code: "HS-CHM-003", name: "Texturizer", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 75, description: "Loosen curl pattern without full straightening" },
  { code: "HS-CHM-004", name: "Keratin / Smoothing Treatment", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 180, description: "Keratin-based frizz control treatment" },
  { code: "HS-CHM-005", name: "Silk Press", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 90, description: "Flat iron press for sleek straight finish" },

  // Colour
  { code: "HS-COL-001", name: "Full Colour (Single Process)", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 90, description: "All-over single colour application" },
  { code: "HS-COL-002", name: "Root Touch-Up", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 60, description: "Colour applied to roots/new growth" },
  { code: "HS-COL-003", name: "Highlights (Foil)", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 120, description: "Foil highlight technique" },
  { code: "HS-COL-004", name: "Balayage / Ombr\u00e9", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 150, description: "Hand-painted colour technique" },
  { code: "HS-COL-005", name: "Fashion Colour / Vivids", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 150, description: "Bold or vivid colour application" },
  { code: "HS-COL-006", name: "Colour Correction", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 180, description: "Fix or adjust previous colour work" },
  { code: "HS-COL-007", name: "Rinse / Semi-Permanent Colour", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 45, description: "Temporary or semi-permanent colour" },
  { code: "HS-COL-008", name: "Bleach & Tone", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 120, description: "Lightening and toning service" },

  // Treatments
  { code: "HS-TRT-001", name: "Deep Conditioning Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 30, description: "Intensive moisture or protein treatment" },
  { code: "HS-TRT-002", name: "Hot Oil Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 30, description: "Warm oil scalp and hair therapy" },
  { code: "HS-TRT-003", name: "Scalp Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 45, description: "Targeted treatment for scalp issues" },
  { code: "HS-TRT-004", name: "Protein Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 45, description: "Strengthening protein therapy" },
  { code: "HS-TRT-005", name: "Bond Repair (Olaplex etc.)", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 45, description: "Bond-building repair treatment" },
  { code: "HS-TRT-006", name: "Steam Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 30, description: "Hydrating steam therapy" },

  // Extensions
  { code: "HS-EXT-001", name: "Sew-In Weave (Full)", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 150, description: "Full sew-in weave installation" },
  { code: "HS-EXT-002", name: "Sew-In Weave (Partial / Leave-Out)", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 120, description: "Partial sew-in with leave-out" },
  { code: "HS-EXT-003", name: "Wig Install (Lace Front)", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 60, description: "Lace front wig application and styling" },
  { code: "HS-EXT-004", name: "Wig Customisation", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 90, description: "Custom cutting, colouring, plucking of wig" },
  { code: "HS-EXT-005", name: "Tape-In Extensions", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 90, description: "Tape-in hair extension application" },
  { code: "HS-EXT-006", name: "Clip-In Install & Style", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 45, description: "Install and style clip-in extensions" },
  { code: "HS-EXT-007", name: "Ponytail Install", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 30, description: "Drawstring or clip ponytail styling" },

  // Bridal & Special Occasion
  { code: "HS-BRI-001", name: "Bridal Hair (Trial)", category: "HAIR_SALON", subcategory: "Bridal & Special Occasion", defaultDuration: 90, description: "Trial run for wedding day hairstyle" },
  { code: "HS-BRI-002", name: "Bridal Hair (Wedding Day)", category: "HAIR_SALON", subcategory: "Bridal & Special Occasion", defaultDuration: 120, description: "Wedding day hairstyling" },
  { code: "HS-BRI-003", name: "Special Occasion Updo", category: "HAIR_SALON", subcategory: "Bridal & Special Occasion", defaultDuration: 75, description: "Formal updo for events" },
  { code: "HS-BRI-004", name: "Prom / Formal Style", category: "HAIR_SALON", subcategory: "Bridal & Special Occasion", defaultDuration: 75, description: "Styling for prom or formal events" },

  // Add-ons
  { code: "HS-ADD-001", name: "Blow Dry & Style", category: "HAIR_SALON", subcategory: "Add-ons", defaultDuration: 45, description: "Blow dry with round brush styling" },
  { code: "HS-ADD-002", name: "Flat Iron / Press Add-On", category: "HAIR_SALON", subcategory: "Add-ons", defaultDuration: 20, description: "Flat iron service added to another" },
  { code: "HS-ADD-003", name: "Trim Add-On", category: "HAIR_SALON", subcategory: "Add-ons", defaultDuration: 15, description: "Light trim added to any service" },
  { code: "HS-ADD-004", name: "Hair Tinsel (per strand)", category: "HAIR_SALON", subcategory: "Add-ons", defaultDuration: 5, description: "Sparkle tinsel strand add-on" },

  // ─────────────────────────────────────────────────────────────
  // BARBERSHOP
  // ─────────────────────────────────────────────────────────────

  // Haircuts
  { code: "BB-CUT-001", name: "Standard Men's Cut", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 30, description: "Classic barbershop haircut" },
  { code: "BB-CUT-002", name: "Skin Fade", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 40, description: "Fade down to the skin" },
  { code: "BB-CUT-003", name: "Taper Fade", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 35, description: "Gradual taper fade cut" },
  { code: "BB-CUT-004", name: "Buzz Cut", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 20, description: "All-over clipper cut" },
  { code: "BB-CUT-005", name: "Scissor Cut", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 40, description: "Full scissor haircut" },
  { code: "BB-CUT-006", name: "Kids Cut (Under 12)", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 25, description: "Child-friendly haircut" },
  { code: "BB-CUT-007", name: "Senior Cut (60+)", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 30, description: "Haircut for seniors" },
  { code: "BB-CUT-008", name: "Design / Hair Art", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 45, description: "Custom design carved into hair" },

  // Line-ups
  { code: "BB-LIN-001", name: "Line-Up / Edge-Up", category: "BARBERSHOP", subcategory: "Line-ups", defaultDuration: 15, description: "Crisp line-up around hairline" },
  { code: "BB-LIN-002", name: "Line-Up + Beard Shape", category: "BARBERSHOP", subcategory: "Line-ups", defaultDuration: 25, description: "Hairline and beard edge-up" },

  // Beard & Shave
  { code: "BB-BRD-001", name: "Beard Trim", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 20, description: "Shape and trim beard" },
  { code: "BB-BRD-002", name: "Beard Shape-Up", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 15, description: "Clean edges on beard line" },
  { code: "BB-BRD-003", name: "Hot Towel Shave", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 30, description: "Traditional straight razor shave with hot towel" },
  { code: "BB-BRD-004", name: "Head Shave", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 30, description: "Full head shave with razor" },

  // Colour
  { code: "BB-COL-001", name: "Grey Blending / Camo", category: "BARBERSHOP", subcategory: "Colour", defaultDuration: 30, description: "Camouflage grey hairs for natural look" },
  { code: "BB-COL-002", name: "Hair Colour (Full)", category: "BARBERSHOP", subcategory: "Colour", defaultDuration: 45, description: "Full hair colour application" },
  { code: "BB-COL-003", name: "Beard Colour / Tint", category: "BARBERSHOP", subcategory: "Colour", defaultDuration: 20, description: "Colour or tint for beard" },

  // Grooming
  { code: "BB-GRM-001", name: "Eyebrow Wax / Thread", category: "BARBERSHOP", subcategory: "Grooming", defaultDuration: 10, description: "Clean up eyebrows" },
  { code: "BB-GRM-002", name: "Nose Wax", category: "BARBERSHOP", subcategory: "Grooming", defaultDuration: 10, description: "Quick nose hair wax removal" },

  // Packages
  { code: "BB-PKG-001", name: "Cut + Beard Combo", category: "BARBERSHOP", subcategory: "Packages", defaultDuration: 45, description: "Haircut and full beard service" },
  { code: "BB-PKG-002", name: "The Works (Cut + Beard + Shave)", category: "BARBERSHOP", subcategory: "Packages", defaultDuration: 75, description: "Full haircut, beard, and shave package" },

  // ─────────────────────────────────────────────────────────────
  // NAIL_SALON
  // ─────────────────────────────────────────────────────────────

  // Manicures
  { code: "NS-MAN-001", name: "Classic Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 30, description: "Shape, buff, cuticle care, and polish" },
  { code: "NS-MAN-002", name: "French Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 40, description: "Classic French tip manicure" },
  { code: "NS-MAN-003", name: "Luxury / Spa Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 50, description: "Extended manicure with scrub and mask" },
  { code: "NS-MAN-004", name: "Express Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 20, description: "Quick file, buff, and polish" },

  // Pedicures
  { code: "NS-PED-001", name: "Classic Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 45, description: "Soak, scrub, shape, and polish" },
  { code: "NS-PED-002", name: "French Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 50, description: "French tip pedicure" },
  { code: "NS-PED-003", name: "Luxury / Spa Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 60, description: "Full spa pedicure with extras" },
  { code: "NS-PED-004", name: "Express Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 25, description: "Quick pedicure \u2014 file, buff, polish" },
  { code: "NS-PED-005", name: "Callus Removal Add-On", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 15, description: "Extra callus treatment" },

  // Gel & Shellac
  { code: "NS-GEL-001", name: "Gel Manicure", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 45, description: "Gel polish manicure with UV/LED cure" },
  { code: "NS-GEL-002", name: "Gel Pedicure", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 55, description: "Gel polish pedicure with UV/LED cure" },
  { code: "NS-GEL-003", name: "Gel Removal", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 20, description: "Soak-off gel polish removal" },
  { code: "NS-GEL-004", name: "Gel Removal + New Set", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 60, description: "Remove old gel, apply fresh set" },
  { code: "NS-GEL-005", name: "Builder Gel Overlay", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 50, description: "Gel overlay for natural nail reinforcement" },

  // Enhancements
  { code: "NS-ENH-001", name: "Acrylic Full Set", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 75, description: "Full set of acrylic nails" },
  { code: "NS-ENH-002", name: "Acrylic Fill", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 50, description: "Acrylic refill/maintenance" },
  { code: "NS-ENH-003", name: "Acrylic Removal", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 30, description: "Safe acrylic nail removal" },
  { code: "NS-ENH-004", name: "Dip Powder Full Set", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 60, description: "Full set using dip powder system" },
  { code: "NS-ENH-005", name: "Dip Powder Refill", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 45, description: "Dip powder maintenance refill" },
  { code: "NS-ENH-006", name: "Poly Gel Full Set", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 75, description: "Full set using poly gel" },
  { code: "NS-ENH-007", name: "Nail Repair (per nail)", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 10, description: "Fix a single broken nail" },

  // Nail Art
  { code: "NS-ART-001", name: "Basic Nail Art (per nail)", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 10, description: "Simple design \u2014 lines, dots, glitter" },
  { code: "NS-ART-002", name: "Advanced Nail Art (per nail)", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 20, description: "Complex hand-painted or 3D design" },
  { code: "NS-ART-003", name: "Chrome / Mirror Finish", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 15, description: "Chrome or mirror powder application" },
  { code: "NS-ART-004", name: "Foil / Stamp Design (full set)", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 25, description: "Foil or stamped design on all nails" },

  // Treatments
  { code: "NS-TRT-001", name: "Paraffin Wax (Hands)", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 15, description: "Warm paraffin wax hand treatment" },
  { code: "NS-TRT-002", name: "Paraffin Wax (Feet)", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 15, description: "Warm paraffin wax foot treatment" },
  { code: "NS-TRT-003", name: "Nail Strengthening Treatment", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 20, description: "Keratin or hardener nail therapy" },

  // Kids
  { code: "NS-KID-001", name: "Kids Manicure", category: "NAIL_SALON", subcategory: "Kids", defaultDuration: 20, description: "Fun manicure for children" },
  { code: "NS-KID-002", name: "Kids Pedicure", category: "NAIL_SALON", subcategory: "Kids", defaultDuration: 25, description: "Gentle pedicure for children" },
];

async function main() {
  console.log("Seeding master service catalog...");
  console.log(`Total services to upsert: ${masterServices.length}`);

  let created = 0;
  let updated = 0;

  for (const service of masterServices) {
    const result = await prisma.masterService.upsert({
      where: { code: service.code },
      update: {
        name: service.name,
        category: service.category,
        subcategory: service.subcategory,
        defaultDuration: service.defaultDuration,
        description: service.description,
        isActive: true,
      },
      create: {
        code: service.code,
        name: service.name,
        category: service.category,
        subcategory: service.subcategory,
        defaultDuration: service.defaultDuration,
        description: service.description,
        isActive: true,
      },
    });

    // If updatedAt is very close to createdAt, it was likely just created
    const wasCreated =
      result.createdAt.getTime() === result.updatedAt.getTime();
    if (wasCreated) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(
    `Master services seeded: ${created} created, ${updated} updated`
  );

  // Set onboardingComplete = true for all existing businesses
  const businessResult = await prisma.business.updateMany({
    data: { onboardingComplete: true },
  });

  console.log(
    `Updated ${businessResult.count} businesses with onboardingComplete = true`
  );

  console.log("Catalog seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Catalog seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
