import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postSchema = z.object({
	title: z.string(),
	published: z.coerce.date(),
	updated: z.coerce.date().optional(),
	draft: z.boolean().optional().default(false),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),
	lang: z.string().optional().default(""),
	expired: z.boolean().optional().default(false),

	/* For internal use */
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});

const postsCollection = defineCollection({
	loader: glob({
		base: "./src/content/posts",
		pattern: "**/*.{md,mdx}",
	}),
	schema: postSchema,
});

const specCollection = defineCollection({
	loader: glob({
		base: "./src/content/spec",
		pattern: "**/*.{md,mdx}",
	}),
});
export const collections = {
	posts: postsCollection,
	spec: specCollection,
};
