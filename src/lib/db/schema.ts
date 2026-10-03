import {
  pgTable, serial, integer, bigint, text, boolean, timestamp, jsonb, smallint, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

// Все таблицы с префиксом brew_: база общая с superbot, конфликтов нет.

export const users = pgTable('brew_users', {
  id: serial('id').primaryKey(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull().unique(),
  firstName: text('first_name').notNull().default(''),
  lastName: text('last_name'),
  username: text('username'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable('brew_products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  // Пока только 'coffee'; 'tea' — следующий этап.
  type: text('type').notNull().default('coffee'),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  origin: text('origin').notNull().default(''),
  process: text('process').notNull().default(''),
  variety: text('variety').notNull().default(''),
  roastLevel: text('roast_level').notNull().default(''),
  flavorNotes: text('flavor_notes').array().notNull().default([]),
  imageUrl: text('image_url'),
  // Задел под QR / код с пачки. В MVP не используется.
  code: text('code').unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recipes = pgTable('brew_recipes', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  method: text('method').notNull(), // v60 | kalita | french_press | aeropress | espresso | ...
  title: text('title').notNull(),
  doseG: integer('dose_g').notNull(),
  waterG: integer('water_g').notNull(),
  tempC: integer('temp_c').notNull(),
  grind: text('grind').notNull().default(''),
  note: text('note').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
}, (t) => [index('brew_recipes_product_idx').on(t.productId)]);

export const recipeSteps = pgTable('brew_recipe_steps', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  kind: text('kind').notNull(), // pour | wait | stir | press
  // Сколько воды должно быть в сумме к концу этапа (для pour).
  targetWaterG: integer('target_water_g'),
  durationS: integer('duration_s').notNull(),
  label: text('label').notNull(),
  hint: text('hint').notNull().default(''),
}, (t) => [uniqueIndex('brew_recipe_steps_pos_idx').on(t.recipeId, t.position)]);

export const brews = pgTable('brew_brews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  // Снимок рецепта на момент заварки: правка рецепта не меняет историю.
  params: jsonb('params').notNull(),
  actualTimeS: integer('actual_time_s'),
  rating: smallint('rating'),
  taste: text('taste').array().notNull().default([]),
  note: text('note').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('brew_brews_user_idx').on(t.userId, t.createdAt)]);
