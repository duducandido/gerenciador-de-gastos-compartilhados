import { pgTable, text, timestamp, boolean, numeric, unique, serial, integer } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  accentColor: text('accentColor').notNull().default('#c8f169'),
  theme: text('theme').notNull().default('light'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Add your app tables below. Always include a plain `userId` column so queries
// can be scoped per user — the security model depends on this column existing,
// not on a foreign key. Do NOT add a foreign key constraint
// (`.references(() => user.id, ...)`) unless the user explicitly asks for
// foreign keys or referential integrity; FK constraints make iterating on the
// schema harder.
//
// Example:
//
// import { serial } from "drizzle-orm/pg-core"
//
// export const todos = pgTable("todos", {
//   id: serial("id").primaryKey(),
//   userId: text("userId").notNull(),
//   title: text("title").notNull(),
//   completed: boolean("completed").notNull().default(false),
//   createdAt: timestamp("createdAt").notNull().defaultNow(),
// })
//
// If the user asks for foreign keys, add the reference back in:
//   userId: text("userId")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),

export const household = pgTable('household', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('inviteCode').notNull().unique(),
  createdBy: text('createdBy').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const savingsGoal = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  targetAmount: integer('targetAmount').notNull().default(0),
  installmentAmount: integer('installmentAmount').notNull().default(0),
  savedAmount: integer('savedAmount').notNull().default(0),
  dueDay: integer('dueDay').notNull().default(1),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const householdMember = pgTable('household_member', {
  id: text('id').primaryKey(),
  householdId: text('householdId').notNull(),
  userId: text('userId').notNull(),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => ({ membership: unique().on(table.householdId, table.userId) }))

export const expense = pgTable('expense', {
  id: text('id').primaryKey(),
  householdId: text('householdId').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  spentAt: timestamp('spentAt').notNull().defaultNow(),
  createdBy: text('createdBy').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const payableBill = pgTable('payable_bill', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  person: text('person').notNull(),
  title: text('title').notNull(),
  totalAmount: integer('totalAmount').notNull(),
  installmentAmount: integer('installmentAmount').notNull(),
  totalInstallments: integer('totalInstallments').notNull().default(1),
  paidInstallments: integer('paidInstallments').notNull().default(0),
  dueDay: integer('dueDay').notNull().default(1),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const goal = pgTable('goal', {
  id: text('id').primaryKey(),
  householdId: text('householdId').notNull(),
  label: text('label').notNull(),
  savedAmount: numeric('savedAmount', { precision: 12, scale: 2 }).notNull().default('0'),
  targetAmount: numeric('targetAmount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
