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
  // HAIR_SALON (62 services)
  // ─────────────────────────────────────────────────────────────

  // Consultation & Basics
  { code: "HCONSULT", name: "Hair Consultation", category: "HAIR_SALON", subcategory: "Consultation", defaultDuration: 30, description: "Assessment of hair type, condition, and styling goals" },
  { code: "HWASH", name: "Shampoo & Blow Dry", category: "HAIR_SALON", subcategory: "Wash & Style", defaultDuration: 45, description: "Wash, condition, and blow dry styling" },
  { code: "HSCALPMASS", name: "Scalp Massage", category: "HAIR_SALON", subcategory: "Wash & Style", defaultDuration: 15, description: "Relaxing scalp massage treatment" },

  // Cuts
  { code: "HCUT_W", name: "Women's Haircut", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 45, description: "Precision cut, wash, and style" },
  { code: "HCUT_M", name: "Men's Haircut", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 30, description: "Classic men's cut and style" },
  { code: "HCUT_K", name: "Kids Haircut (Under 12)", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 30, description: "Gentle haircut for children" },
  { code: "HBLOW", name: "Blow Dry & Style", category: "HAIR_SALON", subcategory: "Styling", defaultDuration: 45, description: "Blow dry with round brush styling" },
  { code: "HSILK", name: "Silk Press", category: "HAIR_SALON", subcategory: "Styling", defaultDuration: 90, description: "Flat iron press for sleek straight finish on natural hair" },
  { code: "HBANGTRIM", name: "Bang / Fringe Trim", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 15, description: "Quick trim for bangs or fringe" },
  { code: "HNECKCLEAN", name: "Neckline Clean-Up", category: "HAIR_SALON", subcategory: "Cuts", defaultDuration: 10, description: "Tidy up the neckline between cuts" },

  // Natural Hair
  { code: "HNAT_WASHGO", name: "Wash & Go (Natural)", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 60, description: "Wash, condition, and define natural curls" },
  { code: "HNAT_TWISTS", name: "Two-Strand Twists", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 90, description: "Two-strand twist protective style" },
  { code: "HNAT_TWISTOUT", name: "Twist Out", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 90, description: "Twist out set and style for defined curls" },
  { code: "HNAT_RODSET", name: "Rod Set / Perm Rod Set", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 90, description: "Perm rods for bouncy curls" },
  { code: "HNAT_COILS", name: "Coil Set", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 120, description: "Finger coil styling for defined look" },
  { code: "HAFRO_SHAPE", name: "Afro Shaping", category: "HAIR_SALON", subcategory: "Natural Hair", defaultDuration: 45, description: "Shape and trim natural afro" },

  // Braids
  { code: "HBRAID_SINGLE", name: "Single / Individual Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 180, description: "Individual braid installation" },
  { code: "HBRAID_CORNBASIC", name: "Cornrows (Basic)", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 90, description: "Classic straight-back cornrow style" },
  { code: "HBRAID_FEEDIN", name: "Feed-In Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 90, description: "Stitch/feed-in braids for natural look" },
  { code: "HBRAID_BOX", name: "Box Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 240, description: "Medium to large box braids" },
  { code: "HBRAID_KNOTLESS", name: "Knotless Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 300, description: "Feed-in knotless braiding technique" },
  { code: "HBRAID_SENEGAL", name: "Senegalese Twists", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 240, description: "Rope-style Senegalese twists" },
  { code: "HLOC_FAUX", name: "Faux Locs", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 240, description: "Faux locs protective style installation" },
  { code: "HBRAID_CROCHET", name: "Crochet Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 120, description: "Crochet method braid install" },
  { code: "HBRAID_KIDS", name: "Kids Braids", category: "HAIR_SALON", subcategory: "Braids", defaultDuration: 60, description: "Child-friendly braiding styles" },

  // Locs
  { code: "HLOC_START", name: "Loc Start (Coils/Twists)", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 120, description: "Begin locs with coils or twists" },
  { code: "HLOC_RETWIST", name: "Loc Retwist", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 90, description: "Maintenance retwist for existing locs" },
  { code: "HLOC_STYLE", name: "Loc Styling", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 60, description: "Creative styling for locs" },
  { code: "HLOC_REPAIR", name: "Loc Repair", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 30, description: "Repair damaged or thinning locs" },
  { code: "HLOC_INTERLOCK", name: "Loc Interlocking", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 150, description: "Interlock maintenance technique" },
  { code: "HLOC_MICRO", name: "Microlocs", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 360, description: "Micro-sized loc installation" },
  { code: "HLOC_SISTER", name: "Sisterlocs", category: "HAIR_SALON", subcategory: "Locs", defaultDuration: 480, description: "Sisterloc installation or retightening" },

  // Chemical Services
  { code: "HRELAX_VIR", name: "Relaxer (Virgin)", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 120, description: "First-time chemical straightening" },
  { code: "HRELAX_RE", name: "Relaxer (Touch-Up)", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 90, description: "Relaxer applied to new growth" },
  { code: "HTEXT", name: "Texturizer", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 75, description: "Loosen curl pattern without full straightening" },
  { code: "HKERATIN", name: "Keratin / Smoothing Treatment", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 180, description: "Keratin-based frizz control treatment" },
  { code: "HPERM_BODY", name: "Body Wave Perm", category: "HAIR_SALON", subcategory: "Chemical Services", defaultDuration: 120, description: "Perm for loose body waves" },

  // Colour
  { code: "HCOL_FULL", name: "Full Colour (Single Process)", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 90, description: "All-over single colour application" },
  { code: "HCOL_SEMI", name: "Semi-Permanent Colour", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 45, description: "Temporary or semi-permanent colour rinse" },
  { code: "HCOL_ROOT", name: "Root Touch-Up", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 60, description: "Colour applied to roots and new growth" },
  { code: "HCOL_HILITE", name: "Highlights (Foil)", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 120, description: "Foil highlight technique" },
  { code: "HCOL_BALAY", name: "Balayage / Ombre", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 150, description: "Hand-painted balayage or ombre colour" },
  { code: "HCOL_TONER", name: "Toner", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 30, description: "Toner application to adjust colour tone" },
  { code: "HCOL_CORRECT", name: "Colour Correction", category: "HAIR_SALON", subcategory: "Colour", defaultDuration: 180, description: "Fix or adjust previous colour work" },

  // Treatments
  { code: "HTREAT_DEEP", name: "Deep Conditioning Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 30, description: "Intensive moisture or protein treatment" },
  { code: "HTREAT_PROT", name: "Protein Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 45, description: "Strengthening protein therapy" },
  { code: "HTREAT_BOND", name: "Bond Repair Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 45, description: "Bond-building repair treatment (Olaplex etc.)" },
  { code: "HTREAT_HOTOIL", name: "Hot Oil Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 30, description: "Warm oil scalp and hair therapy" },
  { code: "HTREAT_SCALP", name: "Scalp Treatment", category: "HAIR_SALON", subcategory: "Treatments", defaultDuration: 45, description: "Targeted treatment for scalp health" },

  // Extensions
  { code: "HEXT_SEWIN", name: "Sew-In Weave", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 150, description: "Full sew-in weave installation" },
  { code: "HEXT_QUICK", name: "Quick Weave", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 90, description: "Quick weave bonded installation" },
  { code: "HWIG_INSTALL", name: "Wig Install (Lace Front)", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 60, description: "Lace front wig application and styling" },
  { code: "HWIG_CUSTOM", name: "Wig Customisation", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 90, description: "Custom cutting, colouring, and plucking of wig" },
  { code: "HWIG_MAINT", name: "Wig Maintenance", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 45, description: "Wash, condition, and restyle wig" },
  { code: "HEXT_TAPE", name: "Tape-In Extensions", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 90, description: "Tape-in hair extension application" },
  { code: "HEXT_MICRO", name: "Micro-Link Extensions", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 150, description: "Micro-link / micro-bead extension install" },
  { code: "HEXT_KERATIN", name: "Keratin Tip Extensions", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 180, description: "Keratin-bonded tip extension install" },
  { code: "HEXT_CLIPIN", name: "Clip-In Install & Style", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 45, description: "Install and style clip-in extensions" },
  { code: "HEXT_REMOVE", name: "Extension Removal", category: "HAIR_SALON", subcategory: "Extensions", defaultDuration: 60, description: "Safe removal of hair extensions" },

  // Bridal & Events
  { code: "HBRIDE_TRIAL", name: "Bridal Hair (Trial)", category: "HAIR_SALON", subcategory: "Bridal & Events", defaultDuration: 90, description: "Trial run for wedding day hairstyle" },
  { code: "HBRIDE_DAY", name: "Bridal Hair (Wedding Day)", category: "HAIR_SALON", subcategory: "Bridal & Events", defaultDuration: 120, description: "Wedding day hairstyling" },
  { code: "HEVENT_STYLE", name: "Event Styling", category: "HAIR_SALON", subcategory: "Bridal & Events", defaultDuration: 75, description: "Styling for prom, formal, or special events" },

  // ─────────────────────────────────────────────────────────────
  // HAIR_SALON — Beauty Add-ons (4 services)
  // ─────────────────────────────────────────────────────────────
  { code: "HBROW_SHAPE", name: "Eyebrow Shaping", category: "HAIR_SALON", subcategory: "Beauty Add-ons", defaultDuration: 15, description: "Wax, thread, or tweeze eyebrow shaping" },
  { code: "HBROW_TINT", name: "Eyebrow Tinting", category: "HAIR_SALON", subcategory: "Beauty Add-ons", defaultDuration: 20, description: "Semi-permanent brow colour tint" },
  { code: "HWAX_FACE", name: "Facial Waxing", category: "HAIR_SALON", subcategory: "Beauty Add-ons", defaultDuration: 15, description: "Upper lip, chin, or full face waxing" },
  { code: "HMAKEUP_BASIC", name: "Basic Makeup Application", category: "HAIR_SALON", subcategory: "Beauty Add-ons", defaultDuration: 45, description: "Simple everyday or event-ready makeup" },

  // ─────────────────────────────────────────────────────────────
  // BARBERSHOP (25 services)
  // ─────────────────────────────────────────────────────────────

  // Haircuts
  { code: "BCUT_CLASSIC", name: "Classic Cut", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 30, description: "Traditional barbershop haircut" },
  { code: "BCUT_FADE", name: "Skin Fade", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 40, description: "Fade down to the skin" },
  { code: "BCUT_TAPER", name: "Taper Fade", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 35, description: "Gradual taper fade cut" },
  { code: "BCUT_AFRO", name: "Afro Shape-Up", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 40, description: "Shape and trim natural afro" },
  { code: "BCUT_MOHAWK", name: "Mohawk / Faux Hawk", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 45, description: "Mohawk or faux hawk cut and style" },
  { code: "BCUT_KIDS", name: "Kids Cut (Under 12)", category: "BARBERSHOP", subcategory: "Haircuts", defaultDuration: 25, description: "Child-friendly barber cut" },

  // Line-ups
  { code: "BLINE", name: "Line-Up / Edge-Up", category: "BARBERSHOP", subcategory: "Line-ups", defaultDuration: 15, description: "Crisp line-up around hairline" },
  { code: "BRAZOR_LINE", name: "Razor Line-Up", category: "BARBERSHOP", subcategory: "Line-ups", defaultDuration: 20, description: "Precise razor edge line-up" },
  { code: "BNECK_TRIM", name: "Neck Trim", category: "BARBERSHOP", subcategory: "Line-ups", defaultDuration: 10, description: "Quick neckline clean-up" },
  { code: "BDESIGN", name: "Hair Design / Art", category: "BARBERSHOP", subcategory: "Line-ups", defaultDuration: 45, description: "Custom design carved into hair" },

  // Beard & Shave
  { code: "BBEARD_TRIM", name: "Beard Trim", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 20, description: "Shape and trim full beard" },
  { code: "BBEARD_SHAPE", name: "Beard Shape-Up", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 15, description: "Clean edges on beard line" },
  { code: "BGOATEE", name: "Goatee Trim", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 15, description: "Shape and trim goatee" },
  { code: "BSHAVE_HOT", name: "Hot Towel Shave", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 30, description: "Traditional straight razor shave with hot towel" },
  { code: "BSHAVE_HEAD", name: "Head Shave", category: "BARBERSHOP", subcategory: "Beard & Shave", defaultDuration: 30, description: "Full head shave with razor" },

  // Colour
  { code: "BCOL_GREY", name: "Grey Blending / Camo", category: "BARBERSHOP", subcategory: "Colour", defaultDuration: 30, description: "Camouflage grey hairs for natural look" },
  { code: "BCOL_FULL", name: "Full Hair Colour", category: "BARBERSHOP", subcategory: "Colour", defaultDuration: 45, description: "Full hair colour application" },
  { code: "BBEARD_COL", name: "Beard Colour / Tint", category: "BARBERSHOP", subcategory: "Colour", defaultDuration: 20, description: "Colour or tint for beard" },

  // Grooming
  { code: "BSCALP_TREAT", name: "Scalp Treatment", category: "BARBERSHOP", subcategory: "Grooming", defaultDuration: 30, description: "Scalp treatment for dryness or irritation" },
  { code: "BEYEBROW", name: "Eyebrow Trim / Wax", category: "BARBERSHOP", subcategory: "Grooming", defaultDuration: 10, description: "Clean up and shape eyebrows" },
  { code: "BNOSE_EAR", name: "Nose & Ear Hair Trim", category: "BARBERSHOP", subcategory: "Grooming", defaultDuration: 10, description: "Quick nose and ear hair removal" },
  { code: "BFACE_MINI", name: "Mini Facial", category: "BARBERSHOP", subcategory: "Grooming", defaultDuration: 20, description: "Quick cleanse, exfoliate, and moisturise" },

  // Packages
  { code: "BPKG_CUTBEARD", name: "Cut + Beard Combo", category: "BARBERSHOP", subcategory: "Packages", defaultDuration: 45, description: "Haircut and full beard service" },
  { code: "BPKG_CUTSHAVE", name: "Cut + Shave Combo", category: "BARBERSHOP", subcategory: "Packages", defaultDuration: 60, description: "Haircut and hot towel shave" },
  { code: "BPKG_VIP", name: "VIP Package", category: "BARBERSHOP", subcategory: "Packages", defaultDuration: 75, description: "Full haircut, beard trim, and hot towel shave" },

  // ─────────────────────────────────────────────────────────────
  // NAIL_SALON (31 services)
  // ─────────────────────────────────────────────────────────────

  // Manicures
  { code: "NMAN_EXP", name: "Express Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 20, description: "Quick file, buff, and polish" },
  { code: "NMAN_CLASS", name: "Classic Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 30, description: "Shape, buff, cuticle care, and polish" },
  { code: "NMAN_MEN", name: "Men's Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 30, description: "Grooming manicure for men" },
  { code: "NMAN_SPA", name: "Spa Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 45, description: "Extended manicure with scrub and mask" },
  { code: "NMAN_DELUXE", name: "Deluxe Manicure", category: "NAIL_SALON", subcategory: "Manicures", defaultDuration: 50, description: "Premium manicure with hot towel and extras" },

  // Pedicures
  { code: "NPED_EXP", name: "Express Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 25, description: "Quick pedicure — file, buff, polish" },
  { code: "NPED_CLASS", name: "Classic Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 45, description: "Soak, scrub, shape, and polish" },
  { code: "NPED_MEN", name: "Men's Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 45, description: "Grooming pedicure for men" },
  { code: "NPED_SPA", name: "Spa Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 55, description: "Full spa pedicure with extras" },
  { code: "NPED_DELUXE", name: "Deluxe Pedicure", category: "NAIL_SALON", subcategory: "Pedicures", defaultDuration: 60, description: "Premium pedicure with hot towel and mask" },

  // Gel & Shellac
  { code: "NGEL_MAN", name: "Gel Manicure", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 45, description: "Gel polish manicure with UV/LED cure" },
  { code: "NGEL_PED", name: "Gel Pedicure", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 55, description: "Gel polish pedicure with UV/LED cure" },
  { code: "NGEL_REM", name: "Gel Removal", category: "NAIL_SALON", subcategory: "Gel & Shellac", defaultDuration: 20, description: "Soak-off gel polish removal" },

  // Enhancements
  { code: "NACRY_FULL", name: "Acrylic Full Set", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 75, description: "Full set of acrylic nails" },
  { code: "NACRY_FILL", name: "Acrylic Fill", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 50, description: "Acrylic refill and maintenance" },
  { code: "NGELBUIL_FULL", name: "Builder Gel Full Set", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 75, description: "Full set using builder gel" },
  { code: "NGELBUIL_FILL", name: "Builder Gel Fill", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 50, description: "Builder gel refill and maintenance" },
  { code: "NDIP", name: "Dip Powder", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 60, description: "Dip powder nail system application" },
  { code: "NOVR_NAT", name: "Natural Nail Overlay", category: "NAIL_SALON", subcategory: "Enhancements", defaultDuration: 45, description: "Gel or acrylic overlay on natural nails" },

  // Nail Art
  { code: "NART_FRENCH", name: "French Tips", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 15, description: "Classic or coloured French tip design" },
  { code: "NART_SIMPLE", name: "Simple Nail Art (per nail)", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 10, description: "Simple design — lines, dots, glitter" },
  { code: "NART_DETAILED", name: "Detailed Nail Art (per nail)", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 20, description: "Complex hand-painted or 3D design" },
  { code: "NART_CHROME", name: "Chrome / Mirror Finish", category: "NAIL_SALON", subcategory: "Nail Art", defaultDuration: 15, description: "Chrome or mirror powder application" },

  // Treatments
  { code: "NREPAIR", name: "Nail Repair (per nail)", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 10, description: "Fix a single broken or damaged nail" },
  { code: "NCUTICLE_TREAT", name: "Cuticle Treatment", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 15, description: "Cuticle care and conditioning" },
  { code: "NSTRENGTH", name: "Nail Strengthening Treatment", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 20, description: "Keratin or hardener nail therapy" },
  { code: "NCALLUS", name: "Callus Removal", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 15, description: "Professional callus treatment" },
  { code: "NPARAFFIN_HAND", name: "Paraffin Wax (Hands)", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 15, description: "Warm paraffin wax hand treatment" },
  { code: "NPARAFFIN_FOOT", name: "Paraffin Wax (Feet)", category: "NAIL_SALON", subcategory: "Treatments", defaultDuration: 15, description: "Warm paraffin wax foot treatment" },

  // Kids
  { code: "NKIDS_MAN", name: "Kids Manicure", category: "NAIL_SALON", subcategory: "Kids", defaultDuration: 20, description: "Fun manicure for children" },
  { code: "NKIDS_PED", name: "Kids Pedicure", category: "NAIL_SALON", subcategory: "Kids", defaultDuration: 25, description: "Gentle pedicure for children" },
];

async function main() {
  console.log("Seeding master service catalog...");
  console.log(`Total services to upsert: ${masterServices.length}`);

  // Delete all existing master services (old codes will be cleared;
  // Service.masterServiceId FK has onDelete: SetNull so linked services are safe)
  const deleted = await prisma.masterService.deleteMany({});
  console.log(`Deleted ${deleted.count} existing master service records`);

  let created = 0;

  for (const service of masterServices) {
    await prisma.masterService.create({
      data: {
        code: service.code,
        name: service.name,
        category: service.category,
        subcategory: service.subcategory,
        defaultDuration: service.defaultDuration,
        description: service.description,
        isActive: true,
      },
    });
    created++;
  }

  console.log(`Master services created: ${created}`);

  // Set onboardingComplete = true for all existing businesses
  const businessResult = await prisma.business.updateMany({
    data: { onboardingComplete: true },
  });

  console.log(
    `Updated ${businessResult.count} businesses with onboardingComplete = true`
  );

  // Final count verification
  const totalCount = await prisma.masterService.count();
  console.log(`Total MasterService records in database: ${totalCount}`);

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
