CREATE TABLE "bulk_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"platform" varchar(20) DEFAULT 'generic' NOT NULL,
	"tone" varchar(20) DEFAULT 'professional' NOT NULL,
	"include_competitor" boolean DEFAULT false NOT NULL,
	"product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_products" integer DEFAULT 0 NOT NULL,
	"completed_products" integer DEFAULT 0 NOT NULL,
	"failed_products" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"job_id" uuid,
	"platform" varchar(20) DEFAULT 'generic' NOT NULL,
	"tone" varchar(20) DEFAULT 'professional' NOT NULL,
	"product_brief" jsonb,
	"seo_strategy" jsonb,
	"competitor_analysis" jsonb,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"cost_estimate" numeric(10, 6) DEFAULT 0 NOT NULL,
	"processing_time_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" varchar(20) DEFAULT 'manual' NOT NULL,
	"external_id" varchar(255),
	"name" varchar(500) NOT NULL,
	"category" varchar(255),
	"subcategory" varchar(255),
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brand" varchar(255),
	"target_audience" text,
	"raw_data" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"name" varchar(255) NOT NULL,
	"image" text,
	"google_id" varchar(255),
	"brand_name" varchar(255),
	"default_tone" varchar(20) DEFAULT 'professional' NOT NULL,
	"custom_tone_instructions" text,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"monthly_generations" integer DEFAULT 0 NOT NULL,
	"generation_limit" integer DEFAULT 5 NOT NULL,
	"usage_reset_date" timestamp with time zone DEFAULT now() NOT NULL,
	"shopify_domain" varchar(255),
	"shopify_access_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bulk_jobs" ADD CONSTRAINT "bulk_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_job_id_bulk_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."bulk_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bulk_jobs_user_id_idx" ON "bulk_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bulk_jobs_user_status_idx" ON "bulk_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "generations_user_id_idx" ON "generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generations_product_id_idx" ON "generations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "generations_job_id_idx" ON "generations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "generations_product_created_idx" ON "generations" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "products_user_id_idx" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "products_user_source_idx" ON "products" USING btree ("user_id","source");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_stripe_customer_id_idx" ON "users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");