
// 1) Sombra/cambio al hacer scroll
const nb = document.getElementById('mainNavbar');
const onScroll = () => nb.classList.toggle('scrolled', window.scrollY > 16);
onScroll(); window.addEventListener('scroll', onScroll);

// 2) Activo por sección (IntersectionObserver)
const sections = document.querySelectorAll('section[id], header[id]');
const links = document.querySelectorAll('.nav-link.pro-link');
const map = {};
links.forEach(a => map[a.getAttribute('href').slice(1)] = a);

const io = new IntersectionObserver((entries) => {
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

/* Función para zona de llamado -------------------------- */
(function () {
    const btn = document.getElementById('btnHistoriaLl');
    const el = document.getElementById('historiaLl');
    if (btn && el) {
        el.addEventListener('shown.bs.collapse', () => btn.textContent = 'Ocultar historia');
        el.addEventListener('hidden.bs.collapse', () => btn.textContent = 'Ver historia completa');
    }
})();
// ---------------- llamado hasta aqui -------------------------------
// Parallax sutil del fondo (sin librerías)
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


// Calcula % en base a data-status de cada paso
(() => {
    const items = Array.from(document.querySelectorAll('#preparacion .t-item'));
    if (!items.length) return;
    const count = { done: 0, now: 0, next: 0 };
    items.forEach(el => count[el.dataset.status] = (count[el.dataset.status] || 0) + 1);
    const total = items.length;
    const doneEq = count.done + count.now * 0.5; // en curso vale medio
    const pct = Math.round((doneEq / total) * 100);
    const bar = document.getElementById('prepBar');
    const counter = document.getElementById('prepCounter');
    if (bar) { bar.style.width = pct + '%'; bar.setAttribute('aria-valuenow', pct); }
    if (counter) { counter.textContent = `${count.done + count.now}/${total}`; }
})();


// Compartir enlace (donaciones)
document.getElementById('shareLinkDon')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const shareData = { title: 'Proyecto Misionero — Montenegro', text: 'Conoce y apoya este proyecto', url: window.location.href };
    try {
        if (navigator.share) { await navigator.share(shareData); }
        else { await navigator.clipboard.writeText(shareData.url); alert('Enlace copiado al portapapeles'); }
    } catch (_) { }
});

// Selector de montos
const chips = Array.from(document.querySelectorAll('.amt-chip'));
const input = document.getElementById('amountInput');
chips.forEach(ch => {
    ch.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        ch.classList.add('active');
        const val = parseInt(ch.dataset.amount, 10);
        input.value = val > 0 ? val : '';
    });
});

// Toggle Única/Mensual: solo cambia texto/etiquetas (los links reales se configurarán en la pasarela)
const unico = document.getElementById('aporteUnico');
const mensual = document.getElementById('aporteMensual');
const btnMP = document.getElementById('btnMP');
const btnK = document.getElementById('btnKhipu');

function updateButtons() {
    const isMensual = mensual.checked;
    btnMP.textContent = isMensual ? 'Suscribirme por Mercado Pago' : 'Donar con Mercado Pago';
    btnK.textContent = isMensual ? 'Suscripción con Khipu (si aplica)' : 'Donar con Khipu';
    // Si tienes URLs distintas para mensual, cámbialas aquí:
    // btnMP.href = isMensual ? 'https://mpago.la/LINK_MENSUAL' : 'https://mpago.la/TULINK';
    // btnK.href  = isMensual ? 'https://khipu.com/payment/link/LINK_MENSUAL' : 'https://khipu.com/payment/link/TULINK';
}
[unico, mensual].forEach(r => r?.addEventListener('change', updateButtons));
updateButtons();


// --- Validación Bootstrap (por si no la tienes aún en el sitio)
(() => {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) { event.preventDefault(); event.stopPropagation(); }
            form.classList.add('was-validated');
        }, false);
    });
})();

