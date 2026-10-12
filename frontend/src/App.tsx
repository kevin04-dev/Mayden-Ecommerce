import { useEffect, useMemo, useState } from 'react';
import { Search, Heart, ShoppingCart, UserRound, Menu, Truck, Headset, ShieldCheck, ArrowRight, ChevronDown, X, Check, PackageCheck, LogOut, Moon, Sun, Trash2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
type Category = { id: string; name: string; slug: string; imageUrl?: string };
type Product = { id: string; name: string; slug: string; description?: string; price: number; imageUrl: string; rating: number; reviewCount: number; stock: number; badge?: string | null; category?: Category };
type CartLine = { product: Product; quantity: number; id?: string };
type User = { id: string; name: string; email: string; role?: string };
const categoryImages: Record<string,string> = {
  'phones-tablets':'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=240&q=80',
  'laptops-computers':'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=240&q=80',
  'audio-headphones':'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&q=80',
  'wearables':'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&q=80',
  'tv-home-theater':'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=240&q=80',
  'fashion-footwear':'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80',
  'beauty-personal-care':'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=240&q=80',
  'home-appliances':'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=240&q=80',
  'furniture':'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=240&q=80',
  'gaming':'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=240&q=80'
};
const fallbackProducts: Product[] = [
  {id:'demo-1',name:'iPhone 16 Pro',slug:'iphone-16-pro',price:129999,imageUrl:'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=700&q=85',rating:4.8,reviewCount:124,stock:20,badge:'Best Seller'},
  {id:'demo-2',name:'HP Pavilion Laptop',slug:'hp-pavilion-laptop',price:89999,imageUrl:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=85',rating:4.6,reviewCount:98,stock:14,badge:'New'},
  {id:'demo-3',name:'JBL Tune 720BT Headphones',slug:'jbl-tune-720bt-headphones',price:14999,imageUrl:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85',rating:4.7,reviewCount:76,stock:30},
  {id:'demo-4',name:'Nike Air Force 1',slug:'nike-air-force-1',price:12999,imageUrl:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85',rating:4.5,reviewCount:112,stock:25},
  {id:'demo-5',name:'Samsung Galaxy Watch 7',slug:'samsung-galaxy-watch-7',price:24999,imageUrl:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85',rating:4.6,reviewCount:64,stock:18},
  {id:'demo-6',name:'Samsung 55-inch QLED TV',slug:'samsung-55-qled-tv',price:109999,imageUrl:'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85',rating:4.7,reviewCount:42,stock:8}
];
const fallbackCategories: Category[] = [
  {id:'c1',name:'Phones & Tablets',slug:'phones-tablets'},{id:'c2',name:'Laptops & Computers',slug:'laptops-computers'},{id:'c3',name:'Audio & Headphones',slug:'audio-headphones'},{id:'c4',name:'Wearables',slug:'wearables'},{id:'c5',name:'TV & Home Theater',slug:'tv-home-theater'},{id:'c6',name:'Fashion & Footwear',slug:'fashion-footwear'},{id:'c7',name:'Beauty & Personal Care',slug:'beauty-personal-care'},{id:'c8',name:'Home Appliances',slug:'home-appliances'},{id:'c9',name:'Furniture',slug:'furniture'},{id:'c10',name:'Gaming',slug:'gaming'}
];
const money = (n:number) => `KSh ${n.toLocaleString('en-KE')}`;
async function request(path:string, init:RequestInit = {}, token?:string) {
  const response = await fetch(`${API}${path}`, { ...init, headers: { 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}), ...init.headers } });
  if (!response.ok) { let message = 'Request failed'; try { message = (await response.json()).error || message; } catch {} throw new Error(message); }
  if (response.status === 204) return null;
  return response.json();
}
export default function App() {
  const [categories,setCategories] = useState<Category[]>(fallbackCategories);
  const [products,setProducts] = useState<Product[]>(fallbackProducts);
  const [search,setSearch] = useState('');
  const [submittedSearch,setSubmittedSearch] = useState('');
  const [activeCategory,setActiveCategory] = useState('');
  const [cart,setCart] = useState<CartLine[]>([]);
  const [wishlist,setWishlist] = useState<string[]>([]);
  const [token,setToken] = useState(localStorage.getItem('mayden_token') || '');
  const [user,setUser] = useState<User|null>(null);
  const [authOpen,setAuthOpen] = useState(false);
  const [registerMode,setRegisterMode] = useState(false);
  const [cartOpen,setCartOpen] = useState(false);
  const [notice,setNotice] = useState('');
  const [mobileMenu,setMobileMenu] = useState(false);
  const [busy,setBusy] = useState(false);
  const [authForm,setAuthForm] = useState({name:'',email:'',password:''});
  const [checkoutOpen,setCheckoutOpen] = useState(false);
  const [checkout,setCheckout] = useState({phone:'',address:''});
  const [orders,setOrders] = useState<any[]>([]);
  const [ordersOpen,setOrdersOpen] = useState(false);
  const [addOpen,setAddOpen] = useState(false);
  const [addForm,setAddForm] = useState({name:'',price:'',stock:'',categorySlug:'',imageUrl:'',description:'',badge:''});
  const [theme,setTheme] = useState(localStorage.getItem('mayden_theme') || 'light');
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('mayden_theme',theme);},[theme]);

  useEffect(() => {
    request('/categories').then((data:Category[])=>setCategories(data)).catch(()=>{});
    request('/products?featured=true').then((data:Product[])=>{if(data.length)setProducts(data);}).catch(()=>{});
  },[]);
  useEffect(() => {
    if (!token) { setUser(null); return; }
    request('/auth/me',{},token).then((data:any)=>setUser(data.user)).catch(()=>{localStorage.removeItem('mayden_token');setToken('');setUser(null);});
    request('/cart',{},token).then((data:any[])=>setCart(data.map(i=>({id:i.id,quantity:i.quantity,product:i.product})))).catch(()=>{});
    request('/wishlist',{},token).then((data:any[])=>setWishlist(data.map(i=>i.productId || i.product?.id))).catch(()=>{});
  },[token]);

  const cartCount = cart.reduce((n,item)=>n+item.quantity,0);
  const total = cart.reduce((n,item)=>n+item.product.price*item.quantity,0);
  const visibleProducts = useMemo(()=>products.filter(p=>
    (!submittedSearch || `${p.name} ${p.description||''}`.toLowerCase().includes(submittedSearch.toLowerCase())) &&
    (!activeCategory || p.category?.slug===activeCategory || p.slug.includes(activeCategory))
  ),[products,submittedSearch,activeCategory]);

  function notify(message:string) { setNotice(message); window.setTimeout(()=>setNotice(''),2800); }
  async function addToCart(product:Product) {
    if (product.id.startsWith('demo-')) { setCart(old=>{const existing=old.find(i=>i.product.id===product.id);return existing?old.map(i=>i.product.id===product.id?{...i,quantity:i.quantity+1}:{...i}):[...old,{product,quantity:1}];}); notify('Added to cart'); return; }
    if (!token) { setCart(old=>{const existing=old.find(i=>i.product.id===product.id);return existing?old.map(i=>i.product.id===product.id?{...i,quantity:i.quantity+1}:{...i}):[...old,{product,quantity:1}];}); notify('Added to cart. Log in to sync it across devices.'); return; }
    try { const item=await request('/cart',{method:'POST',body:JSON.stringify({productId:product.id,quantity:1})},token);setCart(old=>{const found=old.find(i=>i.product.id===product.id);return found?old.map(i=>i.product.id===product.id?{...i,quantity:item.quantity,id:item.id}:i):[...old,{id:item.id,product:item.product,quantity:item.quantity}];});notify('Added to cart'); }
    catch(e:any){notify(e.message);}
  }
  async function toggleWishlist(product:Product) {
    if (!token || product.id.startsWith('demo-')) { setWishlist(old=>old.includes(product.id)?old.filter(id=>id!==product.id):[...old,product.id]);notify(token?'Wishlist updated':'Saved for this session. Log in to sync your wishlist.');return; }
    try { const result=await request(`/wishlist/${product.id}`,{method:'POST'},token);setWishlist(old=>result.saved?old.filter(id=>id!==product.id):[...old,product.id]);notify(result.saved?'Removed from wishlist':'Added to wishlist'); }
    catch(e:any){notify(e.message);}
  }
  async function authenticate(e:React.FormEvent) {
    e.preventDefault();setBusy(true);
    try {
      const result=await request(registerMode?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify(authForm)});
      localStorage.setItem('mayden_token',result.token);setToken(result.token);setUser(result.user);setAuthOpen(false);notify(`Welcome${result.user.name?`, ${result.user.name.split(' ')[0]}`:''}!`);
    } catch(e:any) { notify(e.message); } finally {setBusy(false);}
  }
  async function changeQuantity(line:CartLine,quantity:number) {
    if(quantity<1) { if(line.id&&token) {try{await request(`/cart/${line.id}`,{method:'DELETE'},token);}catch{}} setCart(old=>old.filter(i=>i.product.id!==line.product.id));return; }
    if(line.id&&token) { try { await request(`/cart/${line.id}`,{method:'PATCH',body:JSON.stringify({quantity})},token); } catch(e:any){notify(e.message);return;} }
    setCart(old=>old.map(i=>i.product.id===line.product.id?{...i,quantity}:i));
  }
  async function placeOrder(e:React.FormEvent) {
    e.preventDefault();if(!token){setCheckoutOpen(false);setAuthOpen(true);notify('Log in or register to place an order');return;}
    setBusy(true);
    try { const result=await request('/orders',{method:'POST',body:JSON.stringify(checkout)},token);setCart([]);setCheckoutOpen(false);notify(`Order ${result.order.id.slice(-7)} placed. Payment has not been collected.`); }
    catch(e:any){notify(e.message);} finally{setBusy(false);}
  }
  async function showOrders() {
    if(!token){setAuthOpen(true);notify('Log in to view your orders');return;}
    try {setOrders(await request('/orders',{},token));setOrdersOpen(true);}catch(e:any){notify(e.message);}
  }
  function logout(){localStorage.removeItem('mayden_token');setToken('');setUser(null);setCart([]);setWishlist([]);notify('You have logged out');}
  async function addProduct(e:React.FormEvent) {
    e.preventDefault();setBusy(true);
    try {
      const created=await request('/products',{method:'POST',body:JSON.stringify({
        name:addForm.name,price:Number(addForm.price),stock:Number(addForm.stock),categorySlug:addForm.categorySlug,
        imageUrl:addForm.imageUrl||undefined,description:addForm.description||undefined,badge:addForm.badge||undefined,featured:true
      })},token);
      setProducts(old=>[created,...old]);setAddOpen(false);setAddForm({name:'',price:'',stock:'',categorySlug:'',imageUrl:'',description:'',badge:''});notify(`"${created.name}" added to the store`);
    } catch(e:any){notify(e.message);} finally{setBusy(false);}
  }
  async function removeProduct(product:Product) {
    if(product.id.startsWith('demo-')){notify('This is a sample item and cannot be removed');return;}
    const card=document.querySelector(`[data-product-id="${product.id}"]`);
    card?.classList.add('removing');
    try { await request(`/products/${product.id}`,{method:'DELETE'},token);await new Promise(r=>setTimeout(r,280));setProducts(old=>old.filter(p=>p.id!==product.id));notify(`"${product.name}" removed`); }
    catch(e:any){card?.classList.remove('removing');notify(e.message);}
  }
  function submitSearch(e:React.FormEvent){e.preventDefault();setSubmittedSearch(search);setActiveCategory('');document.getElementById('products')?.scrollIntoView({behavior:'smooth'});}
  if (!token) return <div className="auth-gate">
    <div className="auth-gate-panel">
      <div className="modal-logo">Mayden</div>
      <h2>{registerMode ? 'Create your account' : 'Welcome back'}</h2>
      <p>{registerMode ? 'Create an account to save your cart and track orders.' : 'Log in to start shopping.'}</p>
      <form onSubmit={authenticate}>
        {registerMode && <label>Full name<input required minLength={2} value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input required minLength={registerMode?8:1} type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder={registerMode?'At least 8 characters':'Your password'}/></label>
        <button className="modal-submit" disabled={busy}>{busy?'Please wait…':registerMode?'Create Account':'Log In'}</button>
      </form>
      <button className="switch-auth" onClick={()=>setRegisterMode(!registerMode)}>{registerMode?'Already have an account? Log in':'New to Mayden? Create an account'}</button>
    </div>
  </div>;
  return <div className="site-shell">
    <div className="announcement"><div className="announcement-inner"><span><Truck size={16} fill="currentColor"/>Free shipping on orders over KSh 5,000</span><span className="support-top"><Headset size={16}/>24/7 Customer Support</span><div className="announcement-actions"><button onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label="Toggle dark mode">{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}{theme==='dark'?'Light':'Dark'} Mode</button><button onClick={showOrders}>↗ &nbsp;Track Order</button>{user?<button onClick={logout}><LogOut size={14}/>Logout</button>:<button onClick={()=>setAuthOpen(true)}><UserRound size={15}/>Login / Register</button>}</div></div></div>
    <header className="main-header"><div className="header-top">
      <button className="mobile-menu" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu?<X/>:<Menu/>}</button>
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setActiveCategory('');setSubmittedSearch('');window.scrollTo({top:0,behavior:'smooth'});}}><span className="brand-bag">▱</span><span><strong>Mayden</strong><small>Shop More. Live Better.</small></span></a>
      <form className="search-form" onSubmit={submitSearch}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search for products, brands and more..."/><button aria-label="Search"><Search size={21}/></button></form>
      <div className="header-icons"><button aria-label="Wishlist" onClick={()=>{if(!token){setAuthOpen(true);notify('Log in to sync your wishlist');}else notify(`${wishlist.length} saved item(s)`);}}><Heart/><span className="count">{wishlist.length}</span></button><button aria-label="Shopping cart" onClick={()=>setCartOpen(true)}><ShoppingCart/><span className="count">{cartCount}</span></button>{user?.role==='ADMIN'&&<button className="add-product-btn" onClick={()=>setAddOpen(true)}>+ Add Product</button>}<button aria-label="Account" onClick={()=>user?notify(`Logged in as ${user.email}`):setAuthOpen(true)}><UserRound/></button></div>
    </div><nav className={`navigation ${mobileMenu?'mobile-open':''}`}><button className="all-categories" onClick={()=>{setActiveCategory('');document.getElementById('categories')?.scrollIntoView({behavior:'smooth'});}}><Menu size={19}/>All Categories<ChevronDown size={15}/></button><div className="nav-links"><a className="active" href="#home">Home</a><a href="#products">Shop</a><a href="#products" onClick={()=>setSubmittedSearch('')}>Deals</a><a href="#products">New Arrivals</a><a href="#categories">Brands</a><a href="#footer">About</a></div></nav></header>
    <main id="home">
      <section className="hero"><div className="hero-copy"><span className="eyebrow">FEATURED DEAL</span><h1>Upgrade Your<br/>Lifestyle with <em>Mayden</em></h1><p>Discover top quality products, unbeatable prices<br className="desktop-break"/> and a seamless shopping experience.</p><button className="shop-now" onClick={()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'})}>Shop Now <ArrowRight size={18}/></button><div className="slider-dots"><span/><span/><span/></div></div><div className="hero-visual"><img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=90" alt="Premium laptop and technology collection"/><div className="hero-products"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=85" alt="Wireless headphones"/><img src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=500&q=85" alt="Smartphone"/></div></div><div className="discount-badge">UP TO<strong>50%</strong>OFF</div></section>
      <section className="categories" id="categories">{categories.map(c=><button className={`category-card ${activeCategory===c.slug?'selected':''}`} key={c.id} onClick={()=>{setActiveCategory(activeCategory===c.slug?'':c.slug);setSubmittedSearch('');document.getElementById('products')?.scrollIntoView({behavior:'smooth'});}}><span className="category-image"><img src={c.imageUrl||categoryImages[c.slug]||categoryImages['gaming']} alt=""/></span><span>{c.name}</span></button>)}</section>
      <section className="products-section" id="products"><div className="section-heading"><div><h2>{activeCategory?categories.find(c=>c.slug===activeCategory)?.name:submittedSearch?`Search results for "${submittedSearch}"`:'Featured Products'}</h2>{(activeCategory||submittedSearch)&&<button className="clear-filter" onClick={()=>{setActiveCategory('');setSubmittedSearch('');setSearch('');}}>Clear filters ×</button>}</div><button className="view-all" onClick={()=>{setActiveCategory('');setSubmittedSearch('');setSearch('');}}>View All <ArrowRight size={15}/></button></div>
        {visibleProducts.length?<div className="product-grid">{visibleProducts.map((p,i)=><article className="product-card" data-product-id={p.id} key={p.id}><div className="product-image-wrap">{p.badge&&<span className={`product-badge ${p.badge==='Best Seller'?'best':''}`}>{p.badge}</span>}<button className={`wishlist-button ${wishlist.includes(p.id)?'wishlisted':''}`} aria-label="Toggle wishlist" onClick={()=>toggleWishlist(p)}><Heart size={18} fill={wishlist.includes(p.id)?'currentColor':'none'}/></button>{user?.role==='ADMIN'&&<button className="remove-product-btn" aria-label={`Remove ${p.name}`} onClick={()=>{if(window.confirm(`Remove "${p.name}" from the store?`))removeProduct(p);}}><Trash2 size={16}/></button>}<img className="product-image" src={p.imageUrl} alt={p.name} loading="lazy" onError={e=>{(e.currentTarget as HTMLImageElement).src='https://placehold.co/600x450/f7f7f7/064e3b?text=Mayden+Product';}}/></div><div className="product-info"><h3>{p.name}</h3><div className="rating"><span>{'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5-Math.round(p.rating))}</span><small>({p.reviewCount})</small></div><strong className="price">{money(p.price)}</strong><button className="add-cart" disabled={p.stock<=0} onClick={()=>addToCart(p)}><ShoppingCart size={14}/>{p.stock>0?'Add to Cart':'Out of Stock'}</button></div></article>)}</div>:<div className="empty-state"><PackageCheck size={32}/><p>No products match your search. Try another term or category.</p></div>}
      </section>
      <section className="benefits"><div className="benefit-card"><Truck size={42}/><div><strong>Fast &amp; Reliable Delivery</strong><span>Get your orders delivered to your doorstep.</span></div></div><div className="benefit-card gold-benefit"><ShieldCheck size={42}/><div><strong>Secure Payments</strong><span>Shop with confidence using multiple payment options.</span></div></div><div className="benefit-card"><Headset size={42}/><div><strong>24/7 Customer Support</strong><span>We're here to help, anytime.</span></div></div></section>
    </main>
    <footer id="footer"><div className="footer-brand"><strong>Mayden</strong><span>Shop More. Live Better.</span></div><span>© 2026 Mayden. All rights reserved.</span><span>Made for better everyday shopping.</span></footer>
    {notice&&<div className="toast"><Check size={17}/>{notice}</div>}
    {cartOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false);}}><aside className="drawer"><div className="drawer-head"><h2>Your Shopping Cart ({cartCount})</h2><button onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length?<><div className="cart-lines">{cart.map(line=><div className="cart-line" key={line.product.id}><img src={line.product.imageUrl} alt=""/><div className="cart-line-info"><strong>{line.product.name}</strong><span>{money(line.product.price)}</span><div className="quantity"><button onClick={()=>changeQuantity(line,line.quantity-1)}>−</button><span>{line.quantity}</span><button onClick={()=>changeQuantity(line,line.quantity+1)}>+</button><button className="remove" onClick={()=>changeQuantity(line,0)}>Remove</button></div></div></div>)}</div><div className="cart-total"><div><span>Subtotal</span><strong>{money(total)}</strong></div><small>Shipping and payment are confirmed during order processing.</small><button onClick={()=>{setCartOpen(false);setCheckoutOpen(true);}}>Proceed to Checkout</button></div></>:<div className="empty-cart"><ShoppingCart size={40}/><h3>Your cart is empty</h3><p>Discover something you love.</p><button onClick={()=>setCartOpen(false)}>Continue Shopping</button></div>}</aside></div>}
    {authOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false);}}><div className="modal"><button className="modal-close" onClick={()=>setAuthOpen(false)}><X/></button><div className="modal-logo">Mayden</div><h2>{registerMode?'Create your account':'Welcome back'}</h2><p>{registerMode?'Create an account to save your cart and track orders.':'Log in to manage your account and orders.'}</p><form onSubmit={authenticate}>{registerMode&&<label>Full name<input required minLength={2} value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label>}<label>Email address<input required type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label><label>Password<input required minLength={registerMode?8:1} type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder={registerMode?'At least 8 characters':'Your password'}/></label><button className="modal-submit" disabled={busy}>{busy?'Please wait…':registerMode?'Create Account':'Log In'}</button></form><button className="switch-auth" onClick={()=>setRegisterMode(!registerMode)}>{registerMode?'Already have an account? Log in':'New to Mayden? Create an account'}</button></div></div>}
    {checkoutOpen&&<div className="overlay"><div className="modal"><button className="modal-close" onClick={()=>setCheckoutOpen(false)}><X/></button><div className="modal-logo">Mayden Checkout</div><h2>Delivery details</h2><p>Order total: <strong>{money(total)}</strong></p><form onSubmit={placeOrder}><label>Phone number<input required value={checkout.phone} onChange={e=>setCheckout({...checkout,phone:e.target.value})} placeholder="+254 7xx xxx xxx"/></label><label>Delivery address<textarea required minLength={5} value={checkout.address} onChange={e=>setCheckout({...checkout,address:e.target.value})} placeholder="Estate, street, town, county"/></label><div className="checkout-note">This starter records the order but does not collect payment. A payment provider must be integrated before accepting live orders.</div><button className="modal-submit" disabled={busy}>{busy?'Placing order…':'Place Order'}</button></form></div></div>}
    {addOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAddOpen(false);}}><div className="modal"><button className="modal-close" onClick={()=>setAddOpen(false)}><X/></button><div className="modal-logo">Mayden Admin</div><h2>Add a product</h2><p>Creates a new item in the store instantly.</p><form onSubmit={addProduct}><label>Product name<input required minLength={2} value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} placeholder="e.g. Anker Soundcore Speaker"/></label><div className="form-row"><label>Price (KSh)<input required type="number" min={1} value={addForm.price} onChange={e=>setAddForm({...addForm,price:e.target.value})} placeholder="4999"/></label><label>Stock<input required type="number" min={0} value={addForm.stock} onChange={e=>setAddForm({...addForm,stock:e.target.value})} placeholder="10"/></label></div><label>Category<select required value={addForm.categorySlug} onChange={e=>setAddForm({...addForm,categorySlug:e.target.value})}><option value="">Choose a category…</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select></label><label>Image URL (optional)<input type="url" value={addForm.imageUrl} onChange={e=>setAddForm({...addForm,imageUrl:e.target.value})} placeholder="https://images.unsplash.com/…"/></label><label>Description (optional)<textarea value={addForm.description} onChange={e=>setAddForm({...addForm,description:e.target.value})} placeholder="Short description…"/></label><label>Badge (optional)<input value={addForm.badge} onChange={e=>setAddForm({...addForm,badge:e.target.value})} placeholder="New / Best Seller / Deal"/></label><button className="modal-submit" disabled={busy}>{busy?'Adding…':'Add to Store'}</button></form></div></div>}
    {ordersOpen&&<div className="overlay"><div className="modal orders-modal"><button className="modal-close" onClick={()=>setOrdersOpen(false)}><X/></button><div className="modal-logo">Mayden Orders</div><h2>Your orders</h2>{orders.length?orders.map(o=><div className="order-row" key={o.id}><div><strong>Order #{o.id.slice(-7)}</strong><span>{new Date(o.createdAt).toLocaleDateString()}</span></div><div><strong>{money(o.total)}</strong><span className="order-status">{o.status}</span></div></div>):<p>You haven't placed any orders yet.</p>}</div></div>}
  </div>;
}
