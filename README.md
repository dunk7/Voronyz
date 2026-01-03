# Voronyz

This is the Voronyz Engineering website built with Next.js.

## Project Structure

- `web/` - The main Next.js application
- `netlify.toml` - Netlify deployment configuration

## Quick Start

You can deploy this app to Netlify **without any environment variables** for testing:

1. Push this code to GitHub
2. Connect your repository to Netlify
3. Deploy - it will work out of the box with demo data!

The app uses static export, so all features work client-side with localStorage for cart persistence.

## Deployment

This project is configured for deployment on Netlify. The Next.js app is located in the `web/` folder, and the `netlify.toml` file in the root configures Netlify to build from that directory.

See `web/README.md` for detailed setup and deployment instructions.

### Production database note (poolers)

If you use a Postgres pooler/pgBouncer URL for `DATABASE_URL` (common on Supabase), also set `DIRECT_DATABASE_URL` to a **direct (non-pooler)** connection string so Prisma migrations can run reliably.
