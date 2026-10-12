import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "Phones & Tablets", slug: "phones-tablets", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" },
  { name: "Laptops & Computers", slug: "laptops-computers", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80" },
  { name: "Audio & Headphones", slug: "audio-headphones", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80" },
  { name: "Wearables", slug: "wearables", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80" },
  { name: "TV & Home Theater", slug: "tv-home-theater", imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80" },
  { name: "Fashion & Footwear", slug: "fashion-footwear", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" },
  { name: "Beauty & Personal Care", slug: "beauty-personal-care", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80" },
  { name: "Home Appliances", slug: "home-appliances", imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=300&q=80" },
  { name: "Furniture", slug: "furniture", imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80" },
  { name: "Gaming", slug: "gaming", imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80" }
];

const products = [
  { name:"iPhone 16 Pro", slug:"iphone-16-pro", price:129999, imageUrl:"https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=700&q=85", rating:4.8, reviewCount:124, stock:20, badge:"Best Seller", featured:true, categorySlug:"phones-tablets", description:"A premium smartphone with a vivid display and advanced camera system." },
  { name:"HP Pavilion Laptop", slug:"hp-pavilion-laptop", price:89999, imageUrl:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=85", rating:4.6, reviewCount:98, stock:14, badge:"New", featured:true, categorySlug:"laptops-computers", description:"A versatile laptop for work, study, and entertainment." },
  { name:"JBL Tune 720BT Headphones", slug:"jbl-tune-720bt-headphones", price:14999, imageUrl:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85", rating:4.7, reviewCount:76, stock:30, badge:null, featured:true, categorySlug:"audio-headphones", description:"Comfortable wireless headphones for everyday listening." },
  { name:"Nike Air Force 1", slug:"nike-air-force-1", price:12999, imageUrl:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85", rating:4.5, reviewCount:112, stock:25, badge:null, featured:true, categorySlug:"fashion-footwear", description:"A classic sneaker silhouette for everyday style." },
  { name:"Samsung Galaxy Watch 7", slug:"samsung-galaxy-watch-7", price:24999, imageUrl:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85", rating:4.6, reviewCount:64, stock:18, badge:null, featured:true, categorySlug:"wearables", description:"A smart wearable for activity tracking and notifications." },
  { name:"Samsung 55-inch QLED TV", slug:"samsung-55-qled-tv", price:109999, imageUrl:"https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85", rating:4.7, reviewCount:42, stock:8, badge:null, featured:true, categorySlug:"tv-home-theater", description:"A large-screen television for immersive home entertainment." }
];

async function main() {
  await prisma.user.upsert({
    where: { email: "kevinkengere@gmail.com" },
    update: { role: "ADMIN", passwordHash: await bcrypt.hash("fabian074310", 12) },
    create: { name: "Kevin Kengere", email: "kevinkengere@gmail.com", role: "ADMIN", passwordHash: await bcrypt.hash("fabian074310", 12) }
  });
  await prisma.cartItem.deleteMany({ where: { user: { email: "demo@mayden.shop" } } });
  await prisma.wishlistItem.deleteMany({ where: { user: { email: "demo@mayden.shop" } } });
  await prisma.orderItem.deleteMany({ where: { order: { user: { email: "demo@mayden.shop" } } } });
  await prisma.order.deleteMany({ where: { user: { email: "demo@mayden.shop" } } });
  await prisma.user.deleteMany({ where: { email: "demo@mayden.shop" } });
  for (const category of categories) {
    await prisma.category.upsert({ where: { slug: category.slug }, update: { name: category.name }, create: category });
  }
  for (const product of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: product.categorySlug } });
    const { categorySlug, ...data } = product;
    await prisma.product.upsert({
      where: { slug: data.slug },
      update: { ...data, categoryId: category.id },
      create: { ...data, categoryId: category.id }
    });
  }
  console.log("Mayden seed complete.");
}
main().finally(() => prisma.$disconnect());
