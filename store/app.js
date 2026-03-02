const API_BASE = 'http://localhost/newpos/api/public';
const APP_BASE = 'http://localhost/newpos/api/public'; // For images

const state = {
    config: null,
    products: [],
    categories: [],
    cart: [],
    user: null,
    token: null,
    currentCategory: null,
    searchQuery: '',
    selectedProduct: null
};

const API = {
    async get(endpoint) {
        const headers = {};
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
        const res = await fetch(`${API_BASE}${endpoint}`, { headers });
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
    },
    async post(endpoint, data) {
        const headers = { 'Content-Type': 'application/json' };
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) throw { status: res.status, ...json };
        return json;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

const Store = {
    async init() {
        this.loadLocalAuth();
        this.loadLocalCart();
        UI.renderAuthNav();
        UI.updateCartBadge();

        try {
            await this.loadConfig();
            await this.loadCategories();
            await this.loadProducts();
            this.initGoogleAuth();
        } catch (e) {
            console.error('Initial load error:', e);
            Swal.fire('Error', 'No se pudo conectar con la tienda. Intenta recargar.', 'error');
        }
    },

    loadLocalAuth() {
        try {
            const token = localStorage.getItem('store_token');
            const user = localStorage.getItem('store_user');
            if (token && user) {
                state.token = token;
                state.user = JSON.parse(user);
            }
        } catch (e) {
            console.warn('Storage access blocked:', e);
        }
    },

    loadLocalCart() {
        try {
            const cart = localStorage.getItem('store_cart');
            if (cart) state.cart = JSON.parse(cart);
        } catch (e) {
            console.warn('Storage access blocked:', e);
        }
    },

    async loadConfig() {
        state.config = await API.get('/p/store-info');
        document.title = state.config.nombre || 'Tienda Online';
        document.getElementById('store-name').textContent = state.config.nombre || 'Mi Tienda';
        if (state.config.slogan) {
            document.getElementById('store-slogan').textContent = state.config.slogan;
        }
        if (state.config.logo_url) {
            const logo = document.getElementById('store-logo');
            logo.src = state.config.logo_url;
            logo.classList.remove('hidden');
        }
        document.getElementById('footer-text').innerHTML = `&copy; ${new Date().getFullYear()} ${state.config.nombre || 'Reservados'}. All rights reserved.`;

        // Configure CSS variables based on store setup later if needed
    },

    async loadCategories() {
        state.categories = await API.get('/p/categories');
        UI.renderCategories();
    },

    async loadProducts() {
        let endpoint = '/p/products';
        const params = new URLSearchParams();
        if (state.currentCategory) params.append('category_id', state.currentCategory);
        if (state.searchQuery) params.append('q', state.searchQuery);

        if (params.toString()) endpoint += `?${params.toString()}`;

        console.log('Fetching products from:', endpoint);
        state.products = await API.get(endpoint);
        console.log('Products received:', state.products);
        UI.renderProducts();
    },

    filterByCategory(id) {
        state.currentCategory = id;
        state.searchQuery = '';
        document.getElementById('search-input').value = '';
        const cat = state.categories.find(c => c.id == id);
        document.getElementById('current-category-title').textContent = cat ? cat.nombre : 'Todos los Productos';
        UI.renderCategories();
        this.loadProducts();
    },

    handleSearch(e) {
        state.searchQuery = e.target.value;
        if (state.searchQuery) state.currentCategory = null; // Clear cat on search

        // Debounce
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            document.getElementById('current-category-title').textContent = state.searchQuery ? `Resultados para "${state.searchQuery}"` : 'Todos los Productos';
            UI.renderCategories();
            this.loadProducts();
        }, 300);
    },

    initGoogleAuth() {
        if (!state.config || !state.config.google_client_id) return;

        const container = document.getElementById('google-btn-container');
        if (!container) return;

        window.onload = function () {
            google.accounts.id.initialize({
                client_id: state.config.google_client_id,
                callback: Auth.handleGoogleResponse
            });
            google.accounts.id.renderButton(container, { theme: "outline", size: "large", width: '100%' });
        };
    },

    openProduct(id) {
        state.selectedProduct = state.products.find(p => p.id === id);
        if (!state.selectedProduct) return;
        UI.showProductModal();
    },

    logout() {
        state.user = null;
        state.token = null;
        try {
            localStorage.removeItem('store_token');
            localStorage.removeItem('store_user');
        } catch (e) { }
        UI.renderAuthNav();
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: 'Sesión cerrada', showConfirmButton: false, timer: 2000
        });
    },

    proceedToCheckout() {
        if (state.cart.length === 0) return;
        if (!state.user) {
            UI.toggleCart(false);
            UI.showAuthModal();
            Swal.fire({
                toast: true, position: 'top-end', icon: 'info',
                title: 'Inicia sesión para pagar', showConfirmButton: false, timer: 3000
            });
            return;
        }
        UI.toggleCart(false);
        UI.showCheckoutModal();
    }
};

