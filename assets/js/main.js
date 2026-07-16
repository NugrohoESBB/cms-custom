// ============================================================
// STATE
// ============================================================
let activeCategory = "all";
let searchQuery = "";
let activeProduct = null;
let modalQty = 1;

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
	renderCategoryChips();
	renderProducts();
	bindGlobalEvents();
	lucide.createIcons();
	gsap.from("#productGrid .product-card", {
		opacity: 0,
		y: 16,
		duration: 0.5,
		stagger: 0.04,
		ease: "power2.out",
	});
});

// ============================================================
// RENDER: CATEGORY CHIPS
// ============================================================
function renderCategoryChips() {
	const wrap = document.getElementById("categoryChips");
	wrap.innerHTML = CATEGORIES.map(
		(c) => `
    <button class="chip ${c.id === activeCategory ? "active" : ""}" data-cat="${c.id}">${c.label}</button>
  `,
	).join("");

	wrap.querySelectorAll(".chip").forEach((btn) => {
		btn.addEventListener("click", () => {
			activeCategory = btn.dataset.cat;
			renderCategoryChips();
			renderProducts(true);
		});
	});
}

// ============================================================
// RENDER: PRODUCT GRID
// ============================================================
function getFilteredProducts() {
	return PRODUCTS.filter((p) => {
		const matchCat = activeCategory === "all" || p.category === activeCategory;
		const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
		return matchCat && matchSearch;
	});
}

function renderProducts(animate) {
	const grid = document.getElementById("productGrid");
	const empty = document.getElementById("emptyState");
	const list = getFilteredProducts();

	if (list.length === 0) {
		grid.innerHTML = "";
		empty.classList.remove("hidden");
		empty.classList.add("flex");
		return;
	}
	empty.classList.add("hidden");
	empty.classList.remove("flex");

	grid.innerHTML = list
		.map(
			(p) => `
    <div class="product-card" data-id="${p.id}">
      <div class="product-thumb">
        <i data-lucide="${p.icon}" class="w-9 h-9 text-primary/50"></i>
        <button class="fab-add" data-add="${p.id}" aria-label="Tambah cepat">
          <i data-lucide="plus" class="w-[18px] h-[18px]"></i>
        </button>
      </div>
      <div class="p-3.5 flex flex-col gap-1 flex-1">
        <p class="text-[11px] font-semibold text-primary/80 uppercase tracking-wide">${p.categoryLabel}</p>
        <p class="font-display font-bold text-[13.5px] leading-snug line-clamp-2">${p.name}</p>
        <p class="text-[12px] text-ink/45 mt-auto pt-1">Mulai dari</p>
        <p class="font-display font-extrabold text-[14.5px]">${formatIDR(p.price)}</p>
      </div>
    </div>
  `,
		)
		.join("");

	lucide.createIcons();

	grid.querySelectorAll(".product-card").forEach((card) => {
		card.addEventListener("click", (e) => {
			if (e.target.closest("[data-add]")) return; // handled separately
			openProductModal(card.dataset.id);
		});
	});

	grid.querySelectorAll("[data-add]").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			const product = PRODUCTS.find((p) => p.id === btn.dataset.add);
			Cart.add(product, 1, "");
			pulseFab(btn);
			updateStickyCart();
		});
	});

	if (animate) {
		gsap.fromTo("#productGrid .product-card", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "power2.out" });
	}
}

