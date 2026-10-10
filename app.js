/* Движение. Без этого файла страница остаётся цельной: шаги идут списком, досье заполнено. */
(function () {
  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !window.gsap || !window.ScrollTrigger) { root.classList.remove('js-wait'); return; }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  var clamp = gsap.utils.clamp(0, 1);

  /* Плавная прокрутка — один движок на страницу */
  if (window.Lenis) {
    var lenis = new Lenis({ anchors: true, lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;          // «живой» вариант сам листает страницу через этот же движок
  }

  /* ── Первый экран ── */
  function hero() {
    var title = document.querySelector('.hero__title');
    var rest = gsap.utils.toArray('.hero__meta, .hero__foot, .strip li:not(.strip__line)');
    gsap.set(rest, { autoAlpha: 0, y: 14 });
    gsap.set('.strip__line i', { scaleX: 0 });
    gsap.set('.strip__line b', { autoAlpha: 0 });
    SplitText.create(title, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (self) {
        root.classList.remove('js-wait');
        return gsap.from(self.lines, { yPercent: 108, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.1 });
      }
    });
    gsap.to(rest, { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.07, delay: 0.7 });
    gsap.to('.strip__line i', { scaleX: 1, duration: 1.6, ease: 'expo.inOut', delay: 0.9 });
    gsap.to('.strip__line b', { autoAlpha: 1, duration: 0.4, delay: 2.3 });
  }

  /* ── Задача: слова проявляются по мере чтения ── */
  function task() {
    var el = document.querySelector('[data-words]');
    if (!el) return;
    SplitText.create(el, {
      type: 'words', wordsClass: 'w', autoSplit: true,
      onSplit: function (self) {
        return gsap.to(self.words, { opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true } });
      }
    });
    gsap.from('.task__facts > div', { y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.task__facts', start: 'top 86%' } });
  }

  /* ── Фото-полоса ── */
  function band() {
    gsap.fromTo('.band__media img', { yPercent: -8, scale: 1.14 }, { yPercent: 8, scale: 1.14, ease: 'none',
      scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
    SplitText.create('.band__text', {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 108, duration: 1.05, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: { trigger: '.band__text', start: 'top 82%' } });
      }
    });
  }

  /* ── Одна сделка: всё на экране выводится из одной цифры — насколько прокручено ── */
  function deal() {
    var track = document.querySelector('.deal');
    var steps = gsap.utils.toArray('[data-step]');
    var N = steps.length;
    if (!track || !N) return;
    var rows = gsap.utils.toArray('.row').map(function (el) {
      return { el: el, at: +el.dataset.at, swap: el.dataset.swap ? +el.dataset.swap : 0 };
    });
    var stamps = gsap.utils.toArray('.stamp i');
    var bar = document.querySelector('.dossier__bar i');
    var shown = -1, st = null, stage = track.querySelector('.deal__stage'), box = track.querySelector('.steps');

    function draw(p) {
      var u = clamp(p) * N;
      var k = Math.min(N - 1, Math.floor(u));          // текущий шаг, 0…N-1
      if (bar) bar.style.transform = 'scaleX(' + clamp((u + 0.15) / N).toFixed(4) + ')';
      if (k === shown) return;
      shown = k;
      steps.forEach(function (s, i) {
        s.classList.toggle('is-on', i === k);
        s.toggleAttribute('inert', i !== k);
      });
      stamps.forEach(function (s, i) { s.classList.toggle('is-on', i === k); });
      rows.forEach(function (r) {
        r.el.classList.toggle('is-done', r.at <= k + 1);
        r.el.classList.toggle('is-new', r.at === k + 1 || r.swap === k + 1);
        r.el.classList.toggle('is-swapped', !!r.swap && r.swap <= k + 1);
      });
    }
    function pin() {
      root.classList.remove('deal-flat'); root.classList.add('js-deal');
      shown = -1;
      st = ScrollTrigger.create({
        trigger: track, start: 'top top', end: 'bottom bottom',
        onUpdate: function (s) { draw(s.progress); },
        onRefresh: function (s) { draw(s.progress); }
      });
      draw(st.progress || 0);
    }
    function unpin() {
      if (st) { st.kill(); st = null; }
      root.classList.remove('js-deal'); root.classList.add('deal-flat');
      if (bar) bar.style.transform = '';
      steps.forEach(function (s) { s.classList.remove('is-on'); s.removeAttribute('inert'); });
      stamps.forEach(function (s) { s.classList.remove('is-on'); });
      rows.forEach(function (r) { r.el.classList.remove('is-done', 'is-new', 'is-swapped'); });
    }
    /* Закрепляем сцену, только если досье и самый длинный шаг целиком помещаются в окно.
       Иначе низ карточки срежется, а докрутить до него в закреплённой сцене нельзя. */
    function fits() {
      var was = root.classList.contains('js-deal');
      root.classList.remove('deal-flat'); root.classList.add('js-deal');
      var phone = matchMedia('(max-width:699px)').matches;
      var ok = stage.scrollHeight <= stage.clientHeight + 1;
      if (ok && box) {
        var tallest = 0; steps.forEach(function (s) { tallest = Math.max(tallest, s.offsetHeight); });
        if (phone && tallest > box.clientHeight + 1) ok = false;
      }
      if (!was) root.classList.remove('js-deal');
      return ok;
    }
    function settle() {
      var ok = fits();
      if (ok && !st) pin();
      else if (!ok && (st || !root.classList.contains('deal-flat'))) unpin();
    }
    settle();
    var wait = 0, lastW = innerWidth, lastH = innerHeight;
    window.addEventListener('resize', function () {
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;   // адресная строка телефона ездит — это не повод перестраивать
      lastW = innerWidth; lastH = innerHeight;
      clearTimeout(wait); wait = setTimeout(function () { settle(); ScrollTrigger.refresh(); }, 220);
    });
  }

  /* ── Три потока: линии дотягиваются от отправителя к получателю ── */
  function flows() {
    var lines = gsap.utils.toArray('.lane__track i');
    if (!lines.length) return;
    gsap.set(lines, { scaleX: 0 });
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.lanes', start: 'top 72%', end: 'bottom 48%', scrub: 0.6 } });
    lines.forEach(function (l, i) { tl.to(l, { scaleX: 1, ease: 'none' }, i ? '>-0.2' : 0); });
  }

  /* ── Заголовки и строки появляются при входе в экран ── */
  function reveals() {
    gsap.utils.toArray('.head h2').forEach(function (h) {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 108, duration: 1, ease: 'expo.out', stagger: 0.09,
            scrollTrigger: { trigger: h, start: 'top 86%' } });
        }
      });
    });
    ['.ledger', '.ticks', '.crosses', '.pilot__steps', '.trio ul', '.terms ol'].forEach(function (sel) {
      gsap.utils.toArray(sel).forEach(function (list) {
        gsap.from(list.children, { y: 24, autoAlpha: 0, duration: 0.75, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: list, start: 'top 84%' } });
      });
    });
    gsap.utils.toArray('.flows__say, .check__say, .gain__say').forEach(function (p) {
      gsap.from(p, { y: 26, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 86%' } });
    });
  }

  /* ── Контакты ── */
  function contact() {
    var title = document.querySelector('.contact__title');
    gsap.fromTo('.contact__media img', { yPercent: -8, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    SplitText.create(title, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 108, duration: 1.1, ease: 'expo.out', stagger: 0.1,
          scrollTrigger: { trigger: title, start: 'top 86%' } });
      }
    });
    gsap.from('.contact__ways > *, .contact__firm', { y: 22, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.contact__ways', start: 'top 92%' } });
  }

  function start() {
    deal(); hero(); task(); band(); flows(); reveals(); contact();
    ScrollTrigger.refresh();
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start, start);
  window.addEventListener('pageshow', function () { ScrollTrigger.refresh(); });
})();
