// =========================
//  UTILIDADES BÁSICAS
// =========================
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Validación Bootstrap (genérica)
(() => {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', e => {
            if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
            form.classList.add('was-validated');
        }, false);
    });
})();

// =========================
//  LIGHTBOX (simple por data-image en triggers)
// =========================
(() => {
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImage = document.getElementById('lightboxImage');
    if (!lightboxModal || !lightboxImage) return;
    lightboxModal.addEventListener('show.bs.modal', (event) => {
        const trigger = event.relatedTarget;
        const src = trigger?.getAttribute('data-image');
        if (src) lightboxImage.src = src;
    });
})();

//  NAVBAR & SCROLL EFFECTS
// =========================
(() => {
    const nb = document.getElementById('mainNavbar');
    const offcanvasEl = document.getElementById('navOffcanvas');
    if (!nb) return;

    // Sombra / fondo al hacer scroll
    const onScroll = () => nb.classList.toggle('scrolled', window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // =========================
    //  Link activo por sección
    //  (solo menú principal)
    // =========================
    const sections = document.querySelectorAll('section[id], header[id]');
    const links = document.querySelectorAll('#mainNavbar .nav-link.pro-link');
    const map = {};

    links.forEach(a => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#') && href.length > 1) {
            map[href.slice(1)] = a;
        }
    });

    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const id = entry.target.id;
            if (!map[id]) return;
            if (entry.isIntersecting) {
                links.forEach(l => l.classList.remove('active'));
                map[id].classList.add('active');
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(s => io.observe(s));

    // =========================
    //  Scroll suave + cierre menú (desktop + mobile)
    // =========================
    const NAV_OFFSET = nb.offsetHeight - 4;

    function scrollToHash(hash) {
        const target = document.querySelector(hash);
        if (!target) return;

        const top = target.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET;
        window.scrollTo({
            top,
            behavior: 'smooth'
        });
    }

    function handleNavLinkClick(e) {
        const href = this.getAttribute('href');
        if (!href || !href.startsWith('#')) return;

        // evitamos el salto brusco
        e.preventDefault();

        const insideOffcanvas = offcanvasEl && offcanvasEl.contains(this);

        if (insideOffcanvas && window.bootstrap && window.bootstrap.Offcanvas) {
            // Cerrar el offcanvas con la API de Bootstrap
            const offcanvasInstance = window.bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
            offcanvasInstance.hide();

            // Cuando termina la animación, hacemos el scroll suave
            setTimeout(() => {
                scrollToHash(href);
            }, 300);
        } else {
            // Desktop u otros enlaces fuera del offcanvas
            scrollToHash(href);
        }
    }

    // Enlaces del navbar (desktop) + enlaces del menú mobile (offcanvas)
    const navLinks = document.querySelectorAll(
        '#mainNavbar .nav-link.pro-link[href^="#"], ' +
        '#navOffcanvas .nav-link.pro-link[href^="#"]'
    );

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });

})();


// =========================
//  LLAMADO / HERO
// =========================
(() => {
    const btn = document.getElementById('btnHistoriaLl');
    const el = document.getElementById('historiaLl');
    if (btn && el) {
        el.addEventListener('shown.bs.collapse', () => btn.textContent = 'Ocultar historia');
        el.addEventListener('hidden.bs.collapse', () => btn.textContent = 'Ver historia completa');
    }
})();

