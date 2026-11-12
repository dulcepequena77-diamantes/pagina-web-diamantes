(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const views = ["home", "marketplace", "product", "sell", "login", "register", "dashboard", "admin"];

  function showView(name) {
    if (name === "admin") {
      const u = Data.getCurrentUser();
      if (!u || !u.admin) { location.hash = "#home"; return; }
    }
    views.forEach(v => {
      const el = document.getElementById("view-" + v);
      if (el) el.style.display = (v === name) ? "" : "none";
    });
    // nav active
    $$(".nav a").forEach(a => a.classList.remove("active"));
    window.scrollTo(0, 0);
    if (name === "marketplace") loadMarketplace();
    if (name === "home") loadHomeFeatured();
    if (name === "dashboard") loadDashboard();
    if (name === "admin") loadAdmin();
    if (name === "product") {
      const id = new URLSearchParams(location.hash.split("?")[1] || "").get("id");
      loadProduct(id);
    }
  }

  function route() {
    let hash = location.hash.replace("#", "") || "home";
    const [name] = hash.split("?");
    const view = views.includes(name) ? name : "home";
    showView(view);
  }

  window.addEventListener("hashchange", route);

  // ---------- Auth UI ----------
  function refreshAuthUI(user) {
    const badge = $("#userBadge");
    const btnLogin = $("#btnLogin");
    const btnRegister = $("#btnRegister");
    const btnLogout = $("#btnLogout");
    const navDash = $("#navDashboard");
    const navAdmin = $("#navAdmin");
    if (user) {
      badge.style.display = "";
      badge.textContent = user.name + (user.seller ? " (vendedor)" : "");
      btnLogin.style.display = "none";
      btnRegister.style.display = "none";
      btnLogout.style.display = "";
      navDash.style.display = "";
      navAdmin.style.display = user.admin ? "" : "none";
    } else {
      badge.style.display = "none";
      btnLogin.style.display = "";
      btnRegister.style.display = "";
      btnLogout.style.display = "none";
      navDash.style.display = "none";
      navAdmin.style.display = "none";
    }
  }

  $("#btnLogout").addEventListener("click", async () => {
    await Data.logout();
  });

  // login form
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#loginMsg");
    try {
      await Data.login($("#loginEmail").value.trim(), $("#loginPass").value);
      msg.textContent = "Bienvenido.";
      location.hash = "#dashboard";
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  // register form
  $("#registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#regMsg");
    try {
      await Data.register(
        $("#regName").value.trim(),
        $("#regEmail").value.trim(),
        $("#regPass").value,
        true
      );
      msg.textContent = "Cuenta creada.";
      location.hash = "#dashboard";
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  // ---------- Helpers ----------
  function formatPrice(n) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
  }
  function trackingLink(carrier, tracking) {
    if (!tracking) return "";
    const c = (carrier || "").toLowerCase();
    let url = "";
    if (c.includes("servientrega")) url = `https://www.servientrega.com/wps/portal/!ut/p/z1/...?guia=${encodeURIComponent(tracking)}`;
    else if (c.includes("coordinadora")) url = `https://coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastreo-de-guias/?guia=${encodeURIComponent(tracking)}`;
    else if (c.includes("interrapidisimo")) url = `https://interrapidisimo.com/rastreo-de-envios/?guia=${encodeURIComponent(tracking)}`;
    else url = `https://www.google.com/search?q=${encodeURIComponent(carrier + " rastreo " + tracking)}`;
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Rastrear envío</a>`;
  }
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function productCard(p, editable) {
    const img = p.imageUrl || "assets/logo.png";
    const logo = p.sellerLogo ? `<img src="${escapeHtml(p.sellerLogo)}" alt="" style="width:18px;height:18px;border-radius:50%;vertical-align:middle;margin-right:4px" />` : "";
    const editBtn = editable ? `<button class="btn btn-sm btn-outline" data-edit="${p.id}" style="margin-top:6px">Editar</button>` : "";
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-img" data-src="${escapeHtml(img)}" style="background-image:url('${escapeHtml(img)}');cursor:pointer"></div>
        <div class="product-body">
          <span class="product-cat">${escapeHtml(p.category)}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="product-price">${formatPrice(p.price)}</p>
          <p class="muted">Stock: ${p.stock != null ? p.stock : "—"}</p>
          <p class="product-seller">${logo}por ${escapeHtml(p.sellerName || "vendedor")}</p>
          ${editable ? editBtn : `<button class="btn btn-sm btn-outline" data-add="${p.id}" style="margin-top:6px">Agregar al carrito</button>`}
          <a href="#product?id=${p.id}" class="card-link">Ver detalle &rarr;</a>
        </div>
      </article>`;
  }

  // ---------- Home featured ----------
  async function loadHomeFeatured() {
    const grid = $("#homeFeatured");
    if (!grid) return;
    const products = await Data.getProducts({ sort: "newest" });
    const featured = products;
    grid.innerHTML = featured.length ? featured.map(productCard).join("") : "<p class='empty'>Aún no hay productos. ¡Sé el primero en publicar!</p>";
  }

  // ---------- Marketplace ----------
  async function loadMarketplace() {
    const grid = $("#marketplaceGrid");
    const empty = $("#marketplaceEmpty");
    const q = $("#searchInput").value.trim();
    const category = $("#categoryFilter").value;
    const sort = $("#sortFilter").value;
    const products = await Data.getProducts({ q, category, sort });
    grid.innerHTML = products.map(productCard).join("");
    empty.style.display = products.length ? "none" : "";
  }
  ["searchInput", "categoryFilter", "sortFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", loadMarketplace);
    if (el) el.addEventListener("change", loadMarketplace);
  });

  // ---------- Product detail ----------
  async function loadProduct(id) {
    const container = $("#productDetail");
    if (!id) { container.innerHTML = "<p>Producto no encontrado.</p>"; return; }
    const p = await Data.getProduct(id);
    if (!p) { container.innerHTML = "<p>Producto no encontrado.</p>"; return; }
    const commission = +(p.price * Data.commissionRate).toFixed(2);
    const sellerNet = +(p.price - commission).toFixed(2);
    const img = p.imageUrl || "assets/logo.png";
    const user = Data.getCurrentUser();
    const isOwner = user && user.uid === p.sellerId;
    const userOrders = user ? await Data.getOrders({ buyerId: user.uid }) : [];
    const userOrder = userOrders.find(o => o.productId === id && !o.released);
    const confirmBtnHtml = userOrder ? `<button class="btn btn-gold" id="confirmBtn">Confirmar satisfacción</button>` : "";
    const shippingHtml = userOrder && userOrder.carrier ? `<p class="muted">Transportadora: ${escapeHtml(userOrder.carrier)} | Guía: ${escapeHtml(userOrder.trackingNumber || "")} ${trackingLink(userOrder.carrier, userOrder.trackingNumber)}</p>` : "";
    container.innerHTML = `
      <div class="grid-2">
        <div class="product-detail-img" data-src="${escapeHtml(img)}" style="background-image:url('${escapeHtml(img)}');cursor:pointer"></div>
        <div>
          <span class="product-cat">${escapeHtml(p.category)}</span>
          <h2>${escapeHtml(p.title)}</h2>
          <p class="product-price big">${formatPrice(p.price)}</p>
          <p class="muted">Disponibles: ${p.stock != null ? p.stock : "—"}</p>
          <p>${escapeHtml(p.description)}</p>
          <p class="muted">Vendedor: ${p.sellerLogo ? `<img src="${escapeHtml(p.sellerLogo)}" alt="" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:4px" />` : ""}${escapeHtml(p.sellerName || "—")}</p>
          ${shippingHtml}
          <div class="commission-box">
            <p>Comisión plataforma (${Math.round(Data.commissionRate * 100)}%): ${formatPrice(commission)}</p>
            <p>Neto vendedor: ${formatPrice(sellerNet)}</p>
          </div>
          <div class="hero-actions" style="justify-content:flex-start;margin-top:18px">
            <button class="btn btn-gold" id="buyBtn">Comprar / Contactar</button>
            <button class="btn btn-outline" id="payBtn">Pagar ahora (demo)</button>
            <button class="btn btn-outline" id="addCartBtn">Agregar al carrito</button>
            ${confirmBtnHtml}
            ${isOwner ? `<button class="btn btn-outline" id="deleteBtn">Eliminar</button>` : ""}
          </div>
          <p class="form-msg" id="detailMsg"></p>
        </div>
      </div>`;
    if ((p.stock || 0) <= 0) {
      const bb = $("#buyBtn"); if (bb) { bb.disabled = true; bb.textContent = "Agotado"; }
      const pb = $("#payBtn"); if (pb) { pb.disabled = true; }
      const ab = $("#addCartBtn"); if (ab) { ab.disabled = true; }
    }
    $("#buyBtn").addEventListener("click", async () => {
      const buyerName = user ? user.name : prompt("Tu nombre:") || "Anónimo";
      if (buyerName === null) return;
      try {
        const order = await Data.createOrder(p.id, buyerName);
        await Data.decrementStock(p.id, 1);
        $("#detailMsg").textContent = "¡Pedido registrado! El vendedor será notificado.";
        sendOrderEmail(order);
        updateNotifBadge();
      } catch (err) { $("#detailMsg").textContent = err.message; }
    });
    const payBtn = $("#payBtn");
    if (payBtn) {
      payBtn.addEventListener("click", async () => {
        const buyerName = user ? user.name : prompt("Tu nombre:") || "Anónimo";
        if (buyerName === null) return;
        try {
          const order = await Data.createOrder(p.id, buyerName);
        await Data.decrementStock(p.id, 1);
          await Data.updateOrderStatus(order.id, "pagado");
          $("#detailMsg").textContent = "¡Pago simulado exitoso! Orden marcada como pagada.";
          sendOrderEmail({ ...order, status: "pagado" });
          updateNotifBadge();
        } catch (err) { $("#detailMsg").textContent = err.message; }
      });
    }
    const confirmBtn = $("#confirmBtn");
    if (confirmBtn && userOrder) {
      confirmBtn.addEventListener("click", async () => {
        try {
          await Data.confirmSatisfaction(userOrder.id);
          $("#detailMsg").textContent = "Gracias. Fondos liberados al vendedor.";
          loadDashboard();
        } catch (err) { $("#detailMsg").textContent = err.message; }
      });
    }
    if (isOwner) {
      $("#deleteBtn").addEventListener("click", async () => {
        if (!confirm("¿Eliminar este producto?")) return;
        await Data.deleteProduct(p.id);
        location.hash = "#dashboard";
      });
    }
  }

  // ---------- Dashboard ----------
  async function loadDashboard() {
    const user = Data.getCurrentUser();
    if (!user) { location.hash = "#login"; return; }
    const logoHtml = user.storeLogo ? `<img src="${escapeHtml(user.storeLogo)}" alt="" style="width:80px;height:80px;border-radius:50%;vertical-align:middle;margin-right:8px" />` : "";
    $("#dashTitle").innerHTML = logoHtml + (user.seller ? "Panel de vendedor — " + escapeHtml(user.name) : "Panel — " + escapeHtml(user.name));
    const storeCard = $("#storeNameCard");
    if (storeCard) {
      if (user.seller) {
        storeCard.style.display = "";
        const inp = $("#storeNameInput");
        if (inp) inp.value = user.storeName || "";
      } else {
        storeCard.style.display = "none";
      }
    }
    const logoCard = $("#storeLogoCard");
    if (logoCard) {
      if (user.seller) {
        logoCard.style.display = "";
        const preview = $("#storeLogoPreview");
        if (preview) {
          preview.innerHTML = user.storeLogo ? `<img src="${escapeHtml(user.storeLogo)}" alt="Logo" style="max-width:120px;max-height:120px;border-radius:8px" />` : "<p class='muted'>Sin logo</p>";
        }
      } else {
        logoCard.style.display = "none";
      }
    }
    // stats
    const myProducts = await Data.getProducts({ sellerId: user.uid });
    const myOrders = await Data.getOrders({ sellerId: user.uid });
    const totalSales = myOrders.reduce((s, o) => s + o.price, 0);
    const totalCommission = myOrders.reduce((s, o) => s + o.commission, 0);
    const pendingFunds = myOrders.filter(o => !o.released).reduce((s, o) => s + o.sellerNet, 0);
    const releasedFunds = myOrders.filter(o => o.released).reduce((s, o) => s + o.sellerNet, 0);
    $("#dashStats").innerHTML = `
      <div class="stat-box"><span class="stat-num">${myProducts.length}</span><span class="stat-label">Productos</span></div>
      <div class="stat-box"><span class="stat-num">${myOrders.length}</span><span class="stat-label">Ventas</span></div>
      <div class="stat-box"><span class="stat-num">${formatPrice(totalNet)}</span><span class="stat-label">Ganancia neta</span></div>`;
    // my products
    $("#myProducts").innerHTML = myProducts.length ? myProducts.map(p => productCard(p, true)).join("") : "<p class='empty'>Aún no tienes productos.</p>";
    // my sales
    const salesEl = $("#mySales");
    if (!myOrders.length) { salesEl.innerHTML = "<p class='empty'>Sin ventas aún.</p>"; }
    else {
      salesEl.innerHTML = `
        <table class="table">
          <thead><tr><th>Producto</th><th>Precio</th><th>Comisión</th><th>Neto</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            ${myOrders.map(o => `
              <tr>
                <td>${escapeHtml(o.productTitle)}</td>
                <td>${formatPrice(o.price)}</td>
                <td>${formatPrice(o.commission)}</td>
                <td>${formatPrice(o.sellerNet)}</td>
                <td>
                  <select data-order="${o.id}" class="status-select">
                    <option value="pendiente" ${o.status === "pendiente" ? "selected" : ""}>Pendiente</option>
                    <option value="pagado" ${o.status === "pagado" ? "selected" : ""}>Pagado</option>
                    <option value="enviado" ${o.status === "enviado" ? "selected" : ""}>Enviado</option>
                    <option value="completado" ${o.status === "completado" ? "selected" : ""}>Completado</option>
                  </select>
                </td>
		                <td>
		                  ${o.status === "pagado" ? `<button class="btn btn-sm btn-outline" data-ship="${o.id}">Gestionar envio</button>` : ""}
		                  ${o.carrier ? `<div class="muted">Transportadora: ${escapeHtml(o.carrier)}<br/>Guia: ${escapeHtml(o.trackingNumber || "")}</div>` : ""}
		                  ${(!o.released && (o.status === "enviado" || o.status === "entregado")) ? `<button class="btn btn-sm btn-outline" data-deliver="${o.id}">Marcar entregado</button>` : ""}
		                  ${o.status === "entregado" && !o.released ? `<span class="muted">Libera: ${new Date(o.autoReleaseAt).toLocaleDateString("es-CO")}</span>` : ""}
		                </td>
		              </tr>`).join("")}
          </tbody>
        </table>`;
      $$(".status-select").forEach(sel => {
        sel.addEventListener("change", async () => {
          await Data.updateOrderStatus(sel.dataset.order, sel.value);
        });
      });
      6391("[data-deliver]").forEach(btn => {
        btn.addEventListener("click", async () => {
          await Data.markDelivered(btn.dataset.deliver);
          loadDashboard();
        });
      });
      $$("[data-ship]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const carrier = prompt("Transportadora (ej. Servientrega, Coordinadora, Interrapidisimo):");
          if (!carrier) return;
          const tracking = prompt("Numero de guia:");
          if (!tracking) return;
          await Data.updateShipping(btn.dataset.ship, carrier.trim(), tracking.trim());
          loadDashboard();
        });
      });
    }
    // totals hint
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.style.marginTop = "10px";
    hint.textContent = `Total vendido: ${formatPrice(totalSales)} | Comisiones: ${formatPrice(totalCommission)} | Neto: ${formatPrice(totalNet)} | Fondos pendientes: ${formatPrice(pendingFunds)} | Fondos liberados: ${formatPrice(releasedFunds)}`;
    salesEl.appendChild(hint);
    updateNotifBadge();
  }

  // product form
  $("#productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#productMsg");
    const user = Data.getCurrentUser();
    if (!user) { msg.textContent = "Debes iniciar sesión."; return; }
    try {
      let imageUrl = $("#pImage").value.trim();
      const file = $("#pFile").files[0];
      if (file) {
        imageUrl = await readFileAsDataURL(file);
      }
      await Data.createProduct({
        title: $("#pTitle").value.trim(),
        category: $("#pCategory").value,
        price: $("#pPrice").value,
        stock: $("#pStock").value,
        description: $("#pDesc").value.trim(),
        imageUrl,
      });
      msg.textContent = "Producto publicado.";
      $("#productForm").reset();
      const pv = $("#pImagePreview"); if (pv) pv.innerHTML = "";
      loadDashboard();
    } catch (err) { msg.textContent = err.message; }
  });

  // store name form
  const storeForm = $("#storeNameForm");
  if (storeForm) {
    storeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#storeNameMsg");
      try {
        await Data.updateStoreName($("#storeNameInput").value.trim());
        msg.textContent = "Nombre de tienda guardado.";
        loadDashboard();
      } catch (err) { msg.textContent = err.message; }
    });
  }

  // store logo form
  const logoForm = $("#storeLogoForm");
  if (logoForm) {
    logoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#storeLogoMsg");
      try {
        const file = $("#storeLogoFile").files[0];
        let logo = "";
        if (file) {
          logo = await readFileAsDataURL(file, 200);
        } else {
          // keep existing if no new file
          const u = Data.getCurrentUser();
          logo = u ? (u.storeLogo || "") : "";
        }
        await Data.updateStoreLogo(logo);
        msg.textContent = "Logo guardado.";
        loadDashboard();
      } catch (err) { msg.textContent = err.message; }
    });
  }

  // product image preview
  function updateProductImagePreview() {
    const preview = $("#pImagePreview");
    if (!preview) return;
    const url = $("#pImage").value.trim();
    const file = $("#pFile").files[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => { preview.innerHTML = `<img src="${r.result}" alt="Vista previa" style="max-width:160px;max-height:160px;border-radius:8px" />`; };
      r.readAsDataURL(file);
    } else if (url) {
      preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Vista previa" style="max-width:160px;max-height:160px;border-radius:8px" onerror="this.style.display='none'" />`;
    } else {
      preview.innerHTML = "";
    }
  }
  const pFileEl = $("#pFile");
  const pImageEl = $("#pImage");
  if (pFileEl) pFileEl.addEventListener("change", updateProductImagePreview);
  if (pImageEl) pImageEl.addEventListener("input", updateProductImagePreview);

  // lightbox
  function openLightbox(src) {
    const lb = $("#lightbox");
    if (!lb) return;
    $("#lightboxImg").src = src;
    lb.style.display = "flex";
  }
  const lbClose = $("#lightboxClose");
  if (lbClose) lbClose.addEventListener("click", () => { $("#lightbox").style.display = "none"; });
  const lb = $("#lightbox");
  if (lb) lb.addEventListener("click", (e) => { if (e.target.id === "lightbox") lb.style.display = "none"; });
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-src]");
    if (el && (el.classList.contains("product-img") || el.classList.contains("product-detail-img"))) {
      openLightbox(el.dataset.src);
    }
  });

  // sell product form
  const sellForm = $("#sellProductForm");
  if (sellForm) {
    sellForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#sellMsg");
      const user = Data.getCurrentUser();
      if (!user) { msg.textContent = "Debes iniciar sesión."; return; }
      try {
        let imageUrl = $("#sellImage").value.trim();
        const file = $("#sellFile").files[0];
        if (file) imageUrl = await readFileAsDataURL(file);
        await Data.createProduct({
          title: $("#sellTitle").value.trim(),
          category: $("#sellCategory").value,
          price: $("#sellPrice").value,
          stock: $("#sellStock").value,
          description: $("#sellDesc").value.trim(),
          imageUrl,
        });
        msg.textContent = "Producto publicado.";
        sellForm.reset();
        const pv = $("#sellImagePreview"); if (pv) pv.innerHTML = "";
        loadDashboard();
      } catch (err) { msg.textContent = err.message; }
    });
  }

  function updateSellImagePreview() {
    const preview = $("#sellImagePreview");
    if (!preview) return;
    const url = $("#sellImage").value.trim();
    const file = $("#sellFile").files[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => { preview.innerHTML = `<img src="${r.result}" alt="Vista previa" style="max-width:160px;max-height:160px;border-radius:8px" />`; };
      r.readAsDataURL(file);
    } else if (url) {
      preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Vista previa" style="max-width:160px;max-height:160px;border-radius:8px" onerror="this.style.display='none'" />`;
    } else {
      preview.innerHTML = "";
    }
  }
  const sellFileEl = $("#sellFile");
  const sellImageEl = $("#sellImage");
  if (sellFileEl) sellFileEl.addEventListener("change", updateSellImagePreview);
  if (sellImageEl) sellImageEl.addEventListener("input", updateSellImagePreview);

  $$(".cat-card").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      const sel = $("#sellCategory");
      if (sel) sel.value = cat;
      const form = $("#sellProductForm");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  function readFileAsDataURL(file, maxSize) {
    maxSize = maxSize || 800;
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxSize || h > maxSize) {
            const scale = maxSize / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          try { res(canvas.toDataURL("image/jpeg", 0.7)); }
          catch (e) { res(reader.result); }
        };
        img.onerror = () => res(reader.result);
        img.src = reader.result;
      };
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  // ---------- Admin ----------
  async function loadAdmin() {
    const user = Data.getCurrentUser();
    if (!user) { location.hash = "#login"; return; }
    if (!user.admin) { location.hash = "#home"; return; }
    const orders = await Data.getOrders({});
    const visits = await Data.getVisits();
    const totalSales = orders.reduce((s, o) => s + o.price, 0);
    const totalCommission = orders.reduce((s, o) => s + o.commission, 0);
    const totalNet = orders.reduce((s, o) => s + o.sellerNet, 0);
    $("#adminStats").innerHTML = `
      <div class="stat-box"><span class="stat-num">${visits}</span><span class="stat-label">Visitas</span></div>
      <div class="stat-box"><span class="stat-num">${orders.length}</span><span class="stat-label">Compras/Pedidos</span></div>
      <div class="stat-box"><span class="stat-num">${formatPrice(totalSales)}</span><span class="stat-label">Ventas totales</span></div>
      <div class="stat-box"><span class="stat-num">${formatPrice(totalCommission)}</span><span class="stat-label">Comisiones</span></div>
      <div class="stat-box"><span class="stat-num">${formatPrice(totalNet)}</span><span class="stat-label">Pagado a vendedores</span></div>`;
    const el = $("#adminSales");
    if (!orders.length) { el.innerHTML = "<p class='empty'>Sin ventas aún.</p>"; }
    else {
      el.innerHTML = `
      <table class="table">
        <thead><tr><th>Fecha</th><th>Producto</th><th>Vendedor</th><th>Comprador</th><th>Precio</th><th>Comisión</th><th>Neto</th><th>Estado</th></tr></thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>${new Date(o.createdAt).toLocaleDateString("es-CO")}</td>
              <td>${escapeHtml(o.productTitle)}</td>
              <td>${escapeHtml(o.sellerName)}</td>
              <td>${escapeHtml(o.buyerName)}</td>
              <td>${formatPrice(o.price)}</td>
              <td>${formatPrice(o.commission)}</td>
              <td>${formatPrice(o.sellerNet)}</td>
              <td>${escapeHtml(o.status)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    }
    // users
    const usersEl = $("#adminUsers");
    if (usersEl) {
      const users = await Data.getUsers();
      usersEl.innerHTML = users.length ? `<table class="table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead><tbody>${users.map(u => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${u.admin ? "Admin" : (u.seller ? "Vendedor/Comprador" : "Comprador")}</td></tr>`).join("")}</tbody></table>` : "<p class='empty'>Sin usuarios.</p>";
    }
    // payouts
    const payoutsEl = $("#adminPayouts");
    if (payoutsEl) {
      const readyOrders = orders.filter(o => o.readyForPayout && !o.released);
      payoutsEl.innerHTML = readyOrders.length ? `<table class="table"><thead><tr><th>Producto</th><th>Vendedor</th><th>Neto</th><th>Acción</th></tr></thead><tbody>${readyOrders.map(o => `<tr><td>${escapeHtml(o.productTitle)}</td><td>${escapeHtml(o.sellerName)}</td><td>${formatPrice(o.sellerNet)}</td><td><button class="btn btn-sm btn-gold" data-approve="${o.id}">Aprobar giro</button></td></tr>`).join("")}</tbody></table>` : "<p class='empty'>Sin giros pendientes.</p>";
      $$("[data-approve]").forEach(btn => {
        btn.addEventListener("click", async () => {
          await Data.approvePayout(btn.dataset.approve);
          loadAdmin();
        });
      });
    }
  }

  // ---------- Notifications ----------
  async function updateNotifBadge() {
    const user = Data.getCurrentUser();
    const badge = $("#notifCount");
    if (!badge) return;
    if (!user || !user.seller) { badge.style.display = "none"; return; }
    try {
      const orders = await Data.getOrders({ sellerId: user.uid });
      const pending = orders.filter(o => o.status === "pendiente").length;
      if (pending > 0) { badge.textContent = pending; badge.style.display = "inline-block"; }
      else { badge.style.display = "none"; }
    } catch (e) { badge.style.display = "none"; }
  }

  async function sendOrderEmail(order) {
    if (!order.sellerEmail) return;
    const cfg = window.EMAILJS_CONFIG;
    if (cfg && cfg.serviceId && typeof emailjs !== "undefined") {
      try {
        emailjs.init(cfg.publicKey);
        await emailjs.send(cfg.serviceId, cfg.templateId, {
          to_email: order.sellerEmail,
          seller_name: order.sellerName,
          product: order.productTitle,
          price: order.price,
          buyer: order.buyerName,
          status: order.status
        });
        return;
      } catch (e) { console.warn("EmailJS error", e); }
    }
    // Fallback automático con FormSubmit (sin configuración)
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(order.sellerEmail)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: `Nueva venta en Diamantes - ${order.productTitle}`,
          seller: order.sellerName,
          product: order.productTitle,
          price: order.price,
          buyer: order.buyerName,
          status: order.status
        })
      });
    } catch (e) { console.warn("FormSubmit error", e); }
  }

  const clearBtn = $("#clearOrdersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar todos los pedidos/ventas?")) return;
      await Data.clearOrders();
      loadAdmin();
      updateNotifBadge();
    });
  }

  // ---------- Cart ----------
  function getCart() { try { return JSON.parse(localStorage.getItem("dw_cart") || "[]"); } catch (e) { return []; } }
  function saveCart(cart) { localStorage.setItem("dw_cart", JSON.stringify(cart)); }
  function updateCartCount() {
    const el = $("#cartCount");
    if (!el) return;
    const count = getCart().reduce((s, i) => s + i.qty, 0);
    el.textContent = count;
  }
  function addToCart(productId) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) item.qty++;
    else cart.push({ id: productId, qty: 1 });
    saveCart(cart);
    updateCartCount();
    renderCart();
  }
  function removeFromCart(productId) {
    saveCart(getCart().filter(i => i.id !== productId));
    updateCartCount();
    renderCart();
  }
  async function renderCart() {
    const itemsEl = $("#cartItems");
    const totalEl = $("#cartTotal");
    if (!itemsEl) return;
    const cart = getCart();
    if (!cart.length) { itemsEl.innerHTML = "<p class='empty'>El carrito está vacío.</p>"; if (totalEl) totalEl.textContent = ""; return; }
    const products = await Data.getProducts({});
    const byId = Object.fromEntries(products.map(p => [p.id, p]));
    let total = 0;
    itemsEl.innerHTML = cart.map(i => {
      const p = byId[i.id];
      if (!p) return "";
      total += p.price * i.qty;
      const img = p.imageUrl || "assets/logo.png";
      return `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <img src="${escapeHtml(img)}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:6px" />
        <div style="flex:1">
          <strong>${escapeHtml(p.title)}</strong><br/>
          <span class="muted">${formatPrice(p.price)} x ${i.qty}</span>
        </div>
        <button class="btn btn-sm btn-outline" data-remove="${p.id}">Quitar</button>
      </div>`;
    }).join("");
    if (totalEl) totalEl.textContent = `Total: ${formatPrice(total)}`;
    $$("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.remove));
    });
  }
  const btnCart = $("#btnCart");
  if (btnCart) {
    btnCart.addEventListener("click", (e) => {
      e.preventDefault();
      const m = $("#cartModal");
      if (m) { m.style.display = "flex"; renderCart(); }
    });
  }
  const cartClose = $("#cartClose");
  if (cartClose) cartClose.addEventListener("click", () => { $("#cartModal").style.display = "none"; });
  const cartModal = $("#cartModal");
  if (cartModal) cartModal.addEventListener("click", (e) => { if (e.target.id === "cartModal") cartModal.style.display = "none"; });
  const cartCheckout = $("#cartCheckout");
  if (cartCheckout) {
    cartCheckout.addEventListener("click", async () => {
      const msg = $("#cartMsg");
      const user = Data.getCurrentUser();
      const buyerName = user ? user.name : (prompt("Tu nombre:") || "Anónimo");
      if (buyerName === null) return;
      const cart = getCart();
      if (!cart.length) { msg.textContent = "Carrito vacío."; return; }
      const products = await Data.getProducts({});
      const byId = Object.fromEntries(products.map(p => [p.id, p]));
      try {
        for (const i of cart) {
          const p = byId[i.id];
          if (!p) continue;
          await Data.decrementStock(p.id, i.qty);
          for (let q = 0; q < i.qty; q++) {
            const order = await Data.createOrder(p.id, buyerName);
            await Data.updateOrderStatus(order.id, "pagado");
            sendOrderEmail({ ...order, status: "pagado" });
          }
        }
        saveCart([]);
        updateCartCount();
        renderCart();
        msg.textContent = "¡Pago simulado exitoso! Carrito vaciado.";
        updateNotifBadge();
      } catch (err) { msg.textContent = err.message; }
    });
  }
  // delegation for add-to-cart buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (btn) addToCart(btn.dataset.add);
  });
  const addCartBtn = $("#addCartBtn");
  if (addCartBtn) {
    addCartBtn.addEventListener("click", () => {
      const id = new URLSearchParams(location.hash.split("?")[1] || "").get("id");
      if (id) addToCart(id);
    });
  }
  updateCartCount();

  const dashLogout = $("#dashLogout");
  if (dashLogout) {
    dashLogout.addEventListener("click", async () => {
      await Data.logout();
      location.hash = "#home";
    });
  }
  // ---------- Edit product ----------
  let currentEditId = null;
  async function openEditModal(id) {
    const p = await Data.getProduct(id);
    if (!p) return;
    currentEditId = id;
    $("#editTitle").value = p.title || "";
    $("#editCategory").value = p.category || "";
    $("#editPrice").value = p.price || "";
    $("#editStock").value = p.stock != null ? p.stock : "";
    $("#editDesc").value = p.description || "";
    $("#editImage").value = p.imageUrl || "";
    $("#editMsg").textContent = "";
    const m = $("#editModal");
    if (m) m.style.display = "flex";
  }
  const editClose = $("#editClose");
  if (editClose) editClose.addEventListener("click", () => { $("#editModal").style.display = "none"; currentEditId = null; });
  const editModal = $("#editModal");
  if (editModal) editModal.addEventListener("click", (e) => { if (e.target.id === "editModal") { editModal.style.display = "none"; currentEditId = null; } });
  const editForm = $("#editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#editMsg");
      if (!currentEditId) return;
      try {
        await Data.updateProduct(currentEditId, {
          title: $("#editTitle").value.trim(),
          category: $("#editCategory").value,
          price: Number($("#editPrice").value),
          stock: Number($("#editStock").value),
          description: $("#editDesc").value.trim(),
          imageUrl: $("#editImage").value.trim(),
        });
        msg.textContent = "Producto actualizado.";
        $("#editModal").style.display = "none";
        currentEditId = null;
        loadDashboard();
      } catch (err) { msg.textContent = err.message; }
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-edit]");
    if (btn) openEditModal(btn.dataset.edit);
  });

  Data.init().then(() => {
    Data.onAuthChange(refreshAuthUI);
    route();
    updateNotifBadge();
  });

  // mobile nav
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  if (navToggle) navToggle.addEventListener("click", () => nav.classList.toggle("open"));
  $$(".nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Theme (dark/light) ----------
  const THEME_KEY = "dw_theme";
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = theme === "light" ? "🌙" : "☀️";
  }
  const savedTheme = (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY)) || "dark";
  applyTheme(savedTheme);
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });
  }

  // ---------- Parallax hero banner ----------
  const heroBg = document.querySelector(".hero-bg");
  const heroSection = document.querySelector(".hero");
  function updateParallax() {
    if (!heroBg || !heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
    const offset = window.scrollY * 0.35;
    heroBg.style.transform = "translateY(" + offset + "px)";
  }
  if (heroBg) {
    window.addEventListener("scroll", updateParallax, { passive: true });
    updateParallax();
  }
})();
