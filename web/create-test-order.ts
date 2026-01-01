/**
 * Creates a test order in the database to verify connection
 * Run with: npx tsx create-test-order.ts
 * 
 * Make sure DATABASE_URL is set in your environment or .env.local file
 * 
 * For Supabase with Next.js API routes (recommended):
 * - Use TRANSACTION mode connection pooling (port 6543)
 * - Format: postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
 * 
 * Direct connection (port 5432) works but has limitations:
 * - Limited concurrent connections
 * - May hit connection limits in production
 * - Requires IP whitelisting
 */

import { prisma } from "./src/lib/prisma";

async function createTestOrder() {
  console.log("Creating test order in database...\n");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set!");
    console.error("Please set it in your environment or create a .env.local file with:");
    console.error('DATABASE_URL="postgresql://user:password@host:port/database"');
    console.error("\nFor Supabase, get your connection string from:");
    console.error("Project Settings > Database > Connection string (use Transaction mode for pooling)");
    process.exit(1);
  }

  console.log(`Connecting to database...`);
  console.log(`Database host: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'hidden'}\n`);

  try {
    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `VOR-${dateStr}-${randomStr}`;

    const testOrder = await prisma.order.create({
      data: {
        stripeId: `test_order_${Date.now()}`,
        status: "paid",
        currency: "usd",
        subtotalCents: 7500,
        totalCents: 7500,
        metadata: {
          orderNumber,
          lineItems: [
            {
              name: "Voronyz V3 Slides",
              productName: "Voronyz V3 Slides",
              variantId: "test-variant-id",
              variantName: "Black",
              baseColor: "black",
              secondaryColor: "white",
              size: "10",
              gender: "men",
              quantity: 1,
              amount: 7500,
            },
          ],
          customer: {
            name: "Test Customer",
            email: "test@example.com",
            phone: "+1234567890",
          },
          shipping: {
            name: "Test Customer",
            address: {
              line1: "123 Test Street",
              line2: null,
              city: "San Francisco",
              state: "CA",
              postal_code: "94102",
              country: "US",
            },
          },
          paymentStatus: "paid",
          createdAt: new Date().toISOString(),
        },
      },
    });

    const metadata = testOrder.metadata && typeof testOrder.metadata === 'object' 
      ? testOrder.metadata as Record<string, unknown>
      : {};
    
    console.log("✅ Test order created successfully!");
    console.log(`\nOrder Details:`);
    console.log(`  Order Number: ${metadata.orderNumber || 'N/A'}`);
    console.log(`  ID: ${testOrder.id}`);
    console.log(`  Stripe ID: ${testOrder.stripeId}`);
    console.log(`  Status: ${testOrder.status}`);
    console.log(`  Total: $${(testOrder.totalCents / 100).toFixed(2)}`);
    console.log(`  Created: ${testOrder.createdAt}`);
    
    if (metadata.customer && typeof metadata.customer === 'object') {
      const customer = metadata.customer as Record<string, unknown>;
      console.log(`\nCustomer:`);
      console.log(`  Name: ${customer.name || 'N/A'}`);
      console.log(`  Email: ${customer.email || 'N/A'}`);
      console.log(`  Phone: ${customer.phone || 'N/A'}`);
    }
    
    if (metadata.shipping && typeof metadata.shipping === 'object') {
      const shipping = metadata.shipping as Record<string, unknown>;
      console.log(`\nShipping Address:`);
      if (shipping.address && typeof shipping.address === 'object') {
        const addr = shipping.address as Record<string, unknown>;
        console.log(`  ${shipping.name || ''}`);
        console.log(`  ${addr.line1 || ''}`);
        if (addr.line2) console.log(`  ${addr.line2}`);
        console.log(`  ${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}`);
        console.log(`  ${addr.country || ''}`);
      }
    }
    
    if (Array.isArray(metadata.lineItems)) {
      console.log(`\nItems:`);
      metadata.lineItems.forEach((item: unknown, index: number) => {
        if (item && typeof item === 'object') {
          const it = item as Record<string, unknown>;
          console.log(`  ${index + 1}. ${it.name || 'Unknown'}`);
          if (it.baseColor) console.log(`     Base Color: ${it.baseColor}`);
          if (it.secondaryColor) console.log(`     Secondary Color: ${it.secondaryColor}`);
          if (it.size) console.log(`     Size: ${it.size}`);
          if (it.gender) console.log(`     Gender: ${it.gender}`);
          console.log(`     Quantity: ${it.quantity || 1}`);
          console.log(`     Amount: $${((it.amount as number || 0) / 100).toFixed(2)}`);
        }
      });
    }
    
    console.log(`\nYou can now check your Supabase database to see this order.`);
    console.log(`Look for an order with stripeId: ${testOrder.stripeId}`);
    console.log(`Or order number: ${metadata.orderNumber || 'N/A'}\n`);
  } catch (error) {
    console.error("❌ Failed to create test order\n");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      
      if (error.message.includes("Can't reach database server")) {
        console.error("\n⚠️  Database connection failed. Common issues:");
        console.error("1. Check if your Supabase database is running");
        console.error("2. Verify your DATABASE_URL connection string is correct");
        console.error("3. For production (Netlify/Vercel), use TRANSACTION pooling (port 6543)");
        console.error("4. Direct connection (port 5432) may require IP whitelisting");
        console.error("\n📝 Supabase connection string formats:");
        console.error("\n✅ RECOMMENDED for production (Transaction Pooling):");
        console.error('   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true');
        console.error('   - Better for serverless/API routes');
        console.error('   - No IP whitelisting needed');
        console.error('   - Handles high concurrency');
        console.error("\n⚠️  Direct connection (for local/testing only):");
        console.error('   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres');
        console.error('   - Requires IP whitelisting');
        console.error('   - Limited concurrent connections');
        console.error('\n💡 Get your connection string from:');
        console.error('   Supabase Dashboard > Project Settings > Database > Connection string');
        console.error('   Select "Transaction" mode for pooling');
      } else if (error.message.includes("P1001")) {
        console.error("\n⚠️  Cannot reach database server. Check your network connection.");
      } else if (error.message.includes("P1000")) {
        console.error("\n⚠️  Authentication failed. Check your database credentials.");
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();

