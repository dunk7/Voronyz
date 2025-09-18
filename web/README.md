This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Netlify

This project is configured for Netlify deployment. The `netlify.toml` file in the repository root tells Netlify to build from the `web/` folder.

### Environment Variables (Optional for Testing)

For **production deployment**, set these environment variables in your Netlify dashboard:

- `DATABASE_URL`: PostgreSQL connection string (required for production)
- `STRIPE_SECRET_KEY`: Your Stripe secret key for payments
- `AUTH_STUB_ENABLED`: Set to "false" to disable demo auth (enabled by default)

### Testing Without Environment Variables

For **testing/demo purposes**, you can deploy without any environment variables:
- ✅ Authentication works with demo mode (enabled by default)
- ✅ Sample products are included
- ✅ Cart functionality works with localStorage persistence
- ✅ Checkout redirects to success page
- ✅ All core features work client-side

### Database Setup

This project uses PostgreSQL. For Netlify deployment:

1. Use a cloud PostgreSQL service like Supabase, Neon, or Railway
2. Set the `DATABASE_URL` environment variable
3. Run `npx prisma migrate deploy` to apply migrations (can be done in build command if needed)

### Build Settings

The `netlify.toml` file in the repository root configures the build settings automatically:
- **Base directory**: `web/` (where the Next.js app is located)
- **Build command**: `npm run build`
- **Publish directory**: `.next`
