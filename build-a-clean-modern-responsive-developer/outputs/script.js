(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portal = document.querySelector('.portal');
  const hero = document.querySelector('.hero-image');

  document.querySelectorAll('.cert-preview img').forEach(img => {
    const placeholder = img.nextElementSibling;
    if (!placeholder || !placeholder.classList.contains('placeholder')) return;
    if (img.complete && img.naturalWidth) placeholder.hidden = true;
    else img.addEventListener('load', () => { placeholder.hidden = true; });
  });

  const wash = document.querySelector('.hero-wash');
  const panels = document.querySelectorAll('.portal-panel');
  const title = document.querySelector('.portal-title');
  const titleParts = title.querySelectorAll(':scope > span');
  const spark = document.querySelector('.spark');
  const orb = document.querySelector('.statement-orb');
  const scrollProgress = document.querySelector('.scroll-progress');
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  let queued = false;

  function paintPortal() {
    queued = false;
    const pageRange = document.documentElement.scrollHeight - innerHeight;
    scrollProgress.style.transform = `scaleX(${pageRange > 0 ? clamp(scrollY / pageRange, 0, 1) : 0})`;
    if (reduce) return;

    const rect = portal.getBoundingClientRect();
    const scrollRange = (portal.offsetHeight - innerHeight) * .58;
    const progress = scrollRange > 0 ? clamp(-rect.top / scrollRange, 0, 1) : 1;

    panels[0].style.transform = `translateX(${-progress * 108}%)`;
    panels[1].style.transform = `translateX(${progress * 108}%)`;
    hero.style.transform = `scale(${1.12 - progress * .12})`;
    wash.style.opacity = String(progress * .14);
    title.style.transform = `translate(-50%,-50%) scale(${1 + progress * .12})`;
    title.style.letterSpacing = `${-.055 + progress * .025}em`;
    titleParts[0].style.transform = `translateX(${-progress * 13}vw)`;
    titleParts[1].style.transform = `translateX(${progress * 13}vw)`;
    spark.style.transform = `translate(calc(-50% + ${progress * 36}vw),calc(-50% - ${progress * 25}vh))`;
    spark.style.opacity = String(.85 - progress * .35);
  }

  function requestPaint() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(paintPortal);
    }
  }

  addEventListener('scroll', requestPaint, { passive: true });
  addEventListener('resize', requestPaint);
  requestPaint();

  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  if (!reduce && 'IntersectionObserver' in window) {
    const drift = () => {
      const r = orb.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      orb.style.transform = `translateY(${(p - .5) * 42}px) rotate(${(p - .5) * 10}deg)`;
    };
    addEventListener('scroll', drift, { passive: true });
    drift();
  }

  const deck = document.querySelector('.project-deck');
  const cards = [...deck.querySelectorAll('.project-card')];
  const dots = document.querySelector('.deck-dots');
  let index = 0;
  let drag = null;
  let locked = false;

  cards.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'deck-dot' + (i === 0 ? ' active' : '');
    dots.append(d);
  });

  function updateDeck() {
    cards.forEach((card, i) => {
      const offset = (i - index + cards.length) % cards.length;
      card.style.zIndex = String(cards.length - offset);
      card.style.transform = offset === 0
        ? 'translate(0,0) rotate(0) scale(1)'
        : `translate(${offset % 2 ? 9 : -10}px,${offset % 2 ? -7 : 8}px) rotate(${offset % 2 ? 2.2 : -2.7}deg) scale(${1 - offset * .012})`;
      card.style.opacity = offset > 3 ? '.5' : '1';
      card.style.pointerEvents = offset === 0 ? 'auto' : 'none';
    });
    [...dots.children].forEach((d, i) => d.classList.toggle('active', i === index));
  }

  function advance(dir) {
    if (locked) return;
    locked = true;
    const c = cards[index];
    const duration = reduce ? 0 : 470;
    c.style.transition = `transform ${duration}ms cubic-bezier(.18,.8,.2,1),opacity ${Math.min(duration, 320)}ms ease`;
    c.style.transform = `translate(${dir * deck.clientWidth * 1.1}px,-55px) rotate(${dir * 19}deg) scale(1.04)`;
    c.style.opacity = '0';

    setTimeout(() => {
      index = (index + 1) % cards.length;
      c.style.transition = 'none';
      updateDeck();
      requestAnimationFrame(() => cards.forEach(card => {
        card.style.transition = 'transform .46s cubic-bezier(.18,.8,.2,1),opacity .32s ease';
      }));
      locked = false;
    }, duration);
  }

  deck.addEventListener('pointerdown', e => {
    if (locked || e.target.closest('a,button')) return;
    const c = cards[index];
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, card: c };
    deck.setPointerCapture(e.pointerId);
    c.style.transition = 'none';
  });

  deck.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag.card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx * .035}deg) scale(1.02)`;
  });

  function release(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const card = drag.card;
    card.style.transition = 'transform .38s ease,opacity .38s';
    if (Math.abs(dx) > deck.clientWidth * .1) {
      advance(dx > 0 ? 1 : -1);
    } else {
      updateDeck();
    }
    drag = null;
  }

  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', () => {
    drag = null;
    updateDeck();
  });

  deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      advance(-1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      advance(1);
    }
  });

  document.querySelector('[data-deck-next]').addEventListener('click', () => advance(-1));
  document.querySelector('[data-deck-prev]').addEventListener('click', () => advance(1));
  updateDeck();
})();