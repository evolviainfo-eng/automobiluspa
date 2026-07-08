/* autoMobiluSPA — interactions
   inspection-lamp hero · swipe-rail · reveals · smooth scroll */
(function () {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- client contact (TODO: confirm with client) ---------- */
  const CLIENT_EMAIL = 'automobiluspa@gmail.com'; // client's real email

  /* ---------- year ---------- */
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ================= Lenis smooth scroll ================= */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const navH = 66;
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - navH;
      if (lenis) lenis.scrollTo(y, { duration: 1.1 });
      else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ================= nav scrolled state ================= */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScrollNav();
  addEventListener('scroll', onScrollNav, { passive: true });

  /* ================= reveal on scroll (fail-to-visible) ================= */
  const revealEls = $$('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
    // safety: reveal anything already in view if the observer is slow / tab was backgrounded
    const forceInView = () => revealEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
    addEventListener('load', () => setTimeout(forceInView, 350));
    addEventListener('visibilitychange', () => { if (!document.hidden) forceInView(); });
  }

  /* ================= HERO — inspection lamp ================= */
  const hero = $('#hero');
  const media = $('#lamp');
  const glow = $('.hero__img--glow');
  if (hero && media && glow) {
    const setLamp = (px, py, r) => {
      glow.style.setProperty('--mx', px + '%');
      glow.style.setProperty('--my', py + '%');
      if (r) glow.style.setProperty('--lr', r);
    };
    if (finePointer && !reduce) {
      hero.classList.add('hint-show');
      let raf = 0, tx = 50, ty = 44, cx = 50, cy = 44;
      const loop = () => { cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16; setLamp(cx.toFixed(1), cy.toFixed(1)); raf = requestAnimationFrame(loop); };
      media.addEventListener('pointerenter', () => { media.classList.add('lamp-on'); if (!raf) loop(); });
      media.addEventListener('pointermove', (e) => {
        const b = media.getBoundingClientRect();
        tx = ((e.clientX - b.left) / b.width) * 100;
        ty = ((e.clientY - b.top) / b.height) * 100;
        hero.classList.remove('hint-show');
      });
      media.addEventListener('pointerleave', () => { media.classList.remove('lamp-on'); cancelAnimationFrame(raf); raf = 0; });
    } else if (!reduce) {
      // mobile / coarse pointer: light gently drifts across the panel on its own
      media.classList.add('lamp-on');
      let t = 0;
      const drift = () => {
        t += 0.006;
        const px = 50 + Math.sin(t) * 30;
        const py = 44 + Math.sin(t * 1.7) * 16;
        setLamp(px.toFixed(1), py.toFixed(1), 'min(52vw,380px)');
        requestAnimationFrame(drift);
      };
      drift();
    }
  }

  /* ================= WORKS rail ================= */
  const rail = $('#rail');
  if (rail) {
    const track = $('#railTrack');
    const bar = $('#railBar');
    const cur = $('#railCur');
    const tot = $('#railTot');
    const hint = $('#railHint');
    const cards = $$('.work', track);
    if (tot) tot.textContent = String(cards.length).padStart(2, '0');
    let hintGone = false;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 0;
      if (bar) bar.style.width = (8 + p * 92) + '%';
      // nearest card to center
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let idx = 0, best = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(cc - center);
        if (d < best) { best = d; idx = i; }
      });
      if (cur) cur.textContent = String(idx + 1).padStart(2, '0');
      if (!hintGone && rail.scrollLeft > 40 && hint) { hint.classList.add('hide'); hintGone = true; }
    };
    update();
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    // drag-to-scroll (desktop)
    let down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      down = true; sx = e.clientX; sl = rail.scrollLeft; moved = 0; rail.classList.add('dragging');
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.abs(dx);
      rail.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { if (down) { down = false; rail.classList.remove('dragging'); } });
    // don't let a drag trigger link/image click accidentally
    track.addEventListener('click', (e) => { if (moved > 6) e.preventDefault(); }, true);
  }

  /* ================= studio bg parallax ================= */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    const bg = $('.studio__bg');
    if (bg) {
      gsap.fromTo(bg, { yPercent: -8 }, {
        yPercent: 8, ease: 'none', force3D: true,
        scrollTrigger: { trigger: '.studio', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ================= sticky call bar ================= */
  const callbar = $('#callbar');
  const contact = $('#kontaktai');
  if (callbar && hero) {
    const io2 = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.target === hero) heroOut = !en.isIntersecting;
        if (en.target === contact) contactIn = en.isIntersecting;
        toggle();
      });
    }, { threshold: 0.05 });
    let heroOut = false, contactIn = false;
    const toggle = () => callbar.classList.toggle('show', heroOut && !contactIn);
    io2.observe(hero);
    if (contact) io2.observe(contact);
  }

  /* ================= form ================= */
  const form = $('#bookForm');
  if (form) {
    const ok = $('#formOk');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const name = $('#f-name').value.trim();
      const phone = $('#f-phone').value.trim();
      const msg = $('#f-msg').value.trim();
      const subject = encodeURIComponent('Užklausa iš svetainės — ' + (name || 'klientas'));
      const body = encodeURIComponent(
        'Vardas: ' + name + '\nTelefonas: ' + phone + '\n\nUžklausa:\n' + (msg || '(nenurodyta)') + '\n'
      );
      if (ok) { ok.hidden = false; }
      form.querySelector('button[type="submit"]').textContent = 'Užklausa paruošta ✓';
      setTimeout(() => { window.location.href = 'mailto:' + CLIENT_EMAIL + '?subject=' + subject + '&body=' + body; }, 500);
    });
  }
})();
