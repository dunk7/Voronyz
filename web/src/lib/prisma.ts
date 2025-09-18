import { PrismaClient } from "@prisma/client";

type MockPrismaClient = {
  user: {
    findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  cart: {
    findUnique: (args: { where: { id: string }; include?: { items?: boolean } }) => Promise<Record<string, unknown> | null>;
    upsert: (args: { where: { id: string }; update?: Record<string, unknown>; create?: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  cartItem: {
    upsert: (args: { where: { cartId_variantId: { cartId: string; variantId: string } }; update?: Record<string, unknown>; create?: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    delete: (args: { where: { id: string } }) => Promise<{ id: string }>;
  };
  variant: {
    findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
  };
  product: {
    findMany: () => Promise<Record<string, unknown>[]>;
    findUnique: (args: { where: { slug?: string; id?: string } }) => Promise<Record<string, unknown> | null>;
  };
};

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// For testing/demo without DATABASE_URL, use a mock client
export const prisma = process.env.DATABASE_URL
  ? (globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    }))
  : createMockPrismaClient() as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Simple mock for testing without database
function createMockPrismaClient() {
  console.log("⚠️  Using mock database for testing - no DATABASE_URL provided");

  const mockData = {
    users: new Map<string, Record<string, unknown>>(),
    carts: new Map<string, Record<string, unknown>>(),
    cartItems: new Map<string, Record<string, unknown>>(),
    products: new Map<string, Record<string, unknown>>(),
    variants: new Map<string, Record<string, unknown>>(),
  };

  // Create some mock data
  const mockUser = {
    id: "demo-user",
    email: "demo@example.com",
    name: "Demo User",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockData.users.set("demo-user", mockUser);

  const mockProduct = {
    id: "demo-product",
    slug: "v3-slides",
    name: "Voronyz V3 Slides",
    description: "Custom 3D printed slides",
    priceCents: 29900,
    currency: "usd",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockData.products.set("demo-product", mockProduct);

  const mockVariant = {
    id: "demo-variant",
    productId: "demo-product",
    name: "Default",
    sku: "V3-DEFAULT",
    priceCents: 29900,
    attributes: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockData.variants.set("demo-variant", mockVariant);

  return {
    user: {
      findUnique: ({ where }: { where: { id: string } }) => Promise.resolve(mockData.users.get(where.id) || null),
      create: ({ data }: { data: Record<string, unknown> }) => {
        const user = { ...data, id: `user-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
        mockData.users.set(user.id as string, user);
        return Promise.resolve(user);
      },
    },
    cart: {
      findUnique: ({ where, include }: { where: { id: string }; include?: { items?: boolean } }) => {
        const cart = mockData.carts.get(where.id);
        if (!cart) return Promise.resolve(null);
        if (include?.items) {
          cart.items = Array.from(mockData.cartItems.values()).filter(item => (item as Record<string, unknown>).cartId === cart.id);
        }
        return Promise.resolve(cart);
      },
      upsert: ({ where, update, create }: { where: { id: string }; update?: Record<string, unknown>; create?: Record<string, unknown> }) => {
        let cart = mockData.carts.get(where.id);
        if (cart) {
          cart = { ...cart, ...update, updatedAt: new Date() };
        } else {
          cart = { ...create, id: `cart-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
        }
        mockData.carts.set(cart.id as string, cart);
        return Promise.resolve(cart);
      },
      create: ({ data }: { data: Record<string, unknown> }) => {
        const cart = { ...data, id: `cart-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
        mockData.carts.set(cart.id as string, cart);
        return Promise.resolve(cart);
      },
    },
    cartItem: {
      upsert: ({ where, update, create }: { where: { cartId_variantId: { cartId: string; variantId: string } }; update?: Record<string, unknown>; create?: Record<string, unknown> }) => {
        const key = `${where.cartId_variantId.cartId}_${where.cartId_variantId.variantId}`;
        let item = mockData.cartItems.get(key);
        if (item) {
          item = { ...item, ...update, updatedAt: new Date() };
        } else {
          item = { ...create, id: `item-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
        }
        mockData.cartItems.set(key as string, item);
        return Promise.resolve(item);
      },
      delete: ({ where }: { where: { id: string } }) => {
        const items = Array.from(mockData.cartItems.entries());
        const entry = items.find(([, item]) => (item as Record<string, unknown>).id === where.id);
        if (entry) {
          mockData.cartItems.delete(entry[0]);
        }
        return Promise.resolve({ id: where.id });
      },
    },
    variant: {
      findUnique: ({ where }: { where: { id: string } }) => Promise.resolve(mockData.variants.get(where.id) || null),
    },
    product: {
      findMany: () => Promise.resolve(Array.from(mockData.products.values())),
      findUnique: ({ where }: { where: { slug?: string; id?: string } }) => Promise.resolve(mockData.products.get(where.slug || where.id || '') || null),
    },
  } as MockPrismaClient;
}