// Parallax sutil del hero
(() => {
    const bg = document.querySelector('.hero-pro .hero-bg');
    if (!bg) return;
    const onScroll = () => {
        const y = Math.min(window.scrollY, 400);
        bg.style.transform = `translateY(${y * 0.15}px) scale(1.06)`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
})();

// =========================
//  TIMELINE DE PREPARACIÓN (robusta + debug)
// =========================
(() => {
    const scope = document.getElementById('preparacion');
    if (!scope) return;

    const items = scope.querySelectorAll('.timeline-pro .t-item');
    const prepBar = scope.querySelector('#prepBar');
    const prepCounter = scope.querySelector('#prepCounter');

    // --- DEBUG INICIAL ---
    console.log('[Prep] encontrados .t-item =', items.length);
    if (!items.length || !prepBar || !prepCounter) {
        console.warn('[Prep] Falta algo:', { items: items.length, prepBar: !!prepBar, prepCounter: !!prepCounter });
        return;
    }

    let done = 0, now = 0, next = 0;

    items.forEach((it, idx) => {
        // 1) dataset/status directo
        let s = (it.dataset?.status || it.getAttribute('data-status') || '').trim().toLowerCase();

        // 2) si no existe, intentar inferir del badge interno
        if (!s) {
            const badge = it.querySelector('.t-badge');
            if (badge) {
                if (badge.classList.contains('done')) s = 'done';
                else if (badge.classList.contains('now')) s = 'now';
                else if (badge.classList.contains('next')) s = 'next';
            }
        }

        // 3) normalizar variantes comunes
        if (s === 'completado') s = 'done';
        if (s === 'en curso' || s === 'curso' || s === 'progress') s = 'now';
        if (s === 'proximo' || s === 'próximo' || s === 'pending') s = 'next';

        // 4) conteo
        if (s === 'done') done++;
        else if (s === 'now') now++;
        else next++;

        console.log(`[Prep][${idx}] data-status=`, it.getAttribute('data-status'), '→ usado:', s);
    });

    const total = items.length;
    const percent = Math.round(((done + 0.5 * now) / total) * 100);

    // pintar UI
    prepBar.style.width = percent + '%';
    prepBar.setAttribute('aria-valuenow', String(percent));
    prepCounter.textContent = `${done}/${total} (${percent}%)`;

    console.log('[Prep] totales => done:', done, 'now:', now, 'next:', next, 'percent:', percent);

    // Reveal on scroll
    const io2 = ('IntersectionObserver' in window)
        ? new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('in-view');
                    io2.unobserve(e.target);
                }
            });
        }, { threshold: 0.15 })
        : null;

    items.forEach(el => io2 ? io2.observe(el) : el.classList.add('in-view'));
})();

// ==============================
//  ORACIÓN – Motivos interactivos
// ==============================
(function () {
    const grid = document.getElementById('oracionGrid');
    if (!grid) return; // sección no presente

    const STORAGE_KEY = 'qg_oracionLikes';

    // ---------- Utilidades de estado (likes) ----------
    function loadLikes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (err) {
            console.warn('No se pudieron cargar los likes de oración.', err);
            return {};
        }
    }

    function saveLikes(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('No se pudieron guardar los likes de oración.', err);
        }
    }

    const likesState = loadLikes();

    // ---------- Inicializar tarjetas ----------
    const cards = Array.from(grid.querySelectorAll('.oracion-card'));

    cards.forEach(card => {
        const id = card.dataset.oracionId || '';
        const likeBtn = card.querySelector('.btn-like-oracion');
        const likeCountEl = card.querySelector('.like-count');
        const joinBtn = card.querySelector('.btn-unirse-oracion');
        const shareBtn = card.querySelector('.btn-icon-share-oracion');
        const title = (card.querySelector('h5')?.textContent || '').trim();
        const bodyText = (card.querySelector('p')?.textContent || '').trim();

        if (!likeBtn || !likeCountEl) return;

        // --- Estado inicial de likes (por navegador) ---
        const initialState = likesState[id] || { count: 0, liked: false };
        likeCountEl.textContent = initialState.count;
        if (initialState.liked) {
            likeBtn.classList.add('active');
        }

        // --- Manejo de "Me gusta" ---
        likeBtn.addEventListener('click', () => {
            const current = likesState[id] || { count: 0, liked: false };

            if (current.liked) {
                current.liked = false;
                current.count = Math.max(0, current.count - 1);
                likeBtn.classList.remove('active');
            } else {
                current.liked = true;
                current.count += 1;
                likeBtn.classList.add('active');
            }

            likesState[id] = current;
            likeCountEl.textContent = current.count;
            saveLikes(likesState);
        });

        // --- Botón "Unirme" -> Contacto prellenado ---
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                const contactoSection = document.getElementById('contacto');
                if (contactoSection) {
                    contactoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.location.hash = '#contacto';
                }

                const topicSelect = document.getElementById('topic');
                const msgInput = document.getElementById('msg');

                if (topicSelect) {
                    if ([...topicSelect.options].some(opt => opt.value === 'oracion')) {
                        topicSelect.value = 'oracion';
                    }
                }

                if (msgInput) {
                    const base = `Hola, me gustaría unirme en oración por este motivo:\n\n"${title}"\n\n`;
                    const detalle = bodyText ? `${bodyText}\n\n` : '';
                    if (!msgInput.value) {
                        msgInput.value = base + detalle;
                    } else {
                        msgInput.value += `\n\n${base}${detalle}`;
                    }
                    msgInput.focus();
                }
            });
        }

        // --- Botón de compartir ---
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const shareText =
                    `${title}\n\n${bodyText}\n\nMotivo de oración — Berane`;
                const shareUrl = window.location.origin + window.location.pathname + '#oracion';
                const shareData = {
                    title: 'Motivo de oración',
                    text: shareText,
                    url: shareUrl
                };

                if (navigator.share) {
                    try {
                        await navigator.share(shareData);
                    } catch (err) {
                        if (err && err.name !== 'AbortError') {
                            console.warn('No se pudo compartir el motivo.', err);
                        }
                    }
                    return;
                }

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    try {
                        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                        alert('Texto copiado para que puedas compartirlo en tus redes.');
                    } catch (err) {
                        console.warn('No se pudo copiar al portapapeles.', err);
                        prompt('Copia este texto para compartir:', `${shareText}\n${shareUrl}`);
                    }
                } else {
                    prompt('Copia este texto para compartir:', `${shareText}\n${shareUrl}`);
                }
            });
        }
    });

    // ---------- Motivo del día ----------
    (function setMotivoDelDia() {
        const label = document.getElementById('oracionDelDiaLabel');
        if (!label || cards.length === 0) return;

        const today = new Date();
        const dayKey = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let index = 0;

        for (let i = 0; i < dayKey.length; i++) {
            index = (index + dayKey.charCodeAt(i)) % cards.length;
        }

        const card = cards[index];
        const title = (card.querySelector('h5')?.textContent || '').trim();

        label.textContent = title || 'Motivo especial de oración';
    })();

})();


