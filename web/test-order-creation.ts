/**
 * Test script to verify order creation in the database
 * Run with: npx tsx test-order-creation.ts
 * 
 * This script tests:
 * 1. Database connection
 * 2. Order creation via Prisma
 * 3. Order retrieval
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function testOrderCreation() {
  console.log("🧪 Testing order creation in database...\n");

  try {
    // Test 1: Database connection
    console.log("1️⃣ Testing database connection...");
    try {
      await prisma.$connect();
      console.log("✅ Database connection successful\n");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }

    // Test 2: Create a test order
    console.log("2️⃣ Creating test order...");
    const testStripeId = `test_session_${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        stripeId: testStripeId,
        status: "paid",
        currency: "usd",
        subtotalCents: 7500,
        totalCents: 7500,
        metadata: {
          lineItems: [
            {
              name: "Test Product",
              amount: 7500,
              quantity: 1,
            },
          ],
          customerEmail: "test@example.com",
        },
      },
    });
    console.log(`✅ Test order created: ${testOrder.id}`);
    console.log(`   Stripe ID: ${testOrder.stripeId}`);
    console.log(`   Status: ${testOrder.status}`);
    console.log(`   Total: $${(testOrder.totalCents / 100).toFixed(2)}\n`);

    // Test 3: Retrieve the order
    console.log("3️⃣ Retrieving test order...");
    const retrievedOrder = await prisma.order.findUnique({
      where: { stripeId: testStripeId },
    });

    if (retrievedOrder) {
      console.log(`✅ Order retrieved successfully: ${retrievedOrder.id}`);
      console.log(`   Metadata:`, JSON.stringify(retrievedOrder.metadata, null, 2));
    } else {
      throw new Error("Failed to retrieve order");
    }

    // Test 4: Update the order
    console.log("\n4️⃣ Updating test order...");
    const updatedOrder = await prisma.order.update({
      where: { id: testOrder.id },
      data: {
        status: "completed",
        metadata: {
          ...(testOrder.metadata as object),
          updatedAt: new Date().toISOString(),
        },
      },
    });
    console.log(`✅ Order updated: ${updatedOrder.status}\n`);

    // Test 5: Upsert (create or update)
    console.log("5️⃣ Testing upsert operation...");
    const upsertedOrder = await prisma.order.upsert({
      where: { stripeId: testStripeId },
      update: {
        status: "completed",
      },
      create: {
        stripeId: testStripeId,
        status: "paid",
        currency: "usd",
        subtotalCents: 7500,
        totalCents: 7500,
        metadata: {},
      },
    });
    console.log(`✅ Upsert successful: ${upsertedOrder.id} (status: ${upsertedOrder.status})\n`);

    // Test 6: Clean up - delete test order
    console.log("6️⃣ Cleaning up test order...");
    await prisma.order.delete({
      where: { id: testOrder.id },
    });
    console.log("✅ Test order deleted\n");

    console.log("🎉 All tests passed! Order creation is working correctly.");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOrderCreation()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