const Cart = {
    add(product, qty = 1) {
        const item = state.cart.find(i => i.id === product.id);
        if (item) {
            item.qty += parseInt(qty);
        } else {
            state.cart.push({ ...product, qty: parseInt(qty) });
        }
        this.save();
        UI.updateCartBadge();
        UI.renderCart();
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: 'Agregado al carrito', showConfirmButton: false, timer: 1500
        });
    },
    updateQty(id, change) {
        const item = state.cart.find(i => i.id === id);
        if (!item) return;
        item.qty += change;
        if (item.qty <= 0) {
            this.remove(id);
        } else {
            this.save();
            UI.renderCart();
        }
    },
    remove(id) {
        state.cart = state.cart.filter(i => i.id !== id);
        this.save();
        UI.updateCartBadge();
        UI.renderCart();
    },
    clear() {
        state.cart = [];
        this.save();
        UI.updateCartBadge();
        UI.renderCart();
    },
    save() {
        try {
            localStorage.setItem('store_cart', JSON.stringify(state.cart));
        } catch (e) { }
    },
    getTotal() {
        return state.cart.reduce((sum, item) => sum + (item.precio_base * item.qty), 0);
    }
};

const Auth = {
    setSession(data) {
        state.user = data.user;
        state.token = data.token;
        try {
            localStorage.setItem('store_token', data.token);
            localStorage.setItem('store_user', JSON.stringify(data.user));
        } catch (e) { }
        UI.closeModal('auth');
        UI.renderAuthNav();

        Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: `¡Hola ${data.user.nombre}!`, showConfirmButton: false, timer: 2000
        });

        if (state.cart.length > 0) {
            UI.showCheckoutModal();
        }
    },
    async handleLogin(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        try {
            UI.setLoading(e.target.querySelector('button'), true);
            const res = await API.post('/p/auth/login', data);
            this.setSession(res);
        } catch (err) {
            Swal.fire('Error', err.error || 'Credenciales inválidas', 'error');
        } finally {
            UI.setLoading(e.target.querySelector('button'), false, 'Ingresar');
        }
    },
    async handleRegister(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        try {
            UI.setLoading(e.target.querySelector('button'), true);
            const res = await API.post('/p/auth/register', data);
            this.setSession(res);
        } catch (err) {
            Swal.fire('Error', err.error || 'No se pudo crear la cuenta', 'error');
        } finally {
            UI.setLoading(e.target.querySelector('button'), false, 'Crear Cuenta');
        }
    },
    async handleGoogleResponse(response) {
        try {
            const res = await API.post('/p/auth/google', { token: response.credential });
            Auth.setSession(res);
        } catch (err) {
            Swal.fire('Error', 'Fallo autenticación con Google', 'error');
        }
    }
};

const Checkout = {
    async createOrder(metodo_pago, ref_pago) {
        if (!state.user || state.cart.length === 0) return;

        const orderData = {
            tercero_id: state.user.id,
            customer_name: state.user.nombre,
            customer_email: state.user.email,
            customer_phone: state.user.telefono,
            customer_address: state.user.direccion,
            customer_documento: state.user.documento,
            notas: document.getElementById('checkout-notes').value,
            metodo_pago,
            referencia_pago: ref_pago,
            items: state.cart.map(i => ({
                product_id: i.id,
                cantidad: i.qty,
                precio_unitario: i.precio_base
            }))
        };

        try {
            const res = await API.post('/p/orders', orderData);
            Cart.clear();
            UI.closeModal('checkout');
            Swal.fire({
                icon: 'success',
                title: '¡Pedido Confirmado!',
                text: `Tu pedido #${res.order_id} ha sido recibido. Te enviaremos actualizaciones a tu correo.`,
                confirmButtonText: 'Seguir comprando'
            });
        } catch (err) {
            Swal.fire('Error', err.error || 'No se pudo procesar el pedido', 'error');
        }
    },

    payWompi() {
        if (!state.config.wompi_public_key) return Swal.fire('Error', 'Wompi no configurado', 'error');

        const amt = Cart.getTotal() * 100; // En centavos
        const ref = 'ORD-' + Date.now();

        var checkout = new WidgetCheckout({
            currency: 'COP',
            amountInCents: amt,
            reference: ref,
            publicKey: state.config.wompi_public_key,
            redirectUrl: window.location.href, // Opcional
            /*customerData: {
                email: state.user.email,
                fullName: state.user.nombre + ' ' + state.user.apellido,
                phoneNumber: state.user.telefono,
                phoneNumberPrefix: '+57',
            }*/
        });

        checkout.open(function (result) {
            var transaction = result.transaction;
            if (transaction.status === "APPROVED") {
                Checkout.createOrder('WOMPI', transaction.id);
            } else {
                Swal.fire('Pago Rechazado', 'El pago fue declinado.', 'warning');
            }
        });
    }
    // PayU y MercadoPago irían aquí para Fase 3 (o se omiten si es solo demo por ahora).
};

