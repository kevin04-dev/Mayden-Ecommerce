import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient, Role } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

function auth(required = true) {
  return async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return required ? res.status(401).json({ error: "Authentication required" }) : next();
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role };
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, name: true, email: true, role: true } });
      if (!user) return res.status(401).json({ error: "Invalid session" });
      req.user = user;
      next();
    } catch { return res.status(401).json({ error: "Invalid or expired token" }); }
  };
}
const safeProduct = (p: any) => ({ ...p, price: Number(p.price) });

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Mayden API" }));

app.get("/api/categories", async (_req, res, next) => {
  try { res.json(await prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } })); }
  catch (e) { next(e); }
});

app.get("/api/products", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "");
    const featured = req.query.featured === "true";
    const products = await prisma.product.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(featured ? { featured: true } : {})
      },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
    });
    res.json(products.map(safeProduct));
  } catch (e) { next(e); }
});

app.get("/api/products/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: { category: true } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(safeProduct(product));
  } catch (e) { next(e); }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });
    const user = await prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash: await bcrypt.hash(input.password, 12) } });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

app.get("/api/auth/me", auth(), (req: any, res) => res.json({ user: req.user }));

app.get("/api/cart", auth(), async (req: any, res, next) => {
  try {
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    res.json(items.map((i) => ({ id: i.id, quantity: i.quantity, product: safeProduct(i.product) })));
  } catch (e) { next(e); }
});

app.post("/api/cart", auth(), async (req: any, res, next) => {
  try {
    const input = z.object({ productId: z.string(), quantity: z.number().int().min(1).default(1) }).parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || product.stock < input.quantity) return res.status(400).json({ error: "Product unavailable or insufficient stock" });
    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: input.productId } },
      update: { quantity: { increment: input.quantity } },
      create: { userId: req.user.id, productId: input.productId, quantity: input.quantity },
      include: { product: true }
    });
    res.status(201).json({ id: item.id, quantity: item.quantity, product: safeProduct(item.product) });
  } catch (e) { next(e); }
});

app.patch("/api/cart/:id", auth(), async (req: any, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(1).max(99) }).parse(req.body);
    const item = await prisma.cartItem.findFirst({ where: { id: req.params.id, userId: req.user.id }, include: { product: true } });
    if (!item) return res.status(404).json({ error: "Cart item not found" });
    if (quantity > item.product.stock) return res.status(400).json({ error: "Quantity exceeds available stock" });
    res.json(await prisma.cartItem.update({ where: { id: item.id }, data: { quantity }, include: { product: true } }));
  } catch (e) { next(e); }
});

app.delete("/api/cart/:id", auth(), async (req: any, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

app.get("/api/wishlist", auth(), async (req: any, res, next) => {
  try { res.json(await prisma.wishlistItem.findMany({ where: { userId: req.user.id }, include: { product: true } })); }
  catch (e) { next(e); }
});

app.post("/api/wishlist/:productId", auth(), async (req: any, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    const where = { userId_productId: { userId: req.user.id, productId: product.id } };
    const existing = await prisma.wishlistItem.findUnique({ where });
    if (existing) { await prisma.wishlistItem.delete({ where }); return res.json({ saved: false }); }
    await prisma.wishlistItem.create({ data: { userId: req.user.id, productId: product.id } });
    res.status(201).json({ saved: true });
  } catch (e) { next(e); }
});

app.post("/api/products", auth(), async (req: any, res, next) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
    const input = z.object({
      name: z.string().min(2), price: z.number().int().min(0), stock: z.number().int().min(0),
      categorySlug: z.string(), imageUrl: z.string().url().optional().or(z.literal("")),
      description: z.string().max(500).optional(), featured: z.boolean().optional().default(false), badge: z.string().optional()
    }).parse(req.body);
    const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } });
    if (!category) return res.status(400).json({ error: "Unknown category" });
    const slugBase = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const product = await prisma.product.create({
      data: { name: input.name, slug, price: input.price, stock: input.stock, imageUrl: input.imageUrl || "https://placehold.co/600x450/f7f7f7/064e3b?text=Mayden+Product", description: input.description || undefined, featured: input.featured, badge: input.badge || null, categoryId: category.id },
      include: { category: true }
    });
    res.status(201).json(safeProduct(product));
  } catch (e) { next(e); }
});

app.delete("/api/products/:id", auth(), async (req: any, res, next) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { next(e); }
});

app.post("/api/orders", auth(), async (req: any, res, next) => {
  try {
    const input = z.object({ phone: z.string().min(7), address: z.string().min(5) }).parse(req.body);
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.id }, include: { product: true } });
    if (!items.length) return res.status(400).json({ error: "Your cart is empty" });
    for (const item of items) if (item.quantity > item.product.stock) return res.status(400).json({ error: `Insufficient stock for ${item.product.name}` });
    const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { userId: req.user.id, total, phone: input.phone, address: input.address, items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.product.price })) } } });
      for (const item of items) await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
      return created;
    });
    res.status(201).json({ order, message: "Order placed. Payment is not collected by this demo endpoint." });
  } catch (e) { next(e); }
});

app.get("/api/orders", auth(), async (req: any, res, next) => {
  try { res.json(await prisma.order.findMany({ where: { userId: req.user.id }, include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } })); }
  catch (e) { next(e); }
});

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid request", details: err.issues });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Mayden API listening on http://localhost:${PORT}`));