// --- Contadores "Estoy orando" (localStorage)
(function initPrayCounters() {
    const cards = document.querySelectorAll('.pray-card');
    cards.forEach(card => {
        const key = 'pray_' + card.dataset.key;
        const countEl = card.querySelector('.pray-count');
        const btnPray = card.querySelector('.btn-pray');
        const btnShare = card.querySelector('.btn-share');

        // Inicializa
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        if (countEl) countEl.textContent = current;

        // Incrementar
        btnPray?.addEventListener('click', () => {
            const val = parseInt(localStorage.getItem(key) || '0', 10) + 1;
            localStorage.setItem(key, String(val));
            if (countEl) countEl.textContent = val;
            btnPray.classList.add('active');
            setTimeout(() => btnPray.classList.remove('active'), 600);
        });

        // Compartir
        btnShare?.addEventListener('click', async () => {
            const title = 'Punto de oración — Proyecto Misionero';
            const text = `${card.querySelector('h6')?.textContent} — ${card.querySelector('p')?.textContent}`;
            const url = window.location.href.split('#')[0] + '#oracion';
            try {
                if (navigator.share) { await navigator.share({ title, text, url }); }
                else { await navigator.clipboard.writeText(`${title}\n${text}\n${url}`); alert('Motivo copiado'); }
            } catch (_) { }
        });
    });
})();

// --- Motivo del día
(function setOracionDelDia() {
    const labels = Array.from(document.querySelectorAll('#oracionGrid .pray-card h6')).map(n => n.textContent.trim());
    const labelEl = document.getElementById('oracionDelDiaLabel');
    if (!labels.length || !labelEl) return;
    const idx = new Date().getDate() % labels.length; // rota por día del mes
    labelEl.textContent = labels[idx];
})();


// --- Filtro por texto
(function faqSearch() {
    const input = document.getElementById('faqSearch');
    const items = Array.from(document.querySelectorAll('.faq-item'));
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        items.forEach(it => {
            const txt = it.innerText.toLowerCase();
            it.style.display = txt.includes(q) ? '' : 'none';
        });
    });
})();

// --- Filtro por etiqueta
(function faqTags() {
    const tags = document.querySelectorAll('.faq-tag');
    const items = Array.from(document.querySelectorAll('.faq-item'));
    tags.forEach(btn => {
        btn.addEventListener('click', () => {
            tags.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tag = btn.dataset.tag;
            items.forEach(it => {
                if (tag === 'all') { it.style.display = ''; return; }
                const its = (it.dataset.tags || '').split(' ');
                it.style.display = its.includes(tag) ? '' : 'none';
            });
        });
    });
})();

// --- Copiar enlace a una pregunta
(function faqCopyLink() {
    document.querySelectorAll('.faq-copy').forEach(btn => {
        btn.addEventListener('click', async () => {
            const target = btn.getAttribute('data-target');
            const el = document.querySelector(target);
            if (!el?.id) return;
            const url = `${location.origin}${location.pathname}#${el.id}`;
            try {
                await navigator.clipboard.writeText(url);
                btn.innerHTML = '<i class="bi bi-check2"></i> Enlace copiado';
                setTimeout(() => btn.innerHTML = '<i class="bi bi-link-45deg"></i> Copiar enlace', 1600);
            } catch (_) { /* ignore */ }
        });
    });
})();


// Filtros por categoría + contador
(function galleryFilters() {
    const tags = document.querySelectorAll('.gal-tag');
    const items = document.querySelectorAll('.gal-item');
    const count = document.getElementById('galCount');
    const updateCount = () => count && (count.textContent = [...items].filter(i => i.style.display !== 'none').length);

    tags.forEach(btn => {
        btn.addEventListener('click', () => {
            tags.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tag = btn.dataset.tag;
            items.forEach(it => {
                it.style.display = (tag === 'all' || it.dataset.cat === tag) ? '' : 'none';
            });
            updateCount();
        });
    });
    // inicial
    updateCount();
})();