/// =========================
//  DONACIONES
// =========================
(function () {
    // --- Compartir sección
    const shareBtn = document.getElementById('shareLinkDon');
    shareBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const shareData = {
            title: 'Proyecto Misionero — Montenegro',
            text: 'Conoce y apoya este proyecto',
            url: window.location.origin + window.location.pathname + '#donaciones'
        };
        try {
            if (navigator.share) { await navigator.share(shareData); }
            else {
                await navigator.clipboard.writeText(shareData.url);
                alert('Enlace copiado al portapapeles');
            }
        } catch (_) { }
    });

    // --- Utilidades CLP
    const fmtCLP = (n) => new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    }).format(n);

    const parseNum = (str) => Number(String(str).replace(/[^\d]/g, '')) || 0;

    // --- Montos rápidos
    const chips = Array.from(document.querySelectorAll('.amt-chip'));
    const input = document.getElementById('amountInput');

    const applyValue = (val) => {
        input.value = val ? fmtCLP(val).replace('$', '').trim() : '';
        input.dispatchEvent(new Event('input'));
    };

    chips.forEach(ch => {
        ch.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            ch.classList.add('active');
            const val = parseInt(ch.dataset.amount, 10);
            applyValue(val > 0 ? val : 0);
            input.focus();
        });
    });

    // Formateo “mientras escribe”
    if (input) {
        input.addEventListener('input', () => {
            const raw = parseNum(input.value);
            input.value = raw ? fmtCLP(raw).replace('$', '').trim() : '';
            requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
        });
    }

    // --- Toggle Única / Mensual + botones
    const unico = document.getElementById('aporteUnico');
    const mensual = document.getElementById('aporteMensual');
    const btnMP = document.getElementById('btnMP');
    const btnK = document.getElementById('btnKhipu');

    function updateButtons() {
        const isMensual = mensual?.checked;

        if (btnMP) {
            // Solo cambiamos el texto; el link real vendrá desde el backend
            btnMP.textContent = isMensual
                ? 'Suscribirme por Mercado Pago'
                : 'Donar con Mercado Pago';
        }

        if (btnK) {
            // Khipu puede seguir usando los data-href fijos
            btnK.textContent = isMensual
                ? 'Suscripción con Khipu (si aplica)'
                : 'Donar con Khipu';

            const href = isMensual ? btnK.dataset.hrefMonth : btnK.dataset.hrefOnce;
            if (href) btnK.href = href;
        }
    }

    [unico, mensual].forEach(r => r?.addEventListener('change', updateButtons));
    updateButtons();

    // --- Click en "Donar con Mercado Pago" con monto dinámico
    if (btnMP) {
        btnMP.addEventListener('click', async (e) => {
            e.preventDefault();

            const rawAmount = parseNum(input?.value || '');
            if (!rawAmount || rawAmount <= 0) {
                alert('Por favor, selecciona o escribe un monto de ofrenda antes de continuar.');
                if (input) input.focus();
                return;
            }

            const isMensual = mensual?.checked;
            // Opcional: puedes validar un mínimo, ej. 1000 CLP
            if (rawAmount < 1000) {
                if (!confirm(`El monto es ${fmtCLP(rawAmount)}. ¿Quieres continuar igualmente?`)) {
                    return;
                }
            }

            try {
                btnMP.disabled = true;
                btnMP.textContent = isMensual
                    ? 'Creando suscripción...'
                    : 'Creando enlace de pago...';

                const res = await fetch('backend/mp_preference.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: rawAmount,
                        type: isMensual ? 'monthly' : 'once'
                    })
                });

                const data = await res.json();

                if (!data.success || !data.init_point) {
                    console.warn('Respuesta MP:', data);
                    alert('No se pudo iniciar el pago en Mercado Pago. Intenta nuevamente más tarde.');
                    return;
                }

                // Redirigimos al checkout de Mercado Pago con el monto ya configurado
                window.location.href = data.init_point;

            } catch (err) {
                console.error('Error al crear preferencia MP:', err);
                alert('Ocurrió un error al conectar con Mercado Pago. Intenta nuevamente.');
            } finally {
                btnMP.disabled = false;
                updateButtons();
            }
        });
    }
})();


