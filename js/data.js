(function () {
  const cfg = window.FIREBASE_CONFIG || {};
  const hasFirebase = !!(cfg.apiKey && cfg.projectId);
  const mode = hasFirebase ? "firebase" : "local";
  const COMMISSION = window.PLATFORM_COMMISSION_RATE || 0.10;

  // ---------- Local (demo) helpers ----------
  const LS = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn("Storage quota exceeded", e); alert("El almacenamiento local está lleno. Usa imágenes más pequeñas o activa Firebase."); } }
  };
  const local = {
    users: () => LS.get("dw_users", []),
    setUsers: (u) => LS.set("dw_users", u),
    products: () => LS.get("dw_products", []),
    setProducts: (p) => LS.set("dw_products", p),
    orders: () => LS.get("dw_orders", []),
    setOrders: (o) => LS.set("dw_orders", o),
    session: () => LS.get("dw_session", null),
    setSession: (s) => LS.set("dw_session", s),
  };

  let currentUser = null;
  const authListeners = [];
  function emitAuth(u) { currentUser = u; authListeners.forEach(fn => fn(u)); }

  // ---------- Firebase init ----------
  let fbAuth = null, fbDb = null;
  if (hasFirebase) {
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      fbAuth = firebase.auth();
      fbDb = firebase.firestore();
    } catch (e) { console.error("Firebase init error", e); }
  }

  async function hashPass(p) { // demo only; not secure. Production uses Firebase Auth.
    return btoa(unescape(encodeURIComponent(p)));
  }

  const Data = {
    mode,
    commissionRate: COMMISSION,

    onAuthChange(fn) { authListeners.push(fn); fn(currentUser); },

    async init() {
      await this.incrementVisits();
      if (mode === "firebase") {
        fbAuth.onAuthStateChanged(async (u) => {
          if (u) {
            const doc = await fbDb.collection("users").doc(u.uid).get();
            const profile = doc.exists ? doc.data() : { name: u.email, email: u.email, seller: false, admin: false };
            emitAuth({ uid: u.uid, email: u.email, name: profile.name, seller: !!profile.seller, admin: !!profile.admin, storeName: profile.storeName || "", storeLogo: profile.storeLogo || "" });
          } else {
            emitAuth(null);
          }
        });
      } else {
        const s = local.session();
        // Seed admin user if not exists
        const users = local.users();
        if (!users.some(u => u.email === "diamantesartesanias@gmail.com")) {
          users.push({ id: "u_admin", name: "Administrador", email: "diamantesartesanias@gmail.com", password: await hashPass("diamantes2026"), seller: false, admin: true, storeName: "Diamantes", storeLogo: "assets/logo.png", createdAt: Date.now() });
          local.setUsers(users);
        }
        // Seed vendor Dulce if not exists
        if (!users.some(u => u.email === "dulcepequena77@gmail.com")) {
          users.push({ id: "u_dulce", name: "Dulce", email: "dulcepequena77@gmail.com", password: await hashPass("dulce2026"), seller: true, admin: false, storeName: "Dulce Artesanías", storeLogo: "", createdAt: Date.now() });
          local.setUsers(users);
        }
        // Seed sample products for Dulce if missing
        const dulce = local.users().find(u => u.email === "dulcepequena77@gmail.com");
        if (dulce) {
          const existingIds = new Set(local.products().map(p => p.id));
          const sample = [
            { id: "p_dulce_0", title: "Anillo de plata", category: "anillos", price: 80000, stock: 5, description: "Anillo artesanal en plata.", imageUrl: "assets/foto.jpg" },
            { id: "p_dulce_1", title: "Collar de perlas", category: "collares", price: 120000, stock: 3, description: "Collar de perlas naturales.", imageUrl: "assets/banner.jpg" },
            { id: "p_dulce_2", title: "Bolso artesanal", category: "bolsos", price: 95000, stock: 4, description: "Bolso tejido a mano.", imageUrl: "assets/foto.jpg" },
          ];
          const products = local.products();
          let changed = false;
          // update existing
          for (const s of sample) {
            const idx = products.findIndex(p => p.id === s.id);
            if (idx >= 0) {
              if (!products[idx].imageUrl) { products[idx].imageUrl = s.imageUrl; changed = true; }
              if (!products[idx].sellerLogo) { products[idx].sellerLogo = dulce.storeLogo || "assets/logo.png"; changed = true; }
            }
          }
          // add missing
          const toAdd = sample.filter(p => !existingIds.has(p.id)).map(p => ({
            ...p,
            sellerId: dulce.id,
            sellerName: dulce.storeName || dulce.name,
            sellerLogo: dulce.storeLogo || "assets/logo.png",
            sellerEmail: dulce.email,
            createdAt: Date.now(),
          }));
          if (toAdd.length) {
            products.unshift(...toAdd);
            changed = true;
          }
          if (changed) local.setProducts(products);
        }
        if (s) {
          const u = local.users().find(x => x.id === s.id);
          if (u) emitAuth({ uid: u.id, email: u.email, name: u.name, seller: !!u.seller, admin: !!u.admin, storeName: u.storeName || "", storeLogo: u.storeLogo || "" });
          else emitAuth(null);
        } else {
          emitAuth(null);
        }
      }
    },

    async register(name, email, password, seller) {
      if (mode === "firebase") {
        const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
        await fbDb.collection("users").doc(cred.user.uid).set({ name, email, seller: !!seller, admin: email === "diamantesartesanias@gmail.com", storeName: email === "diamantesartesanias@gmail.com" ? "Diamantes" : "", storeLogo: email === "diamantesartesanias@gmail.com" ? "assets/logo.png" : "", createdAt: Date.now() });
        return { uid: cred.user.uid, email, name, seller: !!seller, admin: email === "diamantesartesanias@gmail.com", storeName: "", storeLogo: "" };
      }
      const users = local.users();
      if (users.some(u => u.email === email)) throw new Error("El correo ya está registrado");
      const u = { id: "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7), name, email, password: await hashPass(password), seller: !!seller, admin: email === "diamantesartesanias@gmail.com", storeName: email === "diamantesartesanias@gmail.com" ? "Diamantes" : "", storeLogo: email === "diamantesartesanias@gmail.com" ? "assets/logo.png" : "", createdAt: Date.now() };
      users.push(u);
      local.setUsers(users);
      local.setSession({ id: u.id });
      emitAuth({ uid: u.id, email: u.email, name: u.name, seller: !!u.seller, admin: !!u.admin, storeName: "", storeLogo: "" });
      return { uid: u.id, email: u.email, name: u.name, seller: !!u.seller, admin: !!u.admin, storeName: "", storeLogo: "" };
    },

    async login(email, password) {
      if (mode === "firebase") {
        const cred = await fbAuth.signInWithEmailAndPassword(email, password);
        const doc = await fbDb.collection("users").doc(cred.user.uid).get();
        const profile = doc.exists ? doc.data() : { name: email, email, seller: false };
        const u = { uid: cred.user.uid, email: cred.user.email, name: profile.name, seller: !!profile.seller, admin: !!profile.admin, storeName: profile.storeName || "", storeLogo: profile.storeLogo || "" };
        emitAuth(u);
        return u;
      }
      const u = local.users().find(x => x.email === email);
      if (!u) throw new Error("Usuario no encontrado");
      if (u.password !== await hashPass(password)) throw new Error("Contraseña incorrecta");
      local.setSession({ id: u.id });
      const authU = { uid: u.id, email: u.email, name: u.name, seller: !!u.seller, admin: !!u.admin, storeName: u.storeName || "", storeLogo: u.storeLogo || "" };
      emitAuth(authU);
      return authU;
    },

    async logout() {
      if (mode === "firebase") { await fbAuth.signOut(); }
      else { local.setSession(null); emitAuth(null); }
    },

    getCurrentUser() { return currentUser; },

    async getUsers() {
      if (mode === "firebase") {
        const snap = await fbDb.collection("users").get();
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      }
      return local.users();
    },

    async getVisits() {
      if (mode === "firebase") {
        const doc = await fbDb.collection("stats").doc("visits").get();
        return doc.exists ? (doc.data().count || 0) : 0;
      }
      return LS.get("dw_visits", 0);
    },

    async incrementVisits() {
      if (mode === "firebase") {
        const ref = fbDb.collection("stats").doc("visits");
        await ref.set({ count: firebase.firestore.FieldValue.increment(1) }, { merge: true });
      } else {
        LS.set("dw_visits", LS.get("dw_visits", 0) + 1);
      }
    },

    async updateStoreName(storeName) {
      const u = currentUser;
      if (!u) throw new Error("Debes iniciar sesión");
      storeName = (storeName || "").trim();
      if (mode === "firebase") {
        await fbDb.collection("users").doc(u.uid).set({ storeName }, { merge: true });
      } else {
        const users = local.users();
        const idx = users.findIndex(x => x.id === u.uid);
        if (idx >= 0) { users[idx].storeName = storeName; local.setUsers(users); }
      }
      const updated = { ...u, storeName };
      emitAuth(updated);
      return updated;
    },

    async updateStoreLogo(storeLogo) {
      const u = currentUser;
      if (!u) throw new Error("Debes iniciar sesión");
      storeLogo = storeLogo || "";
      if (mode === "firebase") {
        await fbDb.collection("users").doc(u.uid).set({ storeLogo }, { merge: true });
      } else {
        const users = local.users();
        const idx = users.findIndex(x => x.id === u.uid);
        if (idx >= 0) { users[idx].storeLogo = storeLogo; local.setUsers(users); }
      }
      const updated = { ...u, storeLogo };
      emitAuth(updated);
      return updated;
    },

    // ---------- Products ----------
    async getProducts(filters) {
      filters = filters || {};
      let list = [];
      if (mode === "firebase") {
        const snap = await fbDb.collection("products").orderBy("createdAt", "desc").get();
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        list = local.products().slice().sort((a, b) => b.createdAt - a.createdAt);
      }
      if (filters.category) list = list.filter(p => p.category === filters.category);
      if (filters.q) {
        const q = filters.q.toLowerCase();
        list = list.filter(p => (p.title + " " + p.description).toLowerCase().includes(q));
      }
      if (filters.sort === "price-asc") list.sort((a, b) => a.price - b.price);
      if (filters.sort === "price-desc") list.sort((a, b) => b.price - a.price);
      if (filters.sellerId) list = list.filter(p => p.sellerId === filters.sellerId);
      return list;
    },

    async getProduct(id) {
      if (mode === "firebase") {
        const doc = await fbDb.collection("products").doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      }
      return local.products().find(p => p.id === id) || null;
    },

    async createProduct(p) {
      const u = currentUser;
      if (!u) throw new Error("Debes iniciar sesión");
      const prod = {
        title: p.title,
        description: p.description,
        price: Number(p.price),
        stock: Number(p.stock),
        category: p.category,
        imageUrl: p.imageUrl || "",
        sellerId: u.uid,
        sellerName: u.storeName || u.name,
        sellerLogo: u.admin ? "assets/logo.png" : (u.storeLogo || ""),
        sellerEmail: u.email,
        createdAt: Date.now(),
      };
      if (mode === "firebase") {
        const ref = await fbDb.collection("products").add(prod);
        return { id: ref.id, ...prod };
      }
      const products = local.products();
      const id = "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      const full = { id, ...prod };
      products.unshift(full);
      local.setProducts(products);
      return full;
    },

    async decrementStock(id, qty) {
      qty = qty || 1;
      if (mode === "firebase") {
        const ref = fbDb.collection("products").doc(id);
        await fbDb.runTransaction(async (t) => {
          const doc = await t.get(ref);
          const cur = doc.data().stock || 0;
          t.update(ref, { stock: Math.max(0, cur - qty) });
        });
        return;
      }
      const products = local.products();
      const idx = products.findIndex(x => x.id === id);
      if (idx >= 0) {
        products[idx].stock = Math.max(0, (products[idx].stock || 0) - qty);
        local.setProducts(products);
      }
    },
    async updateProduct(id, p) {
      if (mode === "firebase") {
        await fbDb.collection("products").doc(id).update(p);
        return;
      }
      const products = local.products();
      const idx = products.findIndex(x => x.id === id);
      if (idx >= 0) { products[idx] = { ...products[idx], ...p }; local.setProducts(products); }
    },

    async deleteProduct(id) {
      if (mode === "firebase") {
        await fbDb.collection("products").doc(id).delete();
        return;
      }
      local.setProducts(local.products().filter(p => p.id !== id));
    },

    // ---------- Orders / commissions ----------
    async createOrder(productId, buyerName) {
      const product = await this.getProduct(productId);
      if (!product) throw new Error("Producto no encontrado");
      const commission = +(product.price * COMMISSION).toFixed(2);
      const sellerNet = +(product.price - commission).toFixed(2);
      const order = {
        productId,
        productTitle: product.title,
        price: product.price,
        commission,
        sellerNet,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        sellerEmail: product.sellerEmail || "",
        buyerName: buyerName || (currentUser ? currentUser.name : "Anónimo"),
        buyerId: currentUser ? currentUser.uid : null,
        createdAt: Date.now(),
        status: "pendiente",
        deliveredAt: null,
        autoReleaseAt: null,
        released: false,
        readyForPayout: false,
        payoutApproved: false,
        payoutDate: null,
        carrier: null,
        trackingNumber: null,
      };
      if (mode === "firebase") {
        const ref = await fbDb.collection("orders").add(order);
        return { id: ref.id, ...order };
      }
      const orders = local.orders();
      const id = "o_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      const full = { id, ...order };
      orders.unshift(full);
      local.setOrders(orders);
      return full;
    },

    async getOrders(filter) {
      filter = filter || {};
      let list = [];
      if (mode === "firebase") {
        const snap = await fbDb.collection("orders").orderBy("createdAt", "desc").get();
        list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        list = local.orders().slice().sort((a, b) => b.createdAt - a.createdAt);
      }
      // Auto-release expired funds
      const now = Date.now();
      for (const o of list) {
        if (o.status === "entregado" && o.autoReleaseAt && now >= o.autoReleaseAt && !o.released) {
          o.status = "completado";
          o.readyForPayout = true;
          if (mode === "firebase") {
            await fbDb.collection("orders").doc(o.id).update({ status: "completado", readyForPayout: true });
          } else {
            const orders = local.orders();
            const idx = orders.findIndex(x => x.id === o.id);
            if (idx >= 0) { orders[idx].status = "completado"; orders[idx].readyForPayout = true; local.setOrders(orders); }
          }
        }
      }
      if (filter.sellerId) list = list.filter(o => o.sellerId === filter.sellerId);
      if (filter.buyerId) list = list.filter(o => o.buyerId === filter.buyerId);
      return list;
    },

    async updateOrderStatus(id, status) {
      if (mode === "firebase") {
        await fbDb.collection("orders").doc(id).update({ status });
        return;
      }
      const orders = local.orders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) { orders[idx].status = status; local.setOrders(orders); }
    },

    async markDelivered(id) {
      const now = Date.now();
      const autoReleaseAt = now + 5 * 24 * 60 * 60 * 1000;
      if (mode === "firebase") {
        await fbDb.collection("orders").doc(id).update({ status: "entregado", deliveredAt: now, autoReleaseAt });
        return;
      }
      const orders = local.orders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) {
        orders[idx].status = "entregado";
        orders[idx].deliveredAt = now;
        orders[idx].autoReleaseAt = autoReleaseAt;
        local.setOrders(orders);
      }
    },

    async confirmSatisfaction(id) {
      if (mode === "firebase") {
        await fbDb.collection("orders").doc(id).update({ status: "completado", readyForPayout: true });
        return;
      }
      const orders = local.orders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) { orders[idx].status = "completado"; orders[idx].readyForPayout = true; local.setOrders(orders); }
    },

    async approvePayout(id) {
      const now = Date.now();
      if (mode === "firebase") {
        await fbDb.collection("orders").doc(id).update({ released: true, payoutApproved: true, payoutDate: now });
        return;
      }
      const orders = local.orders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) { orders[idx].released = true; orders[idx].payoutApproved = true; orders[idx].payoutDate = now; local.setOrders(orders); }
    },

    async updateShipping(id, carrier, trackingNumber) {
      if (mode === "firebase") {
        await fbDb.collection("orders").doc(id).update({ carrier, trackingNumber, status: "enviado" });
        return;
      }
      const orders = local.orders();
      const idx = orders.findIndex(o => o.id === id);
      if (idx >= 0) { orders[idx].carrier = carrier; orders[idx].trackingNumber = trackingNumber; orders[idx].status = "enviado"; local.setOrders(orders); }
    },

    async clearOrders() {
      if (mode === "firebase") {
        const snap = await fbDb.collection("orders").get();
        const batch = fbDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        return;
      }
      local.setOrders([]);
    },
  };

  window.Data = Data;
  window.DataMode = mode;
})();