// Shimmer: quitar cuando cargue la imagen
document.querySelectorAll('.gal-card .gal-img').forEach(img => {
    if (img.complete) { img.classList.add('loaded'); img.closest('.gal-card')?.classList.remove('shimmer'); }
    img.addEventListener('load', () => {
        img.classList.add('loaded');
        img.closest('.gal-card')?.classList.remove('shimmer');
    });
});

// Lightbox con navegación y utilidades
(function lightbox() {
    const modal = document.getElementById('lightboxModal');
    const imgEl = document.getElementById('lightboxImage');
    const capEl = document.getElementById('lightboxCaption');
    const idxEl = document.getElementById('lightboxIndex');
    const prevBtn = modal.querySelector('.lightbox-nav.prev');
    const nextBtn = modal.querySelector('.lightbox-nav.next');
    const copyBtn = document.getElementById('copyImgLink');
    const dlBtn = document.getElementById('downloadImg');

    const cards = [...document.querySelectorAll('#galleryGrid .gal-card')];
    let current = 0;

    function openAt(i) {
        current = (i + cards.length) % cards.length;
        const card = cards[current];
        const src = card.getAttribute('data-image');
        const cap = card.getAttribute('data-caption') || card.querySelector('.gal-caption')?.textContent || '';
        imgEl.src = src; capEl.textContent = cap; idxEl.textContent = (current + 1) + ' / ' + cards.length;
    }

    cards.forEach((card, i) => {
        card.addEventListener('click', () => openAt(i));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(i); } });
    });

    prevBtn.addEventListener('click', () => openAt(current - 1));
    nextBtn.addEventListener('click', () => openAt(current + 1));

    // Teclado dentro del modal
    modal.addEventListener('shown.bs.modal', () => {
        function onKey(e) {
            if (e.key === 'ArrowLeft') prevBtn.click();
            if (e.key === 'ArrowRight') nextBtn.click();
        }
        window.addEventListener('keydown', onKey);
        modal.addEventListener('hidden.bs.modal', () => window.removeEventListener('keydown', onKey), { once: true });
    });

    // Copiar enlace directo a la imagen
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(imgEl.src);
            copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copiado';
            setTimeout(() => copyBtn.innerHTML = '<i class="bi bi-link-45deg me-1"></i>Copiar enlace', 1400);
        } catch (_) { }
    });

    // Descargar imagen (respeta CORS si está local/permitido)
    dlBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = imgEl.src;
        a.download = imgEl.src.split('/').pop() || 'imagen.jpg';
        document.body.appendChild(a); a.click(); a.remove();
    });
})();


// Año dinámico
document.getElementById('year')?.textContent = new Date().getFullYear();

// Validación mínima newsletter
(() => {
    const forms = document.querySelectorAll('.footer-newsletter.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', e => {
            if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
            form.classList.add('was-validated');
            // TODO: reemplazar por fetch a tu endpoint (Mailchimp/ConvertKit)
            // e.preventDefault();
        }, false);
    });
})();

