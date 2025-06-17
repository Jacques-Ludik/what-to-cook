import { create } from "domain";
import { link } from "fs";
import { Arapey } from "next/font/google";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const recipeRouter = createTRPCRouter({

    createIngredients: publicProcedure
    .input(z.object({ name: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.ingredient.createMany({
            data: input.name.map((name) => ({ name })),
        });
        }),      

    createDietTypes: publicProcedure
    .input(z.object({ name: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.dietType.createMany({
            data: input.name.map((name) => ({ name })),
        });
    }),

    createAllergens: publicProcedure
    .input(z.object({ name: z.string().array() }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.allergens.createMany({
            data: input.name.map((name) => ({ name })),
        });
    }),

    createRecipes: publicProcedure
    .input(z.object({
        title: z.string(),
        imageUrl: z.string(),
        link: z.string(),
        category: z.string(),
        area: z.string(),
        ingredients: z.number().array(),
        dietType: z.number(),
        allergens: z.number().array(),
        instructions: z.string(),
        estimatedTime: z.number(),
        measures: z.string().array(),
        protein: z.number(),
        calorie: z.number(),
    })).mutation(async ({ ctx, input }) => {
        return ctx.db.recipe.create({
            data: {
                title: input.title,
                imageUrl: input.imageUrl,
                link: input.link,
                category: input.category,
                area: input.area,
                ingredients: {
                    connect: input.ingredients.map((id) => ({ id })),
                },
                // RecipeIngredient: {
                //     create: input.ingredients.map((ingredientId, index) => ({
                //         ingredientId,
                //         measure: input.measures[index],
                //     })),
                // },
                dietType: {
                    connect: { id: input.dietType },
                },
                allergens: {
                    connect: input.allergens.map((id) => ({ id })),
                },
                instructions: input.instructions,
                estimatedTime: input.estimatedTime,
                protein: input.protein,
                calorie: input.calorie,
            },
        });
    }),


    //get ingredients
    getIngredients: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.ingredient.findMany({
            orderBy: { id: "asc" },
        });
    }),
    //get diet types
    getDietTypes: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.dietType.findMany({
            orderBy: { id: "asc" },
        });
    }),
    //get allergens
    getAllergens: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.allergens.findMany({
            orderBy: { id: "asc" },
        });
    }),
    // getRecipes: publicProcedure.query(async ({ ctx }) => {
//     return ctx.db.recipe.findMany({
//       include: {
//         ingredients: true,
//         dietType: true,
//         allergens: true,
//         RecipeIngredient: true,
//       },
//       orderBy: { title: "asc" },
//     });
//   }),
//   getRecipeById: publicProcedure
//     .input(z.object({ id: z.number() }))
//     .query(async ({ ctx, input }) => {
//       return ctx.db.recipe.findUnique({
//         where: { id: input.id },
//         include: {
//           ingredients: true,
//           dietType: true,
//           allergens: true,
//           RecipeIngredient: true,
//         },
//       });
//     }),

    





//   hello: publicProcedure
//     .input(z.object({ text: z.string() }))
//     .query(({ input }) => {
//       return {
//         greeting: `Hello ${input.text}`,
//       };
//     }),

//   create: protectedProcedure
//     .input(z.object({ name: z.string().min(1) }))
//     .mutation(async ({ ctx, input }) => {
//       return ctx.db.post.create({
//         data: {
//           name: input.name,
//           createdBy: { connect: { id: ctx.session.user.id } },
//         },
//       });
//     }),

//   getLatest: protectedProcedure.query(async ({ ctx }) => {
//     const post = await ctx.db.post.findFirst({
//       orderBy: { createdAt: "desc" },
//       where: { createdBy: { id: ctx.session.user.id } },
//     });

//     return post ?? null;
//   }),

//   getSecretMessage: protectedProcedure.query(() => {
//     return "you can now see this secret message!";
//   }),
});