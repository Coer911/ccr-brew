CREATE TABLE "brew_brews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer,
	"recipe_id" integer,
	"params" jsonb NOT NULL,
	"actual_time_s" integer,
	"rating" smallint,
	"taste" text[] DEFAULT '{}' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brew_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"type" text DEFAULT 'coffee' NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"origin" text DEFAULT '' NOT NULL,
	"process" text DEFAULT '' NOT NULL,
	"variety" text DEFAULT '' NOT NULL,
	"roast_level" text DEFAULT '' NOT NULL,
	"flavor_notes" text[] DEFAULT '{}' NOT NULL,
	"image_url" text,
	"code" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brew_products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "brew_products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "brew_recipe_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"target_water_g" integer,
	"duration_s" integer NOT NULL,
	"label" text NOT NULL,
	"hint" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brew_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"method" text NOT NULL,
	"title" text NOT NULL,
	"dose_g" integer NOT NULL,
	"water_g" integer NOT NULL,
	"temp_c" integer NOT NULL,
	"grind" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brew_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text,
	"username" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brew_users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "brew_brews" ADD CONSTRAINT "brew_brews_user_id_brew_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."brew_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_brews" ADD CONSTRAINT "brew_brews_product_id_brew_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."brew_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_brews" ADD CONSTRAINT "brew_brews_recipe_id_brew_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."brew_recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_recipe_steps" ADD CONSTRAINT "brew_recipe_steps_recipe_id_brew_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."brew_recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brew_recipes" ADD CONSTRAINT "brew_recipes_product_id_brew_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."brew_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brew_brews_user_idx" ON "brew_brews" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "brew_recipe_steps_pos_idx" ON "brew_recipe_steps" USING btree ("recipe_id","position");--> statement-breakpoint
CREATE INDEX "brew_recipes_product_idx" ON "brew_recipes" USING btree ("product_id");