function pulseFab(btn) {
	gsap.fromTo(btn, { scale: 1 }, { scale: 1.3, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" });
}

// ============================================================
// PRODUCT MODAL
// ============================================================
function openProductModal(id) {
	activeProduct = PRODUCTS.find((p) => p.id === id);
	modalQty = 1;
	if (!activeProduct) return;

	document.getElementById("modalCategory").textContent = activeProduct.categoryLabel;
	document.getElementById("modalName").textContent = activeProduct.name;
	document.getElementById("modalPrice").textContent = formatIDR(activeProduct.price);
	document.getElementById("modalRating").textContent = activeProduct.rating.toFixed(1);
	document.getElementById("modalEta").textContent = activeProduct.eta;
	document.getElementById("modalQty").textContent = modalQty;
	document.getElementById("modalNote").value = "";
	document.getElementById("modalThumb").innerHTML = `<i data-lucide="${activeProduct.icon}" class="w-14 h-14 text-primary/40"></i>`;
	lucide.createIcons();

	const overlay = document.getElementById("productModalOverlay");
	const backdrop = document.getElementById("productModalBackdrop");
	const modal = document.getElementById("productModal");
	overlay.classList.remove("hidden");

	gsap.to(backdrop, { opacity: 1, duration: 0.25 });
	gsap.to(modal, {
		y: 0,
		opacity: 1,
		duration: 0.35,
		ease: "power3.out",
	});
	document.body.style.overflow = "hidden";
}

function closeProductModal() {
	const backdrop = document.getElementById("productModalBackdrop");
	const modal = document.getElementById("productModal");
	const overlay = document.getElementById("productModalOverlay");

	gsap.to(backdrop, { opacity: 0, duration: 0.2 });
	gsap.to(modal, {
		y: window.innerWidth < 768 ? "100%" : 16,
		opacity: window.innerWidth < 768 ? 1 : 0,
		duration: 0.25,
		ease: "power2.in",
		onComplete: () => {
			overlay.classList.add("hidden");
			document.body.style.overflow = "";
		},
	});
}

// ============================================================
// STICKY CART
// ============================================================
function updateStickyCart() {
	const count = Cart.count();
	const total = Cart.total();
	const sticky = document.getElementById("stickyCart");
	const lanjutBtn = document.getElementById("lanjutBtn");
	const badge = document.getElementById("cartBadge");
	const countLabel = document.getElementById("cartCountLabel");
	const totalLabel = document.getElementById("cartTotalLabel");

	countLabel.textContent = `${count} layanan`;

	// animate counter
	const totalObj = { val: parseInt(totalLabel.dataset.raw || "0") };
	gsap.to(totalObj, {
		val: total,
		duration: 0.4,
		ease: "power2.out",
		onUpdate: () => {
			totalLabel.textContent = formatIDR(totalObj.val);
		},
	});
	totalLabel.dataset.raw = total;

	if (count > 0) {
		badge.textContent = count;
		badge.classList.remove("hidden");
		lanjutBtn.disabled = false;
		if (sticky.classList.contains("translate-y-full")) {
			gsap.to(sticky, { y: 0, duration: 0.35, ease: "power3.out" });
			sticky.classList.remove("translate-y-full");
		}
	} else {
		badge.classList.add("hidden");
		lanjutBtn.disabled = true;
		gsap.to(sticky, { y: "100%", duration: 0.3, ease: "power2.in" });
		sticky.classList.add("translate-y-full");
	}
}

// ============================================================
// CHECKOUT MODAL
// ============================================================
function openCheckoutModal() {
	if (Cart.count() === 0) return;
	renderCheckoutSummary();

	const overlay = document.getElementById("checkoutOverlay");
	const backdrop = document.getElementById("checkoutBackdrop");
	const modal = document.getElementById("checkoutModal");
	overlay.classList.remove("hidden");

	gsap.to(backdrop, { opacity: 1, duration: 0.25 });
	gsap.to(modal, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
	document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
	const backdrop = document.getElementById("checkoutBackdrop");
	const modal = document.getElementById("checkoutModal");
	const overlay = document.getElementById("checkoutOverlay");

	gsap.to(backdrop, { opacity: 0, duration: 0.2 });
	gsap.to(modal, {
		y: window.innerWidth < 768 ? "100%" : 16,
		opacity: window.innerWidth < 768 ? 1 : 0,
		duration: 0.25,
		ease: "power2.in",
		onComplete: () => {
			overlay.classList.add("hidden");
			document.body.style.overflow = "";
		},
	});
}

function renderCheckoutSummary() {
	const list = document.getElementById("checkoutSummaryList");
	list.innerHTML = Cart.items
		.map(
			(item) => `
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <i data-lucide="box" class="w-5 h-5 text-primary/60"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold truncate">${item.name}</p>
        <p class="text-xs text-ink/50">Qty ${item.qty} &times; ${formatIDR(item.price)}</p>
      </div>
      <p class="text-sm font-bold shrink-0">${formatIDR(item.price * item.qty)}</p>
    </div>
  `,
		)
		.join("");
	lucide.createIcons();

	const subtotal = Cart.total();
	document.getElementById("checkoutSubtotal").textContent = formatIDR(subtotal);
	document.getElementById("checkoutGrandTotal").textContent = formatIDR(subtotal);
}

// ============================================================
// WHATSAPP CHECKOUT
// ============================================================
function sendToWhatsapp() {
	const name = document.getElementById("checkoutName").value.trim();
	const phone = document.getElementById("checkoutPhone").value.trim();
	const email = document.getElementById("checkoutEmail").value.trim();
	const note = document.getElementById("checkoutNote").value.trim();

	if (!name || !phone) {
		Swal.fire({
			icon: "warning",
			title: "Lengkapi data dulu",
			text: "Nama dan Nomor WhatsApp wajib diisi.",
			confirmButtonColor: "#4F46E5",
		});
		return;
	}

	let message = `Halo Nubara 👋\nSaya ingin memesan layanan berikut.\n\n━━━━━━━━━━\n`;
	Cart.items.forEach((item, idx) => {
		message += `${idx + 1}.\n${item.name}\nQty : ${item.qty}\n${formatIDR(item.price * item.qty)}\n━━━━━━━━━━\n`;
	});
	message += `\nNama : ${name}\nWhatsApp : ${phone}`;
	if (email) message += `\nEmail : ${email}`;
	message += `\nCatatan : ${note || "-"}`;
	message += `\n\nMohon informasi estimasi pengerjaan.\nTerima kasih.`;

	const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
	window.open(url, "_blank");

	Swal.fire({
		icon: "success",
		title: "Pesanan disiapkan!",
		text: "Kamu akan diarahkan ke WhatsApp.",
		confirmButtonColor: "#4F46E5",
		timer: 1800,
		showConfirmButton: false,
	});

	Cart.clear();
	updateStickyCart();
	setTimeout(closeCheckoutModal, 400);
}

// ============================================================
// GLOBAL EVENTS
// ============================================================
function bindGlobalEvents() {
	// Search
	const searchInput = document.getElementById("searchInput");
	searchInput.addEventListener("input", (e) => {
		searchQuery = e.target.value;
		renderProducts(true);
	});

	document.getElementById("searchToggleBtn").addEventListener("click", () => {
		searchInput.focus();
		searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
	});

	// Navbar shadow on scroll
	const navbar = document.getElementById("navbar");
	window.addEventListener("scroll", () => {
		navbar.classList.toggle("shadow-card", window.scrollY > 4);
	});

	// Product modal controls
	document.getElementById("closeProductModal").addEventListener("click", closeProductModal);
	document.getElementById("productModalBackdrop").addEventListener("click", closeProductModal);

	document.getElementById("modalQtyMinus").addEventListener("click", () => {
		modalQty = Math.max(1, modalQty - 1);
		document.getElementById("modalQty").textContent = modalQty;
	});
	document.getElementById("modalQtyPlus").addEventListener("click", () => {
		modalQty += 1;
		document.getElementById("modalQty").textContent = modalQty;
	});

	document.getElementById("addToCartBtn").addEventListener("click", () => {
		if (!activeProduct) return;
		const note = document.getElementById("modalNote").value.trim();
		Cart.add(activeProduct, modalQty, note);
		updateStickyCart();
		closeProductModal();

		const Toast = Swal.mixin({
			toast: true,
			position: "top",
			showConfirmButton: false,
			timer: 1500,
			timerProgressBar: true,
		});
		Toast.fire({ icon: "success", title: "Ditambahkan ke keranjang" });
	});

	// Cart icon / sticky -> open checkout directly (cart = mini review inside checkout)
	document.getElementById("cartIconBtn").addEventListener("click", openCheckoutModal);
	document.getElementById("openCartFromSticky").addEventListener("click", openCheckoutModal);
	document.getElementById("lanjutBtn").addEventListener("click", openCheckoutModal);

	// Checkout modal controls
	document.getElementById("closeCheckoutModal").addEventListener("click", closeCheckoutModal);
	document.getElementById("checkoutBackdrop").addEventListener("click", closeCheckoutModal);
	document.getElementById("sendWhatsappBtn").addEventListener("click", sendToWhatsapp);
}
