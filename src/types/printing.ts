export interface PrintProduct {
  id: string;
  category: string;
  name: string;
  zoo_price: number;
  our_price: number; // +70%
  sizes: string[];
  paper_stock: string[];
  quantities: number[];
  turnaround: string;
  description: string;
  // New fields
  bleed?: { width: number; height: number };
  required_resolution?: number;
  template_url?: string;
  coatings?: string[];
  is_double_sided?: boolean;
  sku?: string;
  marketing_tips?: string;
  // Technical specs for file uploads
  bleed_margin?: number; // e.g., 0.125
  safe_zone?: number;    // e.g., 0.125
  requires_high_res: boolean;
}

export const PRINT_PRODUCTS: PrintProduct[] = [
  // BUSINESS CARDS
  {
    id: 'bc-standard-500',
    category: 'Business Cards',
    name: '16pt Glossy Business Cards (500)',
    zoo_price: 24.99,
    our_price: 42.48, // 24.99 * 1.7
    sizes: ['3.5" x 2"'],
    paper_stock: ['16pt Glossy', '17pt Matte', 'Ultra Thick 30pt'],
    quantities: [250, 500, 1000],
    turnaround: '2-4 days',
    description: 'Full color, double sided business cards',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.125
  },
  
  // FLYERS & BROCHURES
  {
    id: 'flyer-8.5x11-100',
    category: 'Flyers & Brochures',
    name: '8.5x11 Full Color Flyers (100)',
    zoo_price: 39.99,
    our_price: 67.98,
    sizes: ['8.5x11', '11x17', '5.5x8.5'],
    paper_stock: ['100lb Gloss', '100lb Matte', '80lb Gloss'],
    quantities: [100, 250, 500],
    turnaround: '3-5 days',
    description: 'Vibrant full color flyers',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.125
  },
  
  // POSTCARDS
  {
    id: 'postcard-4x6-100',
    category: 'Postcards',
    name: '4x6 Postcards (100)',
    zoo_price: 29.99,
    our_price: 50.98,
    sizes: ['4x6', '5x7', '6x9', '6x11'],
    paper_stock: ['14pt Gloss', '16pt Gloss UV', '17pt Matte'],
    quantities: [100, 250, 500],
    turnaround: '2-4 days',
    description: 'Direct mail ready postcards',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.125
  },
  
  // STICKERS & LABELS
  {
    id: 'sticker-circle-3x3-100',
    category: 'Stickers & Labels',
    name: '3x3 Circle Stickers (100)',
    zoo_price: 34.99,
    our_price: 59.48,
    sizes: ['2x2', '3x3', '4x4', '5x5'],
    paper_stock: ['Vinyl Gloss', 'Vinyl Matte', 'Bumper Sticker'],
    quantities: [100, 250, 500],
    turnaround: '4-6 days',
    description: 'Weatherproof vinyl stickers',
    requires_high_res: true,
    bleed_margin: 0.0625,
    safe_zone: 0.0625
  },
  
  // BOOKLETS & CATALOGS
  {
    id: 'booklet-8.5x11-25',
    category: 'Booklets & Catalogs',
    name: '8.5x11 Saddle Stitch Booklets (25)',
    zoo_price: 89.99,
    our_price: 152.98,
    sizes: ['5.5x8.5', '8x8', '8.5x11'],
    paper_stock: ['80lb Gloss Text', '100lb Gloss Text'],
    quantities: [25, 50, 100],
    turnaround: '7-10 days',
    description: 'Professional saddle-stitched catalogs',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.25
  },
  
  // DOOR HANGERS
  {
    id: 'doorhanger-4x11-100',
    category: 'Door Hangers',
    name: '4x11 Door Hangers w/ Slit (100)',
    zoo_price: 49.99,
    our_price: 84.98,
    sizes: ['3.5x11', '4x11'],
    paper_stock: ['14pt Gloss', '16pt Gloss UV'],
    quantities: [100, 250, 500],
    turnaround: '3-5 days',
    description: 'Door-to-door marketing with hang hole',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.125
  },
  
  // RACK CARDS
  {
    id: 'rackcard-4x9-100',
    category: 'Rack Cards',
    name: '4x9 Rack Cards (100)',
    zoo_price: 44.99,
    our_price: 76.48,
    sizes: ['4x9', '4x11'],
    paper_stock: ['14pt Gloss', '16pt Gloss UV'],
    quantities: [100, 250, 500],
    turnaround: '3-5 days',
    description: 'Perfect for display racks',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.125
  }
];