const UI = {
    renderCategories() {
        const container = document.getElementById('category-list');
        container.innerHTML = `
            <button class="cat-item ${!state.currentCategory ? 'active' : ''}" onclick="Store.filterByCategory(null)">
                <span><i data-lucide="layers" class="icon-sm inline mr-2 align-text-bottom"></i> Todos los Productos</span>
            </button>
        `;
        state.categories.forEach(cat => {
            const isActive = state.currentCategory == cat.id;
            container.innerHTML += `
                <button class="cat-item ${isActive ? 'active' : ''}" onclick="Store.filterByCategory(${cat.id})">
                    <span>${cat.nombre}</span>
                    <span class="cat-count">${cat.total_productos}</span>
                </button>
            `;
        });
        lucide.createIcons();
    },

    renderProducts() {
        const container = document.getElementById('products-grid');
        document.getElementById('product-count').textContent = `${state.products.length} resultados`;

        if (state.products.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-muted">
                    <i data-lucide="package-search" style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.5;"></i>
                    <p class="text-lg">No encontramos productos.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = state.products.map(p => {
            const img = p.imagen ? `${APP_BASE}/${p.imagen}` : 'https://placehold.co/400x400/F1F5F9/94A3B8?text=Sin+Imagen';
            return `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="Store.openProduct(${p.id})">
                        <img src="${img}" alt="${p.nombre}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <div class="product-cat">${p.category_name || 'Sin Categoría'}</div>
                        <h3 class="product-title">${p.nombre}</h3>
                        <div class="product-price">${formatCurrency(p.precio_base)}</div>
                        <button class="btn-add font-medium w-icon mt-auto" onclick="Cart.add({id: ${p.id}, nombre: '${p.nombre}', precio_base: ${p.precio_base}, imagen: '${p.imagen}'})">
                            <i data-lucide="shopping-cart" class="icon-sm"></i> Agregar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    },

    updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        const totalItems = state.cart.reduce((s, i) => s + i.qty, 0);
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    },

    toggleCart(forceState) {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        const isOpen = forceState !== undefined ? forceState : !drawer.classList.contains('open');

        if (isOpen) {
            drawer.classList.add('open');
            overlay.classList.remove('hidden');
            this.renderCart();
        } else {
            drawer.classList.remove('open');
            overlay.classList.add('hidden');
        }
    },

    renderCart() {
        const container = document.getElementById('cart-items');
        if (state.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i data-lucide="shopping-cart" class="text-muted" style="width:48px;height:48px;"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            document.getElementById('cart-subtotal').textContent = '$0';
            document.getElementById('cart-total').textContent = '$0';
            lucide.createIcons();
            return;
        }

        container.innerHTML = state.cart.map(item => {
            const img = item.imagen && item.imagen !== 'null' ? `${APP_BASE}/${item.imagen}` : 'https://placehold.co/100/F1F5F9/94A3B8?text=IMG';
            return `
                <div class="cart-item">
                    <img src="${img}" alt="${item.nombre}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="flex-between">
                            <div class="cart-item-title pr-4">${item.nombre}</div>
                            <button onclick="Cart.remove(${item.id})" class="text-muted" style="background:none"><i data-lucide="trash-2" class="icon-sm"></i></button>
                        </div>
                        <div class="cart-item-price">${formatCurrency(item.precio_base)}</div>
                        <div class="flex items-center gap-3 mt-auto">
                            <button class="btn-qty" style="width:24px; height:24px" onclick="Cart.updateQty(${item.id}, -1)"><i data-lucide="minus" class="icon-sm"></i></button>
                            <span class="font-medium text-sm w-4 text-center">${item.qty}</span>
                            <button class="btn-qty" style="width:24px; height:24px" onclick="Cart.updateQty(${item.id}, 1)"><i data-lucide="plus" class="icon-sm"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        lucide.createIcons();

        const total = Cart.getTotal();
        document.getElementById('cart-subtotal').textContent = formatCurrency(total);
        document.getElementById('cart-total').textContent = formatCurrency(total);
    },

    showProductModal() {
        const p = state.selectedProduct;
        document.getElementById('detail-name').textContent = p.nombre;
        document.getElementById('detail-sku').textContent = `SKU: ${p.sku}`;
        document.getElementById('detail-cat').textContent = p.category_name || 'General';
        document.getElementById('detail-price').textContent = formatCurrency(p.precio_base);
        document.getElementById('detail-desc').innerText = p.descripcion_publica || p.descripcion || 'Sin descripción detallada.';

        const img = p.imagen ? `${APP_BASE}/${p.imagen}` : 'https://placehold.co/600/F1F5F9/94A3B8?text=Sin+Imagen';
        document.getElementById('detail-img').src = img;
        document.getElementById('detail-thumbnails').innerHTML = `<img src="${img}" class="thumbnail active">`;

        document.getElementById('detail-qty').value = 1;
        document.getElementById('btn-add-detail').onclick = () => {
            const q = parseInt(document.getElementById('detail-qty').value);
            Cart.add({ id: p.id, nombre: p.nombre, precio_base: p.precio_base, imagen: p.imagen }, q);
            UI.closeModal('product');
        };

        this._show('product-modal');
    },

    updateDetailQty(change) {
        const input = document.getElementById('detail-qty');
        let val = parseInt(input.value) + change;
        if (val < 1) val = 1;
        input.value = val;
    },

    showAuthModal() {
        if (state.user) return; // Prevent if already logged in
        this.setAuthTab('login');
        this._show('auth-modal');
    },

    setAuthTab(tab) {
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');

        const tabs = document.querySelectorAll('#auth-tabs .tab');
        tabs[0].classList.toggle('active', tab === 'login');
        tabs[1].classList.toggle('active', tab === 'register');
    },

    showCheckoutModal() {
        this._show('checkout-modal');
        document.querySelector('.checkout-total-display').textContent = formatCurrency(Cart.getTotal());
        document.getElementById('checkout-user-address').textContent = `${state.user.nombre} ${state.user.apellido} — ${state.user.direccion || 'Sin dirección registrada'}`;

        // Render gateways (Fase 3: Wompi, etc.)
        const gwContainer = document.getElementById('payment-gateways');
        let gwHtml = ``;

        if (state.config.wompi_public_key) {
            gwHtml += `
            <button class="payment-btn" onclick="Checkout.payWompi()">
                <div class="font-bold">Wompi / Bancolombia</div>
                <div class="text-xs text-muted font-normal mt-1">Nequi, Tarjetas, PSE</div>
            </button>`;
        }
        gwHtml += `
            <button class="payment-btn" onclick="Checkout.createOrder('TRANSFERENCIA', '')">
                <i data-lucide="landmark" style="width: 24px; height: 24px; color: var(--text-muted)"></i>
                <span>Transferencia Manual</span>
                <span class="text-xs text-muted font-normal mt-1">Bancolombia, Nequi</span>
            </button>`;

        gwContainer.innerHTML = gwHtml;
        lucide.createIcons();
    },

    _show(id) {
        const el = document.getElementById(id);
        el.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
    },

    closeModal(type) {
        document.getElementById(`${type}-modal`).classList.add('hidden');
        document.body.style.overflow = '';
    },

    renderAuthNav() {
        const menu = document.getElementById('user-menu');
        const loginBtn = document.getElementById('btn-login-nav');
        if (state.user) {
            document.getElementById('user-name-display').textContent = `Hola, ${state.user.nombre}`;
            menu.classList.remove('hidden');
            loginBtn.classList.add('hidden');
        } else {
            menu.classList.add('hidden');
            loginBtn.classList.remove('hidden');
        }
    },

    setLoading(btn, isLoading, text) {
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader" class="icon-sm" style="animation: spin 1s linear infinite;"></i> Cargando...`;
            lucide.createIcons();
        } else {
            btn.disabled = false;
            btn.innerHTML = text;
        }
    }
};

// Add keyframes for spinner locally if needed, else via lucide inline
const style = document.createElement('style');
style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);

// Init
document.addEventListener('DOMContentLoaded', () => {
    Store.init();
});
