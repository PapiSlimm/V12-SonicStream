import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { PrintOrderLineItem } from '../../utils/printPricing';

// Register standard fonts or use a CDN for Roboto
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

interface PrintInvoiceProps {
  order: {
    id: string;
    date: Date;
    customer: { name: string; email: string; address: string };
    cart: PrintOrderLineItem[];
    totals: {
      subtotal: number;
      tax: number;
      taxRate: number;
      shipping: number;
      grandTotal: number;
      zooCost: number;
      estimatedProfit: number;
    };
    paymentIntentId: string;
  };
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Roboto',
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#c81e3a',
    paddingBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#4b5563',
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: '#c81e3a',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 500,
    color: '#6b7280',
  },
  customerInfo: {
    marginBottom: 30,
    marginTop: 20,
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 10,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 700,
    fontSize: 10,
    color: '#c81e3a',
  },
  tableCell: {
    fontSize: 9,
    paddingRight: 8,
    flex: 1,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 11,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#c81e3a',
    backgroundColor: '#f0fdf4',
    marginTop: 10,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 700,
    color: '#c81e3a',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 30,
    fontSize: 9,
    color: '#9ca3af',
    lineHeight: 1.4,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  badge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '4 12',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    alignSelf: 'flex-start',
    marginTop: 10,
  }
});

export const PrintInvoicePDF = ({ order }: PrintInvoiceProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: 700, color: '#c81e3a', marginBottom: 4 }}>
            SonicStream Printing
          </Text>
          <View style={styles.companyInfo}>
            <Text>123 Music Lane</Text>
            <Text>Macon, MS 39341</Text>
            <Text>hello@sonicstream.com</Text>
            <Text>(555) 123-4567</Text>
          </View>
        </View>
        
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <View style={styles.invoiceNumber}>
            <Text>#{order.id.slice(-8).toUpperCase()}</Text>
            <Text>{format(order.date, 'MMM dd, yyyy')}</Text>
          </View>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#374151' }}>
          Bill To:
        </Text>
        <Text style={{ fontSize: 11, marginBottom: 2 }}>{order.customer.name}</Text>
        <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>{order.customer.address}</Text>
        <Text style={{ fontSize: 10, color: '#6b7280' }}>{order.customer.email}</Text>
        
        <View style={styles.badge}>
          <Text>PAID IN FULL</Text>
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.table}>
        {/* Headers */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
          <Text style={styles.tableCell}>Qty</Text>
          <Text style={styles.tableCell}>Unit Price</Text>
          <Text style={styles.tableCell}>Total</Text>
        </View>

        {/* Items */}
        {order.cart.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={{ fontWeight: 500 }}>{item.product.name}</Text>
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                {item.options.paper_stock} • {item.options.size}
              </Text>
            </View>
            <Text style={styles.tableCell}>{item.options.quantity}</Text>
            <Text style={styles.tableCell}>
              ${item.product.our_price.toFixed(2)}
            </Text>
            <Text style={styles.tableCell}>
              ${item.product.our_price.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={{ width: '40%', marginLeft: 'auto' }}>
        <View style={styles.totalsRow}>
          <Text style={{ color: '#6b7280' }}>Subtotal</Text>
          <Text>${order.totals.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={{ color: '#6b7280' }}>Sales Tax ({order.totals.taxRate.toFixed(1)}%)</Text>
          <Text>${order.totals.tax.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={{ color: '#6b7280' }}>Shipping</Text>
          <Text style={{ color: order.totals.shipping === 0 ? '#c81e3a' : '#1a1a1a', fontWeight: order.totals.shipping === 0 ? 700 : 400 }}>
            {order.totals.shipping === 0 ? 'FREE' : `$${order.totals.shipping.toFixed(2)}`}
          </Text>
        </View>
        <View style={[styles.totalsRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotal}>TOTAL</Text>
          <Text style={styles.grandTotal}>${order.totals.grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment Details */}
      <View style={{ marginTop: 40, padding: 12, backgroundColor: '#f9fafb', borderRadius: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: '#374151' }}>Payment Information</Text>
        <Text style={{ fontSize: 9, color: '#6b7280' }}>Transaction ID: {order.paymentIntentId}</Text>
        <Text style={{ fontSize: 9, color: '#6b7280' }}>Method: Credit Card (Stripe)</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for choosing SonicStream Printing Services!</Text>
        <Text style={{ marginTop: 4 }}>
          Premium quality guaranteed • Fast turnaround • Professional results
        </Text>
        <Text style={{ marginTop: 8, fontSize: 8 }}>
          Questions? hello@sonicstream.com • (555) 123-4567
        </Text>
      </View>
    </Page>
  </Document>
);