export const PRO_PRINT_PRODUCTS: PrintProduct[] = [
  // EVENT SIGNAGE (Essential for Venues/Artists)
  {
    id: 'banner-retractable-33x80',
    category: 'Event Signage',
    name: '33" x 80" Retractable Banner w/ Stand',
    zoo_price: 115.00,
    our_price: 195.50, // 1.7x Markup
    sizes: ['33" x 80"', '47" x 80"'],
    paper_stock: ['13oz Premium Scrim Vinyl', '15oz Stay-Flat Vinyl'],
    quantities: [1, 2, 5],
    turnaround: '3-5 days',
    description: 'Portable pull-up banner with carrying case. Perfect for stage presence.',
    bleed: { width: 33.5, height: 80.5 },
    required_resolution: 150,
    sku: 'EVT-BAN-RET-3380',
    requires_high_res: true,
    bleed_margin: 0.25,
    safe_zone: 0.5
  },
  {
    id: 'step-repeat-8x8',
    category: 'Event Signage',
    name: '8\' x 8\' Step & Repeat Backdrop',
    zoo_price: 185.00,
    our_price: 314.50,
    sizes: ['8\' x 8\'', '10\' x 8\''],
    paper_stock: ['9oz Premium Polyester Fabric'],
    quantities: [1, 2],
    turnaround: '5-7 days',
    description: 'Matte fabric backdrop for red carpet photos and stage backgrounds.',
    sku: 'EVT-SNR-8X8',
    requires_high_res: true,
    bleed_margin: 1.0,
    safe_zone: 2.0
  },

  // ADMINISTRATIVE (For Business Owners)
  {
    id: 'envelope-n10-500',
    category: 'Stationery',
    name: '#10 Standard Envelopes (500)',
    zoo_price: 65.00,
    our_price: 110.50,
    sizes: ['#10 (9.5" x 4.125")'],
    paper_stock: ['70lb Premium Uncoated Text'],
    quantities: [500, 1000, 2500],
    turnaround: '4-6 days',
    description: 'Professional branded envelopes for contracts and correspondence.',
    sku: 'ADM-ENV-N10-500',
    requires_high_res: true,
    bleed_margin: 0.0625,
    safe_zone: 0.125
  },
  {
    id: 'letterhead-8.5x11-500',
    category: 'Stationery',
    name: '8.5x11 Premium Letterhead (500)',
    zoo_price: 75.00,
    our_price: 127.50,
    sizes: ['8.5" x 11"'],
    paper_stock: ['70lb Premium Uncoated Text', '70lb Linen Text'],
    quantities: [500, 1000, 2500],
    turnaround: '4-6 days',
    description: 'Official company letterhead for professional documentation.',
    sku: 'ADM-LET-8511-500',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.25
  },

  {
    id: 'ncr-form-2part-100',
    category: 'Business Forms',
    name: '8.5x11 NCR Carbonless Forms (2-Part)',
    zoo_price: 42.00,
    our_price: 71.40,
    sizes: ['8.5" x 11"'],
    paper_stock: ['2-Part Carbonless (White/Canary)'],
    quantities: [100, 250, 500],
    turnaround: '5-7 days',
    description: 'Duplicate forms for onsite artist bookings and sales receipts.',
    sku: 'BUS-NCR-2PT-8511',
    requires_high_res: false,
    bleed_margin: 0.125,
    safe_zone: 0.25
  },

  // PHYSICAL MEDIA (For Music/Artists)
  {
    id: 'cd-inlay-perforated-100',
    category: 'Physical Media',
    name: 'CD Inlay w/ Perforated Spine (100)',
    zoo_price: 32.00,
    our_price: 54.40,
    sizes: ['Standard Jewel Case'],
    paper_stock: ['100lb Gloss Text', '70lb Premium Uncoated'],
    quantities: [100, 250, 500],
    turnaround: '3-5 days',
    description: 'Rear tray card with perforated spines for physical CD releases.',
    sku: 'MED-CDI-PER-100',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.125
  },
  {
    id: 'vinyl-jacket-12-100',
    category: 'Physical Media',
    name: '12" Vinyl Record Jackets (100)',
    zoo_price: 145.00,
    our_price: 246.50,
    sizes: ['12.25" x 12.25"'],
    paper_stock: ['20pt Premium Board'],
    quantities: [100, 250, 500],
    turnaround: '10-14 days',
    description: 'Full color vinyl outer jackets with spine printing.',
    sku: 'MED-VIN-JKT-12',
    requires_high_res: true,
    bleed_margin: 0.125,
    safe_zone: 0.25
  }
];
