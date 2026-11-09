 /* Atlas Imobiliária · main.js
   Sem dependências. Dados de exemplo: substituir pelos imóveis reais.
   Preferências de movimento e de ponteiro são respeitadas. */
(() => {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- Utilitários ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const SLIDE_MS = 8000;
  const MAX_COMPARE = 3;

  const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const num = new Intl.NumberFormat('pt-PT');
  const money = (n) => eur.format(n);
  const fmtBudget = (n) => `€${(n / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} M`;
  const pad = (n) => String(n).padStart(2, '0');

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) { /* armazenamento indisponível: a página continua a funcionar */ }
    }
  };

  /* Cria elementos sem usar innerHTML com dados. */
  function el(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'style') node.setAttribute('style', value);
      else node.setAttribute(key, value === true ? '' : String(value));
    }
    kids.flat().forEach((kid) => {
      if (kid === null || kid === undefined || kid === false) return;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    });
    return node;
  }

  function heartIcon() {
    const t = document.createElement('template');
    t.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    return t.content.firstElementChild;
  }

  const todayISO = () => {
    const d = new Date();
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
  };

  /* ---------- Dados ---------- */
  const HOUSES = [
    {
      id: 'casa-1', img: 'img/casa-1.jpg', name: 'Villa Pôr do Sol', city: 'Cascais',
      price: 2450000, beds: 5, baths: 4, area: 420, plot: 1200, pool: true, status: 'available',
      tagline: 'Vista aberta sobre o mar, com a luz da tarde em cada divisão.',
      desc: 'Moradia com piscina e jardim, espaços amplos e pensados para receber e para viver em família.',
      why: ['Piscina e jardim com zona de sombra', 'Vistas abertas sobre a zona', 'Garagem para dois carros'],
      features: ['Piscina', 'Jardim', 'Garagem', 'Ar condicionado', 'Cozinha equipada', 'Arrumos']
    },
    {
      id: 'casa-2', img: 'img/casa-2.jpg', name: 'Moradia Lumen', city: 'Lisboa',
      price: 1890000, beds: 4, baths: 3, area: 310, plot: 480, pool: true, status: 'available',
      tagline: 'Luz natural em todas as divisões, a poucos minutos do centro.',
      desc: 'Moradia de traço contemporâneo, com interiores luminosos e uma piscina escondida do exterior.',
      why: ['Localização urbana e bem servida', 'Luz natural em todas as divisões', 'Piscina reservada'],
      features: ['Piscina', 'Terraço', 'Ar condicionado', 'Cozinha aberta', 'Arrecadação']
    },
    {
      id: 'casa-3', img: 'img/casa-3.jpg', name: 'Casa Falésia', city: 'Sesimbra',
      price: 1350000, beds: 3, baths: 2, area: 220, plot: 650, pool: false, status: 'available',
      tagline: 'Recolhimento junto ao mar, com a serra por trás.',
      desc: 'Casa de pedra e madeira, com jardim generoso e acesso fácil às praias da região.',
      why: ['Acesso fácil às praias', 'Jardim generoso', 'Sossego junto à serra'],
      features: ['Jardim', 'Lareira', 'Terraço', 'Garagem']
    },
    {
      id: 'casa-4', img: 'img/casa-4.jpg', name: 'Villa Horizonte', city: 'Carvoeiro',
      price: 2250000, beds: 4, baths: 4, area: 360, plot: 900, pool: true, status: 'reserved',
      tagline: 'Piscina de borda infinita sobre o Algarve.',
      desc: 'Villa com terraços em vários níveis, piscina e vistas sobre a costa. Atualmente reservada.',
      why: ['Piscina de borda infinita', 'Terraços em vários níveis', 'Vistas sobre a costa'],
      features: ['Piscina', 'Terraço', 'Ar condicionado', 'Jardim', 'Garagem']
    },
    {
      id: 'casa-5', img: 'img/casa-5.jpg', name: 'Casa Rochedo', city: 'Peniche',
      price: 1680000, beds: 3, baths: 3, area: 240, plot: 500, pool: false, status: 'available',
      tagline: 'Arquitetura de linhas limpas, virada para o oceano.',
      desc: 'Casa de linhas limpas com grandes envidraçados e acesso direto a um percurso junto à costa.',
      why: ['Envidraçados sobre o oceano', 'Percurso junto à costa', 'Interiores de linhas limpas'],
      features: ['Terraço', 'Lareira', 'Ar condicionado', 'Arrumos']
    },
    {
      id: 'casa-6', img: 'img/casa-6.jpg', name: 'Villa Azul', city: 'Comporta',
      price: 3900000, beds: 6, baths: 6, area: 520, plot: 1600, pool: true, status: 'available',
      tagline: 'Dunas, arrozais e uma piscina longa virada para o pôr do sol.',
      desc: 'A maior casa da seleção, com seis quartos, piscina e jardim, no coração da Comporta.',
      why: ['Seis quartos e espaço para toda a família', 'Piscina longa e jardim', 'Ambiente de dunas e arrozais'],
      features: ['Piscina', 'Jardim', 'Garagem', 'Ar condicionado', 'Cozinha equipada', 'Dependência']
    }
  ];

  const STEPS = [
    {
      title: 'Visita e avaliação',
      text: 'Visitas acompanhadas, com tempo para perguntas. Antes de sairmos, avaliamos o preço da casa com base em vendas recentes da zona.',
      points: ['Visita acompanhada, sem pressa', 'Avaliação comparada com vendas recentes da zona', 'Relatório escrito, entregue antes de qualquer proposta']
    },
    {
      title: 'Verificação documental',
      text: 'Revemos a certidão permanente, a caderneta predial, a licença de utilização e os encargos sobre o imóvel, antes de avançares.',
      points: ['Certidão permanente atualizada', 'Caderneta e valor patrimonial', 'Servidões, hipotecas e penhoras verificadas']
    },
    {
      title: 'Contrato-promessa',
      text: 'Revemos o contrato-promessa contigo, com condições do sinal, prazos e devoluções escritas antes de assinares.',
      points: ['Sinal por transferência bancária', 'Data da escritura definida por escrito', 'Condições de desistência explicadas']
    },
    {
      title: 'Escritura',
      text: 'Acompanhamos a escritura e confirmamos os impostos devidos na compra, com valores indicados com antecedência.',
      points: ['IMT e Imposto do Selo confirmados antes', 'Entrega de chaves registada', 'Confirmação do registo predial depois da escritura']
    }
  ];

  const CHECK_LABELS = 6;
  const byId = (id) => HOUSES.find((h) => h.id === id);

  /* ---------- Estado ---------- */
  const state = { city: '', beds: 0, budget: 4000000, sort: 'default', compare: [] };
  let favs = storage.get('atlas-favs', []);
  let checkState = storage.get('atlas-checklist', {});
  let currentHouse = null;

  const isFav = (id) => favs.includes(id);

  /* ---------- Elementos ---------- */
  const header = $('#siteHeader');
  const progressBar = $('.scroll-progress');
  const hero = $('.hero');
  const toastEl = $('[data-toast]');
  const houseDialog = $('[data-house-dialog]');
  const compareDialog = $('[data-compare-dialog]');
  const favDialog = $('[data-fav-dialog]');
  const tray = $('[data-tray]');

  /* ---------- Toast ---------- */
  let toastTimer = null;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  }

  /* ---------- Cabeçalho, menu e progresso ---------- */
  const toggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    if (open) header.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('is-locked', open);
  }

  toggle.addEventListener('click', () => setMenu(!menuOpen));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

  let lastY = window.scrollY;
  let scrollTicking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('is-scrolled', y > 40);
    if (!menuOpen) {
      if (y > 480 && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 480) header.classList.remove('is-hidden');
    }
    if (y - lastY > 6 || lastY - y > 6) lastY = y;
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  /* ---------- Hero ---------- */
  function initHero() {
    const slidesWrap = $('[data-slides]');
    const dotsWrap = $('[data-dots]');
    hero.style.setProperty('--slide-ms', `${SLIDE_MS}ms`);

    const slides = HOUSES.map((h, i) => {
      const slide = el('article', {
        class: 'hero-slide',
        'aria-roledescription': 'diapositivo',
        'aria-label': `${i + 1} de ${HOUSES.length}`
      },
        el('img', { src: h.img, alt: h.name, loading: i === 0 ? 'eager' : 'lazy' }),
        el('div', { class: 'hero-copy' },
          el('p', { class: 'eyebrow', text: `${h.city} · ${h.status === 'reserved' ? 'Reservada' : 'Disponível'}` }),
          el('h2', { class: 'hero-title', text: h.name }),
          el('p', { class: 'hero-tagline', text: h.tagline }),
          el('div', { class: 'hero-meta' },
            el('div', {}, el('b', { text: money(h.price) }), 'Preço'),
            el('div', {}, el('b', { text: String(h.beds) }), 'Quartos'),
            el('div', {}, el('b', { text: `${num.format(h.area)} m²` }), 'Área útil')
          ),
          el('div', { class: 'hero-actions' },
            el('button', { class: 'btn', type: 'button', 'data-open': h.id, text: 'Ver a casa' }),
            el('a', { class: 'btn-ghost light', href: '#imoveis', text: 'Todas as casas' })
          )
        )
      );
      slidesWrap.append(slide);
      return slide;
    });

    const dots = HOUSES.map((h, i) => {
      const dot = el('button', { class: 'hero-dot', type: 'button', 'aria-label': `Ver ${h.name}` });
      dotsWrap.append(dot);
      return dot;
    });

    $('[data-total]').textContent = pad(HOUSES.length);

    let current = 0;
    let timer = null;
    let elapsed = 0;
    let startedAt = 0;
    const holds = new Set();
    const autoplay = !reduceMotion;

    function run(ms) {
      clearTimeout(timer);
      startedAt = performance.now();
      timer = setTimeout(() => goTo(current + 1), ms);
    }

    function pause(reason) {
      if (!autoplay || holds.has(reason)) return;
      if (holds.size === 0) {
        clearTimeout(timer);
        elapsed = Math.min(SLIDE_MS, elapsed + performance.now() - startedAt);
      }
      holds.add(reason);
      hero.classList.add('is-paused');
    }

    function resume(reason) {
      if (!holds.delete(reason) || holds.size) return;
      hero.classList.remove('is-paused');
      run(Math.max(300, SLIDE_MS - elapsed));
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      elapsed = 0;
      slides.forEach((s, k) => {
        const on = k === current;
        s.classList.toggle('is-active', on);
        s.inert = !on;
        s.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((d, k) => {
        const on = k === current;
        d.classList.toggle('is-active', on);
        if (on) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      $('[data-current]').textContent = pad(current + 1);
      if (autoplay && holds.size === 0) run(SLIDE_MS);
    }

    $('[data-prev]').addEventListener('click', () => goTo(current - 1));
    $('[data-next]').addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => goTo(k)));

    hero.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') goTo(current + 1);
      if (e.key === 'ArrowLeft') goTo(current - 1);
    });

    let swipeX = null;
    const slidesEl = $('[data-slides]');
    slidesEl.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
    slidesEl.addEventListener('pointerup', (e) => {
      if (swipeX === null) return;
      const dx = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
    });
    slidesEl.addEventListener('pointercancel', () => { swipeX = null; });

    hero.addEventListener('mouseenter', () => pause('hover'));
    hero.addEventListener('mouseleave', () => resume('hover'));
    hero.addEventListener('focusin', () => pause('focus'));
    hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) resume('focus'); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause('hidden');
      else resume('hidden');
    });

    goTo(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) resume('offscreen');
        else pause('offscreen');
      }, { threshold: 0.2 }).observe(hero);
    }

    /* Botões "Ver a casa" dentro do herói usam o delegado global [data-open] */
  }

  /* ---------- Listagem ---------- */
  function specsOf(h) {
    return [
      `${h.beds} quartos`,
      `${h.baths} casas de banho`,
      `${num.format(h.area)} m² úteis`,
      `${num.format(h.plot)} m² de terreno`
    ];
  }

  function buildListing(h, index) {
    const reserved = h.status === 'reserved';
    const fav = el('button', {
      class: 'fav-toggle', type: 'button', 'data-fav': h.id,
      'aria-pressed': String(isFav(h.id)),
      'aria-label': `${isFav(h.id) ? 'Remover' : 'Guardar'} ${h.name}`
    }, heartIcon());

    const media = el('figure', { class: 'listing-media' },
      el('img', { src: h.img, alt: `${h.name}, ${h.city}`, loading: 'lazy' }),
      el('span', { class: `listing-badge${reserved ? ' is-reserved' : ''}`, text: reserved ? 'Reservada' : 'Disponível' }),
      fav
    );

    const compareBox = el('input', { type: 'checkbox', 'data-compare': h.id });
    compareBox.checked = state.compare.includes(h.id);

    const body = el('div', { class: 'listing-body' },
      el('p', { class: 'listing-city', text: h.city }),
      el('h3', { text: h.name }),
      el('p', { class: 'listing-price', text: money(h.price) }),
      el('p', { class: 'listing-tagline', text: h.tagline }),
      el('p', { class: 'listing-desc', text: h.desc }),
      el('div', { class: 'spec-row' }, specsOf(h).map((s) => el('span', { class: 'spec', text: s }))),
      el('ul', { class: 'listing-why' }, h.why.map((w) => el('li', { text: w }))),
      el('div', { class: 'listing-actions' },
        el('button', { class: 'btn-ghost small', type: 'button', 'data-details': h.id, text: 'Ver detalhes' }),
        el('button', { class: 'btn small', type: 'button', 'data-visit-for': h.id, text: 'Pedir visita' }),
        el('label', { class: 'compare-check' }, compareBox, 'Comparar')
      )
    );

    return el('li', { class: `listing${index % 2 === 1 ? ' is-reverse' : ''}`, 'data-id': h.id }, media, body);
  }

  function visibleHouses() {
    let list = HOUSES.filter((h) =>
      (!state.city || h.city === state.city) &&
      h.beds >= state.beds &&
      h.price <= state.budget
    );
    if (state.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === 'area-desc') list = [...list].sort((a, b) => b.area - a.area);
    return list;
  }

  function renderListings() {
    const list = visibleHouses();
    $('[data-listings]').replaceChildren(...list.map((h, i) => buildListing(h, i)));
    $('[data-empty]').hidden = list.length > 0;
    $('[data-result-count]').textContent = list.length === 1 ? '1 casa encontrada' : `${list.length} casas encontradas`;
    const filtered = state.city !== '' || state.beds > 0 || state.budget < 4000000;
    $('[data-clear-filters]').classList.toggle('is-off', !filtered);
    $$('[data-city]').forEach((b) => {
      const on = b.dataset.city === state.city;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function syncControls() {
    $('[data-search-city]').value = state.city;
    $('[data-search-beds]').value = String(state.beds);
    $('[data-search-budget]').value = String(state.budget);
    $('[data-search-budget-label]').textContent = fmtBudget(state.budget);
    $('[data-sort]').value = state.sort;
  }

  function initListings() {
    $$('[data-city]').forEach((b) => {
      b.addEventListener('click', () => {
        state.city = b.dataset.city;
        syncControls();
        renderListings();
      });
    });

    $('[data-sort]').addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderListings();
    });

    const resetAll = () => {
      Object.assign(state, { city: '', beds: 0, budget: 4000000, sort: 'default' });
      syncControls();
      renderListings();
    };
    $('[data-reset]').addEventListener('click', resetAll);
    $('[data-clear-filters]').addEventListener('click', resetAll);

    const ul = $('[data-listings]');
    ul.addEventListener('click', (e) => {
      const details = e.target.closest('[data-details]');
      const visit = e.target.closest('[data-visit-for]');
      const fav = e.target.closest('[data-fav]');
      if (details) openHouse(details.dataset.details);
      else if (visit) prefillVisit(visit.dataset.visitFor);
      else if (fav) toggleFav(fav.dataset.fav);
    });
    ul.addEventListener('change', (e) => {
      if (!e.target.matches('[data-compare]')) return;
      const ok = toggleCompare(e.target.dataset.compare, e.target.checked);
      if (!ok) e.target.checked = false;
    });
  }

  /* ---------- Pesquisa do herói ---------- */
  function initHeroSearch() {
    const form = $('[data-search]');
    const range = $('[data-search-budget]');
    range.addEventListener('input', () => {
      $('[data-search-budget-label]').textContent = fmtBudget(Number(range.value));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      state.city = $('[data-search-city]').value;
      state.beds = Number($('[data-search-beds]').value);
      state.budget = Number(range.value);
      syncControls();
      renderListings();
      $('#imoveis').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      const n = visibleHouses().length;
      toast(n === 0 ? 'Nenhuma casa com estes critérios' : `${n} ${n === 1 ? 'casa' : 'casas'} com estes critérios`);
    });
  }

  /* ---------- Favoritos ---------- */
  function toggleFav(id) {
    const added = !isFav(id);
    favs = added ? [...favs, id] : favs.filter((x) => x !== id);
    storage.set('atlas-favs', favs);
    syncFavs();
    toast(added ? 'Guardada nos favoritos' : 'Removida dos favoritos');
  }

  function syncFavs() {
    $$('[data-fav]').forEach((b) => {
      const on = isFav(b.dataset.fav);
      const h = byId(b.dataset.fav);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${on ? 'Remover' : 'Guardar'} ${h.name}`);
    });
    const count = $('[data-fav-count]');
    count.textContent = String(favs.length);
    count.classList.toggle('has-items', favs.length > 0);
    $('[data-hd-fav]').textContent = currentHouse && isFav(currentHouse.id) ? 'Guardada' : 'Guardar';
    if (favDialog.open) renderFavs();
  }

  function renderFavs() {
    const list = $('[data-fav-list]');
    if (!favs.length) {
      list.replaceChildren(el('li', { class: 'fav-empty', style: 'display:block', text: 'Ainda não guardaste nenhuma casa.' }));
      return;
    }
    list.replaceChildren(...favs.map((id) => {
      const h = byId(id);
      return el('li', {},
        el('img', { src: h.img, alt: '' }),
        el('div', {}, el('strong', { text: h.name }), el('small', { text: `${h.city} · ${money(h.price)}` })),
        el('div', { class: 'fav-actions' },
          el('button', { type: 'button', 'data-fav-open': id, text: 'Ver' }),
          el('button', { type: 'button', 'data-fav-remove': id, text: 'Remover' })
        )
      );
    }));
  }

  function initFavorites() {
    $('[data-open-favorites]').addEventListener('click', () => {
      renderFavs();
      favDialog.showModal();
    });
    $('[data-fav-list]').addEventListener('click', (e) => {
      const open = e.target.closest('[data-fav-open]');
      const remove = e.target.closest('[data-fav-remove]');
      if (open) {
        favDialog.close();
        openHouse(open.dataset.favOpen);
      } else if (remove) {
        toggleFav(remove.dataset.favRemove);
      }
    });
  }

  /* ---------- Comparação ---------- */
  function toggleCompare(id, on) {
    if (on) {
      if (!state.compare.includes(id)) {
        if (state.compare.length >= MAX_COMPARE) {
          toast(`Podes comparar até ${MAX_COMPARE} casas de cada vez`);
          return false;
        }
        state.compare = [...state.compare, id];
      }
    } else {
      state.compare = state.compare.filter((x) => x !== id);
    }
    syncCompare();
    return true;
  }

  function syncCompare() {
    tray.hidden = state.compare.length === 0;
    $('[data-tray-count]').textContent = String(state.compare.length);
    $('[data-tray-chips]').replaceChildren(...state.compare.map((id) =>
      el('span', { class: 'tray-chip', text: byId(id).name })
    ));
    $('[data-open-compare]').disabled = state.compare.length < 2;
    $$('[data-compare]').forEach((cb) => { cb.checked = state.compare.includes(cb.dataset.compare); });
    const hdCompare = $('[data-hd-compare]');
    hdCompare.textContent = currentHouse && state.compare.includes(currentHouse.id) ? 'Na comparação' : 'Comparar';
  }

  function renderCompare() {
    const items = state.compare.map(byId);
    const rows = [
      ['Localização', (h) => h.city],
      ['Preço', (h) => money(h.price)],
      ['Quartos', (h) => h.beds],
      ['Casas de banho', (h) => h.baths],
      ['Área útil', (h) => `${num.format(h.area)} m²`],
      ['Terreno', (h) => `${num.format(h.plot)} m²`],
      ['Piscina', (h) => (h.pool ? 'Sim' : 'Não')],
      ['Estado', (h) => (h.status === 'reserved' ? 'Reservada' : 'Disponível')]
    ];
    const head = el('tr', {},
      el('td', { text: '' }),
      items.map((h) => el('th', {}, el('img', { src: h.img, alt: '' }), h.name))
    );
    const body = rows.map(([label, fn]) =>
      el('tr', {}, el('td', { text: label }), items.map((h) => el('td', { text: String(fn(h)) })))
    );
    $('[data-compare-table]').replaceChildren(el('tbody', {}, head, body));
  }

  function initCompare() {
    $('[data-open-compare]').addEventListener('click', () => {
      if (state.compare.length < 2) {
        toast('Escolhe pelo menos duas casas para comparar');
        return;
      }
      renderCompare();
      compareDialog.showModal();
    });
    $('[data-clear-compare]').addEventListener('click', () => {
      state.compare = [];
      syncCompare();
    });
  }

  /* ---------- Dialog de casa ---------- */
  function openHouse(id) {
    const h = byId(id);
    if (!h) return;
    currentHouse = h;
    const img = $('[data-hd-img]');
    img.src = h.img;
    img.alt = h.name;
    $('[data-hd-city]').textContent = h.city;
    $('[data-hd-name]').textContent = h.name;
    $('[data-hd-price]').textContent = money(h.price);
    $('[data-hd-desc]').textContent = h.desc;
    $('[data-hd-specs]').replaceChildren(...[
      ['Quartos', h.beds],
      ['Casas de banho', h.baths],
      ['Área útil', `${num.format(h.area)} m²`],
      ['Terreno', `${num.format(h.plot)} m²`],
      ['Piscina', h.pool ? 'Sim' : 'Não'],
      ['Estado', h.status === 'reserved' ? 'Reservada' : 'Disponível']
    ].map(([k, v]) => el('div', {}, el('dt', { text: k }), el('dd', { text: String(v) }))));
    $('[data-hd-why]').replaceChildren(...h.why.map((w) => el('li', { text: w })));
    $('[data-hd-features]').replaceChildren(...h.features.map((f) => el('li', { text: f })));
    syncFavs();
    syncCompare();
    houseDialog.showModal();
  }

  function initHouseDialog() {
    $('[data-hd-visit]').addEventListener('click', () => {
      const id = currentHouse.id;
      houseDialog.close();
      prefillVisit(id);
    });
    $('[data-hd-fav]').addEventListener('click', () => toggleFav(currentHouse.id));
    $('[data-hd-compare]').addEventListener('click', () => {
      const on = !state.compare.includes(currentHouse.id);
      toggleCompare(currentHouse.id, on);
    });
  }

  /* Fechar diálogos e clique no fundo */
  function initDialogs() {
    $$('dialog [data-close]').forEach((b) => {
      b.addEventListener('click', () => b.closest('dialog').close());
    });
    $$('dialog').forEach((d) => {
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    });
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open]');
      if (btn) openHouse(btn.dataset.open);
    });
  }

  /* ---------- Etapas (tabs ARIA) ---------- */
  function initStepper() {
    const tabs = $$('[data-tab]');
    const panel = $('[data-panel]');

    function showStep(i, focus = false) {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      const s = STEPS[i];
      $('[data-panel-title]').textContent = s.title;
      $('[data-panel-text]').textContent = s.text;
      $('[data-panel-points]').replaceChildren(...s.points.map((p) => el('li', { text: p })));
      panel.setAttribute('aria-labelledby', tabs[i].id);
      panel.classList.remove('is-changing');
      void panel.offsetWidth;
      panel.classList.add('is-changing');
      if (focus) tabs[i].focus();
    }

    tabs.forEach((t, k) => {
      t.addEventListener('click', () => showStep(k));
      t.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (k + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (k - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          showStep(next, true);
        }
      });
    });

    showStep(0);
  }

  /* ---------- Lista de verificação ---------- */
  function initChecklist() {
    const checks = $$('[data-check]');

    function sync() {
      checks.forEach((c) => { c.checked = !!checkState[c.dataset.check]; });
      const done = checks.filter((c) => c.checked).length;
      $('[data-check-label]').textContent = `${done} de ${checks.length}`;
      $('[data-check-bar]').style.width = `${(done / checks.length) * 100}%`;
      return done;
    }

    checks.forEach((c) => {
      c.addEventListener('change', () => {
        checkState[c.dataset.check] = c.checked;
        storage.set('atlas-checklist', checkState);
        const done = sync();
        if (done === CHECK_LABELS && c.checked) toast('Lista completa. Revemos tudo contigo quando quiseres.');
      });
    });

    $('[data-check-reset]').addEventListener('click', () => {
      checkState = {};
      storage.set('atlas-checklist', checkState);
      sync();
      toast('Lista reiniciada');
    });

    sync();
  }

  /* ---------- Simulador de crédito ---------- */
  function initSimulator() {
    const select = $('[data-sim-house]');
    const price = $('[data-sim-price]');
    const down = $('[data-sim-down]');
    const years = $('[data-sim-years]');
    const rate = $('[data-sim-rate]');

    select.append(...HOUSES.map((h) => el('option', { value: h.id, text: `${h.name}, ${h.city}` })));
    select.value = HOUSES[0].id;
    price.value = String(HOUSES[0].price);

    function calc() {
      const p = Number(price.value);
      const d = Number(down.value);
      const y = Number(years.value);
      const r = Number(rate.value);
      const loan = p * (1 - d / 100);
      const i = r / 100 / 12;
      const n = y * 12;
      const monthly = i === 0 ? loan / n : (loan * i) / (1 - Math.pow(1 + i, -n));
      const total = monthly * n;
      const interest = Math.max(0, total - loan);
      const capitalShare = total > 0 ? Math.min(100, (loan / total) * 100) : 100;

      $('[data-sim-price-label]').textContent = money(p);
      $('[data-sim-down-label]').textContent = `${d}% · ${money(p * d / 100)}`;
      $('[data-sim-years-label]').textContent = `${y} anos`;
      $('[data-sim-rate-label]').textContent = `${r.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
      $('[data-sim-monthly]').textContent = money(monthly);
      $('[data-sim-capital]').style.width = `${capitalShare}%`;
      $('[data-sim-interest]').style.width = `${100 - capitalShare}%`;
      $('[data-sim-loan]').textContent = money(loan);
      $('[data-sim-total]').textContent = money(total);
      return interest;
    }

    select.addEventListener('change', () => {
      const h = byId(select.value);
      price.value = String(h.price);
      calc();
    });
    [price, down, years, rate].forEach((input) => input.addEventListener('input', calc));
    calc();
  }

  /* ---------- Perguntas frequentes ---------- */
  const STOP = new Set([
    'como', 'que', 'qual', 'quais', 'posso', 'pode', 'para', 'com', 'uma', 'uns', 'dos', 'das',
    'numa', 'onde', 'quanto', 'devo', 'fazer', 'sobre', 'sim', 'nao', 'isso', 'esta', 'este',
    'uma', 'the', 'por', 'pelo', 'pela', 'nos', 'nas', 'ser', 'ter', 'mais', 'muito', 'meu', 'minha',
    'teu', 'tua', 'quando', 'faz', 'fica', 'ficar', 'aos', 'das'
  ]);
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));

  function initFaq() {
    const form = $('[data-ask]');
    const input = $('[data-ask-input]');
    const answer = $('[data-ask-answer]');
    const items = $$('[data-faq] details');
    const index = items.map((d) => {
      const q = d.querySelector('summary').textContent;
      return { el: d, q, words: new Set([...tokens(d.dataset.kw || ''), ...tokens(q)]) };
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      items.forEach((d) => d.classList.remove('is-highlight'));
      const words = [...new Set(tokens(input.value))];
      if (!words.length) {
        answer.textContent = 'Escreve uma palavra-chave, por exemplo “sinal”, “crédito” ou “visita”.';
        answer.classList.add('is-miss');
        return;
      }
      let best = null;
      let bestScore = 0;
      for (const item of index) {
        const score = words.reduce((total, w) => {
          if (item.words.has(w)) return total + 2;
          if (w.length >= 4 && [...item.words].some((x) => x.startsWith(w.slice(0, 4)))) return total + 1;
          return total;
        }, 0);
        if (score > bestScore) {
          best = item;
          bestScore = score;
        }
      }
      if (best) {
        best.el.open = true;
        best.el.classList.add('is-highlight');
        answer.textContent = `Esta resposta pode ajudar: “${best.q}”`;
        answer.classList.remove('is-miss');
        best.el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => best.el.classList.remove('is-highlight'), 2600);
      } else {
        answer.textContent = 'Não encontrámos uma resposta direta. Envia a tua dúvida no formulário de contacto e respondemos por escrito ou ao telefone.';
        answer.classList.add('is-miss');
      }
    });
  }

  /* ---------- Testemunhos e contadores ---------- */
  function animateCount(node) {
    const to = Number(node.dataset.count);
    if (reduceMotion) {
      node.textContent = String(to);
      return;
    }
    const t0 = performance.now();
    const dur = 1400;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = String(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Formulário de visita ---------- */
  function prefillVisit(id) {
    $('[data-visit-house]').value = id;
    $('#contacto').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => $('#v-name').focus({ preventScroll: true }), reduceMotion ? 0 : 500);
  }

  function initVisitForm() {
    const form = $('[data-visit]');
    const house = $('[data-visit-house]');
    const date = $('#v-date');
    const time = $('#v-time');
    const note = $('[data-visit-note]');

    house.append(el('option', { value: '', text: 'Escolhe uma casa' }),
      ...HOUSES.map((h) => el('option', { value: h.id, text: `${h.name} · ${h.city}` })));
    date.min = todayISO();

    const rules = {
      name: (v) => (v.trim().length >= 2 ? '' : 'Indica o teu nome.'),
      contact: (v) => {
        const t = v.trim();
        if (!t) return 'Indica um email ou um telefone.';
        if (t.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t) ? '' : 'Email inválido.';
        const digits = t.replace(/[\s+]/g, '').replace(/^351/, '');
        return /^\d{9}$/.test(digits) ? '' : 'Telefone inválido, com 9 dígitos.';
      },
      house: (v) => (v ? '' : 'Escolhe a casa.'),
      date: (v) => {
        if (!v) return 'Escolhe um dia.';
        if (v < todayISO()) return 'Escolhe um dia a partir de hoje.';
        const [y, m, d] = v.split('-').map(Number);
        if (new Date(y, m - 1, d).getDay() === 0) return 'Não fazemos visitas ao domingo.';
        return '';
      }
    };

    function setFieldError(input, msg) {
      const holder = input.closest('.field');
      if (!holder) return;
      let err = holder.querySelector('.error');
      if (!err) {
        err = el('small', { class: 'error', 'aria-live': 'polite' });
        holder.append(err);
      }
      err.textContent = msg;
      holder.classList.toggle('has-error', !!msg);
    }

    /* Limpa o erro assim que o campo muda */
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('input', () => setFieldError(input, ''));
      input.addEventListener('change', () => setFieldError(input, ''));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const checks = [
        [$('#v-name'), rules.name($('#v-name').value)],
        [$('#v-contact'), rules.contact($('#v-contact').value)],
        [house, rules.house(house.value)],
        [date, rules.date(date.value)]
      ];

      /* Ao sábado, o atendimento termina às 13h */
      let timeMsg = '';
      if (date.value && !rules.date(date.value)) {
        const [y, m, d] = date.value.split('-').map(Number);
        if (new Date(y, m - 1, d).getDay() === 6 && time.value >= '13:00') {
          timeMsg = 'Ao sábado atendemos até às 13h.';
        }
      }
      checks.push([time, timeMsg]);

      let firstBad = null;
      checks.forEach(([input, msg]) => {
        setFieldError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });

      const consent = form.querySelector('input[name="consent"]');
      const consentError = form.querySelector('.consent-error');
      if (!consent.checked) {
        consentError.textContent = 'Precisamos da tua autorização para te contactar sobre a visita.';
        if (!firstBad) firstBad = consent;
      } else {
        consentError.textContent = '';
      }

      if (firstBad) {
        note.textContent = 'Revê os campos assinalados.';
        firstBad.focus();
        return;
      }

      const h = byId(house.value);
      const [y, m, d] = date.value.split('-');
      note.textContent = `Pedido recebido para ${h.name}, a ${d}/${m}/${y} às ${time.value}. Confirmamos por email ou telefone.`;
      form.reset();
      date.min = todayISO();
    });
  }

  /* ---------- Revelação, contadores e nav ativa ---------- */
  function initObservers() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((n) => n.classList.add('is-visible'));
      $$('[data-count]').forEach(animateCount);
      return;
    }

    const reveal = new IntersectionObserver((entries, io) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((n) => reveal.observe(n));

    const counters = new IntersectionObserver((entries, io) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        animateCount(en.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((n) => counters.observe(n));

    const navLinks = $$('.primary-nav > a:not(.nav-cta)');
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => sections.observe(s));
  }

  /* ---------- Botões magnéticos (só com rato) ---------- */
  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('.hero .btn, .visit-form .submit').forEach((b) => {
      b.classList.add('magnetic');
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Arranque ---------- */
  function init() {
    initHero();
    initHeroSearch();
    initListings();
    renderListings();
    syncControls();
    initFavorites();
    initCompare();
    initHouseDialog();
    initDialogs();
    initStepper();
    initChecklist();
    initSimulator();
    initFaq();
    initVisitForm();
    initObservers();
    initMagnetic();
    syncFavs();
    syncCompare();
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();