(function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const topicSelect = document.getElementById('topic');
    const msgInput = document.getElementById('msg');
    const waBtn = document.getElementById('waBtn');
    const mailtoBtn = document.getElementById('mailtoBtn');

    const CONTACT_EMAIL = 'contacto@qgproject.cl';

    function getTopicText() {
        if (!topicSelect) return 'Contacto desde el sitio';
        const opt = topicSelect.options[topicSelect.selectedIndex];
        return opt && opt.text ? opt.text : 'Contacto desde el sitio';
    }

    function buildBodyLines() {
        return [
            `Nombre: ${nameInput?.value || '-'}`,
            `Email: ${emailInput?.value || '-'}`,
            `Teléfono: ${phoneInput?.value || '-'}`,
            `Motivo: ${getTopicText()}`,
            '',
            'Mensaje:',
            msgInput?.value || '-'
        ];
    }

    function updateLinks() {
        const subject = encodeURIComponent(`Contacto — ${getTopicText()}`);
        const body = encodeURIComponent(buildBodyLines().join('\n'));

        if (mailtoBtn) {
            mailtoBtn.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        }

        if (waBtn) {
            const waNumber = '56933639929';
            const waText = encodeURIComponent(
                `Hola, soy ${nameInput?.value || '(sin nombre)'}.\n\n` +
                buildBodyLines().join('\n')
            );
            waBtn.href = `https://wa.me/${waNumber}?text=${waText}`;
        }
    }

    [nameInput, emailInput, phoneInput, topicSelect, msgInput].forEach(el => {
        if (el) el.addEventListener('input', updateLinks);
    });

    /* form.addEventListener('submit', function (e) {
         e.preventDefault();
         form.classList.add('was-validated');

         if (!form.checkValidity()) {
             return;
         }

         updateLinks();
         if (mailtoBtn) {
             mailtoBtn.click();
         }
     });

     updateLinks();
 })(); */

    /* =========================
       GALERÍA JSON + ADMIN SIMPLE
       ========================= */
    (function galleryInit() {
        var grid = document.getElementById('galleryGrid');
        if (!grid) return;

        var jsonData = { images: [] };
        var usingJSON = false;
        var cards = [];
        var adminUnlocked = false;

        function renderFromJSON(images) {
            var frag = document.createDocumentFragment();
            images.forEach(function (img) {
                var col = document.createElement('div');
                col.className = 'col-6 col-md-4 col-lg-3 gal-item';
                col.setAttribute('data-cat', (img.category || 'otros').toLowerCase());

                var fig = document.createElement('figure');
                fig.className = 'gal-card shimmer';
                fig.setAttribute('tabindex', '0');
                fig.setAttribute('data-bs-toggle', 'modal');
                fig.setAttribute('data-bs-target', '#lightboxModal');
                fig.setAttribute('data-image', img.src);
                fig.setAttribute('data-caption', img.caption || '');

                var im = document.createElement('img');
                im.className = 'gal-img';
                im.src = img.thumb || img.src;
                im.alt = img.alt || img.caption || '';
                im.loading = 'lazy';
                im.addEventListener('load', function () {
                    im.classList.add('loaded');
                    fig.classList.remove('shimmer');
                });

                var cap = document.createElement('figcaption');
                cap.className = 'gal-caption';
                cap.textContent = (img.category || '').charAt(0).toUpperCase() + (img.category || '').slice(1);

                fig.appendChild(im);
                fig.appendChild(cap);
                col.appendChild(fig);
                frag.appendChild(col);
            });
            grid.innerHTML = '';
            grid.appendChild(frag);
        }

        function attachFilters() {
            var tags = document.querySelectorAll('.gal-tag');
            var items = document.querySelectorAll('#galleryGrid .gal-item');
            var countEl = document.getElementById('galCount');

            function updateCount() {
                var visible = 0;
                for (var i = 0; i < items.length; i++) {
                    if (items[i].style.display !== 'none') visible++;
                }
                if (countEl) countEl.textContent = String(visible);
            }

            for (var t = 0; t < tags.length; t++) {
                tags[t].addEventListener('click', function () {
                    for (var k = 0; k < tags.length; k++) tags[k].classList.remove('active');
                    this.classList.add('active');
                    var tag = this.getAttribute('data-tag');
                    for (var i = 0; i < items.length; i++) {
                        var ok = (tag === 'all' || items[i].getAttribute('data-cat') === tag);
                        items[i].style.display = ok ? '' : 'none';
                    }
                    updateCount();
                });
            }
            updateCount();
        }

        function attachLightbox() {
            var modal = document.getElementById('lightboxModal');
            var imgEl = document.getElementById('lightboxImage');
            var capEl = document.getElementById('lightboxCaption');
            var idxEl = document.getElementById('lightboxIndex');
            if (!modal || !imgEl) return;

            cards = Array.prototype.slice.call(document.querySelectorAll('#galleryGrid .gal-card'));
            var current = 0;

            function openAt(i) {
                if (!cards.length) return;
                current = (i + cards.length) % cards.length;
                var c = cards[current];
                imgEl.src = c.getAttribute('data-image');
                if (capEl) capEl.textContent = c.getAttribute('data-caption') || '';
                if (idxEl) idxEl.textContent = (current + 1) + ' / ' + cards.length;
                if (window.bootstrap && window.bootstrap.Modal) {
                    new bootstrap.Modal(modal).show();
                }
            }

            for (let i = 0; i < cards.length; i++) {
                cards[i].addEventListener('click', function (e) { e.preventDefault(); openAt(i); });
                cards[i].addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(i); }
                });
            }

            var prevBtn = modal.querySelector('.lightbox-nav.prev');
            var nextBtn = modal.querySelector('.lightbox-nav.next');
            if (prevBtn) prevBtn.addEventListener('click', function () { openAt(current - 1); });
            if (nextBtn) nextBtn.addEventListener('click', function () { openAt(current + 1); });

            var copyBtn = document.getElementById('copyImgLink');
            if (copyBtn) {
                copyBtn.addEventListener('click', function () {
                    try {
                        navigator.clipboard.writeText(imgEl.src);
                        copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copiado';
                        setTimeout(function () { copyBtn.innerHTML = '<i class="bi bi-link-45deg me-1"></i>Copiar enlace'; }, 1400);
                    } catch (e) { }
                });
            }
        }

        (function adminTools() {
            var loginBtn = document.getElementById('btnAdminLogin');
            var toolsWrap = document.getElementById('adminTools');
            if (!loginBtn || !toolsWrap) return;

            loginBtn.addEventListener('click', function () {
                var pass = prompt('Ingrese passcode de administración');
                if (pass === 'montenegro2025') {
                    adminUnlocked = true;
                    toolsWrap.classList.remove('d-none');
                    loginBtn.classList.add('d-none');
                } else {
                    alert('Código inválido');
                }
            });

            var form = document.getElementById('adminAddForm');
            if (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    if (!adminUnlocked) return;

                    var src = document.getElementById('fSrc').value.trim();
                    var thumb = document.getElementById('fThumb').value.trim();
                    var cat = document.getElementById('fCat').value.trim().toLowerCase();
                    var cap = document.getElementById('fCaption').value.trim();
                    var alt = document.getElementById('fAlt').value.trim();

                    if (!src || !cap) {
                        alert('Src y Caption son obligatorios');
                        return;
                    }

                    var add = { id: 'img-' + Date.now(), src: src, thumb: thumb || undefined, category: cat || 'otros', caption: cap, alt: alt || cap };
                    jsonData.images.push(add);
                    renderFromJSON(jsonData.images);
                    attachFilters(); attachLightbox();

                    if (window.bootstrap && window.bootstrap.Modal) {
                        var modal = bootstrap.Modal.getInstance(document.getElementById('adminAddModal'));
                        if (modal) modal.hide();
                    }
                    form.reset();

                    exportJSON();
                });
            }

            var btnExport = document.getElementById('btnExportJson');
            if (btnExport) btnExport.addEventListener('click', exportJSON);

            function exportJSON() {
                if (!jsonData.images.length) {
                    alert('No hay imágenes en memoria para exportar.');
                    return;
                }
                var blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'gallery.json';
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
            }
        })();

        (function loadJSON() {
            fetch('./content/gallery.json', { cache: 'no-cache' })
                .then(function (res) {
                    if (!res.ok) throw new Error('gallery.json no encontrado');
                    return res.json();
                })
                .then(function (data) {
                    if (!data || !data.images) throw new Error('Formato inválido');
                    jsonData = data;
                    usingJSON = true;
                    renderFromJSON(jsonData.images);
                    attachFilters(); attachLightbox();
                })
                .catch(function () {
                    attachFilters(); attachLightbox();
                });
        })();
    })();

    // =========================
    //  BACK TO TOP
    // =========================
    (() => {
        const btn = document.getElementById('backToTop');
        if (!btn) return;
        const onScrollBtn = () => btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
        window.addEventListener('scroll', onScrollBtn, { passive: true });
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        onScrollBtn();
    })();


    // Este programa calcula el total de visitas recibidas en un sitio web durante 5 días
    // y determina cuántos días superaron la meta mínima establecida de 300 visitas.
    let totalVisitas = 0;
    let diasSobreMeta = 0;
    for (let dia = 1; dia <= 5; dia++) {
        let visitas = dia * 120;
        if (visitas >= 300) {
            diasSobreMeta++;
        }
        totalVisitas = totalVisitas + visitas;
    }
    console.log(`Días que superaron la meta: ${diasSobreMeta}`);
    console.log(`Total de visitas en los 5 días: ${totalVisitas}`);
    console.log(`Promedio diario de visitas: ${totalVisitas / 5}`);

    // ==============================
    //  ORACIÓN – Likes globales (PHP + JSON)
    // ==============================
    (function () {
        const grid = document.getElementById('oracionGrid');
        if (!grid) return;

        const STORAGE_KEY = 'qg_oracionLikesLocal';
        const API_URL = 'backend/oracion_likes.php';

        function loadLocalState() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : {};
            } catch (err) {
                console.warn('No se pudo leer el estado local de likes.', err);
                return {};
            }
        }

        function saveLocalState(state) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (err) {
                console.warn('No se pudo guardar el estado local de likes.', err);
            }
        }

        const localState = loadLocalState();
        const cards = Array.from(grid.querySelectorAll('.oracion-card'));

        function fetchGlobalLikes() {
            return fetch(API_URL)
                .then(res => res.json())
                .then(data => {
                    if (!data.success) throw new Error(data.error || 'Error al cargar likes.');
                    return data.likes || {};
                })
                .catch(err => {
                    console.warn('No se pudieron cargar los likes globales:', err);
                    return {};
                });
        }

        function sendLikeDelta(id, action) {
            return fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            })
                .then(res => res.json())
                .then(data => {
                    if (!data.success) throw new Error(data.error || 'Error al actualizar like.');
                    return data.count;
                });
        }

        fetchGlobalLikes().then(globalLikes => {
            cards.forEach(card => {
                const id = card.dataset.oracionId || '';
                const likeBtn = card.querySelector('.btn-like-oracion');
                const likeCountEl = card.querySelector('.like-count');
                const joinBtn = card.querySelector('.btn-unirse-oracion');
                const shareBtn = card.querySelector('.btn-icon-share-oracion');
                const title = (card.querySelector('h5')?.textContent || '').trim();
                const bodyText = (card.querySelector('p')?.textContent || '').trim();

                if (!likeBtn || !likeCountEl || !id) return;

                const serverCount = Number.isInteger(globalLikes[id]) ? globalLikes[id] : 0;
                likeCountEl.textContent = serverCount;

                const isLikedLocal = !!localState[id];
                if (isLikedLocal) {
                    likeBtn.classList.add('active');
                }

                likeBtn.addEventListener('click', () => {
                    const currentlyLiked = !!localState[id];
                    const action = currentlyLiked ? 'unlike' : 'like';

                    likeBtn.classList.toggle('active', !currentlyLiked);

                    sendLikeDelta(id, action)
                        .then(newCount => {
                            likeCountEl.textContent = newCount;

                            if (action === 'like') {
                                localState[id] = true;
                            } else {
                                delete localState[id];
                            }
                            saveLocalState(localState);
                        })
                        .catch(err => {
                            console.warn('Error al actualizar like:', err);
                            likeBtn.classList.toggle('active', currentlyLiked);
                        });
                });

                if (joinBtn) {
                    joinBtn.addEventListener('click', () => {
                        const contactoSection = document.getElementById('contacto');
                        if (contactoSection) {
                            contactoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            window.location.hash = '#contacto';
                        }

                        const topicSelect = document.getElementById('topic');
                        const msgInput = document.getElementById('msg');

                        if (topicSelect) {
                            if ([...topicSelect.options].some(opt => opt.value === 'oracion')) {
                                topicSelect.value = 'oracion';
                            }
                        }

                        if (msgInput) {
                            const base = `Hola, me gustaría unirme en oración por este motivo:\n\n"${title}"\n\n`;
                            const detalle = bodyText ? `${bodyText}\n\n` : '';
                            if (!msgInput.value) {
                                msgInput.value = base + detalle;
                            } else {
                                msgInput.value += `\n\n${base}${detalle}`;
                            }
                            msgInput.focus();
                        }
                    });
                }

                if (shareBtn) {
                    shareBtn.addEventListener('click', async () => {
                        const shareText =
                            `${title}\n\n${bodyText}\n\nMotivo de oración — Proyecto Quijada Gómez`;
                        const shareUrl = window.location.origin + window.location.pathname + '#oracion';
                        const shareData = {
                            title: 'Motivo de oración',
                            text: shareText,
                            url: shareUrl
                        };

                        if (navigator.share) {
                            try {
                                await navigator.share(shareData);
                            } catch (err) {
                                if (err && err.name !== 'AbortError') {
                                    console.warn('No se pudo compartir el motivo.', err);
                                }
                            }
                            return;
                        }

                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            try {
                                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                                alert('Texto copiado para que puedas compartirlo en tus redes.');
                            } catch (err) {
                                console.warn('No se pudo copiar al portapapeles.', err);
                                prompt('Copia este texto para compartir:', `${shareText}\n${shareUrl}`);
                            }
                        } else {
                            prompt('Copia este texto para compartir:', `${shareText}\n${shareUrl}`);
                        }
                    });
                }
            });

            setMotivoDelDia(cards);
        });

        function setMotivoDelDia(cards) {
            const label = document.getElementById('oracionDelDiaLabel');
            if (!label || !cards.length) return;

            const today = new Date();
            const dayKey = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            let index = 0;

            for (let i = 0; i < dayKey.length; i++) {
                index = (index + dayKey.charCodeAt(i)) % cards.length;
            }

            const card = cards[index];
            const title = (card.querySelector('h5')?.textContent || '').trim();
            label.textContent = title || 'Motivo especial de oración';
        }

    })();

})(); // cierre wrapper NAVBAR & SCROLL EFFECTS
