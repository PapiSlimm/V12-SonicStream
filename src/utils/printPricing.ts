import { PrintProduct } from '../types/printing';

export interface PrintOrderLineItem {
  id?: number;
  product: PrintProduct;
  options: { size: string; paper_stock: string; quantity: number };
}

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  weight: number; // Total lbs from cart
  orderValue: number;
}

export const calculatePrintOrderTotal = (cart: PrintOrderLineItem[], address: ShippingAddress) => {
  // 1. SUBTOTAL (our 70% markup prices)
  const subtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.our_price;
    // Assuming our_price is already for the selected quantity in this simplified model
    // In a more complex model, we'd calculate based on base price + qty tiers
    return sum + basePrice;
  }, 0);

  // 2. TAX (state-specific rates)
  const taxRate = getTaxRate(address.zip);
  const tax = subtotal * taxRate;

  // 3. SHIPPING (weight + zone based)
  const shipping = calculateShipping(address);

  // 4. GRAND TOTAL
  const grandTotal = subtotal + tax + shipping;

  // 5. PROFIT TRACKING (for you)
  const zooCost = cart.reduce((sum, item) => {
    const zooPrice = item.product.zoo_price || (item.product.our_price / 1.7);
    return sum + zooPrice;
  }, 0);

  const profit = subtotal - zooCost;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    taxRate: taxRate * 100,
    shipping: Number(shipping.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    zooCost: Number(zooCost.toFixed(2)),
    estimatedProfit: Number(profit.toFixed(2)),
    profitMargin: Number(((profit / subtotal) * 100).toFixed(1))
  };
};

// US State Tax Rates (2026)
const getTaxRate = (zip: string): number => {
  const stateByZip = {
    '90': 0.0825, // CA
    '32': 0.0625, // NY  
    '60': 0.09,   // IL
    '75': 0.0825, // TX
    '19': 0.06,   // FL
  };

  const statePrefix = zip.slice(0, 2);
  return stateByZip[statePrefix as keyof typeof stateByZip] || 0.07; // Default 7%
};

// Shipping calculator (Zone-based like ZooPrinting)
const calculateShipping = (address: ShippingAddress): number => {
  const { weight, orderValue, zip } = address;
  
  // Free shipping over $99
  if (orderValue > 99) return 0;
  
  const zone = getShippingZone(zip);
  const baseRate = zone * 8.95; // Per lb
  
  // Weight tiers
  if (weight <= 1) return baseRate;
  if (weight <= 5) return baseRate * 1.8;
  if (weight <= 15) return baseRate * 2.5;
  return baseRate * 3.2;
};

const getShippingZone = (zip: string): number => {
  const zoneMap = {
    '9': 3,  // West Coast
    '3': 2,  // East Coast  
    '6': 2,  // Midwest
    '7': 3,  // South
  };
  return zoneMap[zip[0] as keyof typeof zoneMap] || 2;
};
