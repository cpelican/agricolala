

Node.js: v18 or later (recommended: latest LTS)
npm: v9+ (or use yarn/pnpm if preferred)
[Optional] PostgreSQL/MySQL: If using Prisma with a database, ensure your DB is running and accessible.


# Example for NextAuth/Prisma
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NEXTAUTH_SECRET=your-secret
# Add other required variables as needed


npx prisma migrate dev

If you need seed data, add a prisma/seed.ts and run npx prisma db seed.

5. Run the Development Server
Apply
dev
The app will be available at http://localhost:3000.

6. Linting & Formatting
Apply
lint
Add Prettier or other formatting tools if needed.