// Back to top
(function backToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    const onScroll = () => {
        if (window.scrollY > 400) { btn.style.display = 'flex'; }
        else { btn.style.display = 'none'; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    onScroll();
})();

// Lightbox (si usas el bloque de galería pro, esto reutiliza su estado)
(function lightboxFooterGlue() {
    const modal = document.getElementById('lightboxModal');
    if (!modal) return;
    const imgEl = document.getElementById('lightboxImage');
    const capEl = document.getElementById('lightboxCaption');
    const idxEl = document.getElementById('lightboxIndex');
    const prevBtn = modal.querySelector('.lightbox-nav.prev');
    const nextBtn = modal.querySelector('.lightbox-nav.next');
    const copyBtn = document.getElementById('copyImgLink');

    // Disuadir descarga
    [imgEl].forEach(el => {
        el.setAttribute('draggable', 'false');
        el.addEventListener('contextmenu', e => e.preventDefault());
        el.addEventListener('dragstart', e => e.preventDefault());
    });

    // Si ya tienes la inicialización en la sección de galería, no repitas esto.
    // Aquí se incluye una versión defensiva mínima por si el footer se usa aislado.
    const cards = [...document.querySelectorAll('#galleryGrid .gal-card')];
    let current = 0;
    function openAt(i) {
        if (!cards.length) return;
        current = (i + cards.length) % cards.length;
        const card = cards[current];
        imgEl.src = card.getAttribute('data-image');
        capEl.textContent = card.getAttribute('data-caption') || card.querySelector('.gal-caption')?.textContent || '';
        idxEl.textContent = (current + 1) + ' / ' + cards.length;
    }
    cards.forEach((card, i) => card.addEventListener('click', () => openAt(i)));
    prevBtn?.addEventListener('click', () => openAt(current - 1));
    nextBtn?.addEventListener('click', () => openAt(current + 1));

    modal.addEventListener('shown.bs.modal', () => {
        function onKey(e) {
            if (e.key === 'ArrowLeft') prevBtn?.click();
            if (e.key === 'ArrowRight') nextBtn?.click();
        }
        window.addEventListener('keydown', onKey);
        modal.addEventListener('hidden.bs.modal', () => window.removeEventListener('keydown', onKey), { once: true });
    });

    copyBtn?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(imgEl.src);
            copyBtn.innerHTML = '<i class="bi bi-check2"></i> Copiado';
            setTimeout(() => copyBtn.innerHTML = '<i class="bi bi-link-45deg me-1"></i> Copiar enlace', 1400);
        } catch (_) { }
    });
})();

// Validación Bootstrap + contador de caracteres + toasts + prefill WhatsApp/mailto (sin backend)
(() => {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const topicEl = document.getElementById('topic');
    const msgEl = document.getElementById('msg');
    const msgCount = document.getElementById('msgCount');
    const policyEl = document.getElementById('policy');
    const honeypot = document.getElementById('website');

    const waBtn = document.getElementById('waBtn');
    const mailtoBtn = document.getElementById('mailtoBtn');

    // Contador de caracteres
    const updateCount = () => msgCount && (msgCount.textContent = (msgEl.value || '').length);
    msgEl.addEventListener('input', updateCount); updateCount();

    // Prefill WhatsApp y mailto (no envía el form, solo ofrece alternativas)
    function buildPrefills() {
        const name = (nameEl.value || '').trim();
        const email = (emailEl.value || '').trim();
        const phone = (phoneEl.value || '').trim();
        const topic = topicEl.value || '';
        const message = (msgEl.value || '').trim();

        const texto = `Hola, soy ${name || '—'}. Motivo: ${topic || '—'}.\nEmail: ${email || '—'}${phone ? `\nTel: ${phone}` : ''}\n\nMensaje:\n${message}`;
        const encoded = encodeURIComponent(texto);

        // Cambia el número por el tuyo real
        waBtn.href = `https://wa.me/56912345678?text=${encoded}`;
        // Cambia el correo por el tuyo real
        mailtoBtn.href = `mailto:contacto@tudominio.cl?subject=${encodeURIComponent('Contacto desde el sitio')}&body=${encoded}`;
    }
    [nameEl, emailEl, phoneEl, topicEl, msgEl].forEach(el => el.addEventListener('input', buildPrefills));
    buildPrefills();

    // Envío (simulado / preparado para fetch). Puedes integrar Formspree/Netlify/etc.
    form.addEventListener('submit', async (event) => {
        if (!form.checkValidity()) {
            event.preventDefault(); event.stopPropagation();
        } else {
            // Anti-spam simple
            if (honeypot && honeypot.value) {
                event.preventDefault(); event.stopPropagation();
                return; // Bot descartado
            }
            // Aquí podrías hacer fetch a tu endpoint:
            // event.preventDefault();
            // await fetch('TU_ENDPOINT', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...})});

            // Toast de éxito
            try {
                const toastEl = document.getElementById('contactToast');
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
            } catch (_) { }

            // Limpieza
            // form.reset();
            // updateCount();
        }
        form.classList.add('was-validated');
    }, false);
})();
