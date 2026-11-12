/* Clínica Dental Airam — comportamiento de las páginas internas (sin dependencias) */
(function () {
  var d = document;

  /* Año del pie */
  d.querySelectorAll('.y').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* Menú móvil */
  var btn = d.querySelector('.menu-btn'), panel = d.getElementById('mnav');
  if (btn && panel) {
    var label = btn.querySelector('.sr-only');
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
      if (open) { var f = panel.querySelector('a'); if (f) f.focus(); }
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); } });
  }

  /* Mapa: solo se carga cuando la persona pulsa el botón */
  d.querySelectorAll('[data-load-map]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('.map'), f = d.createElement('iframe');
      f.title = 'Mapa: Clínica Dental Airam, Avenida del Nuevo Mundo 7, Boadilla del Monte';
      f.src = box.getAttribute('data-src');
      f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      box.innerHTML = ''; box.appendChild(f); f.focus();
    });
  });

  /* Horario: estado orientativo según el horario habitual (zona Europe/Madrid, incluye horario de verano) */
  var A = window.AIRAM || {}, H = A.hours || [], EX = (A.exceptions && A.exceptions.dates) || [];
  function madrid() {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    return { d: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], m: (+o.hour % 24) * 60 + (+o.minute), date: o.year + '-' + o.month + '-' + o.day };
  }
  var toMin = function (s) { var a = s.split(':'); return +a[0] * 60 + +a[1]; };
  try {
    var now = madrid();
    d.querySelectorAll('.hours tr').forEach(function (tr) { if ((tr.getAttribute('data-d') || '').split(' ').indexOf(String(now.d)) > -1) tr.classList.add('today'); });
    var st = d.querySelector('[data-status]');
    if (st) {
      var ex = EX.filter(function (e) { return e.date === now.date; })[0];
      var today = H.filter(function (h) { return h.days.indexOf(now.d) > -1; })[0];
      var t, s;
      if (ex && ex.closed) { t = 'Hoy cerrado'; s = ex.note || 'Cierre extraordinario.'; }
      else {
        var o = ex ? ex : today;
        var open = o && !o.closed && now.m >= toMin(o.open) && now.m < toMin(o.close);
        var qual = A.exceptions && A.exceptions.validated ? '' : ' según el horario habitual';
        t = open ? 'Abierto ahora' + qual : 'Cerrado ahora' + qual;
        s = open ? 'Hoy hasta las ' + o.close + ' h. Los festivos y cierres puntuales pueden cambiarlo.' : 'Los festivos y cierres puntuales pueden cambiar el horario. Llámanos si tienes dudas.';
      }
      st.innerHTML = '<b>' + t + '</b><span>' + s + '</span>';
    }
  } catch (e) {}

  /* Galería ampliable (dialog nativo: Esc cierra, foco atrapado por el navegador) */
  var dlg = d.querySelector('.lightbox'), data = d.getElementById('gallery-data');
  if (dlg && data && dlg.showModal) {
    var items = JSON.parse(data.textContent), i = 0, opener = null;
    var im = dlg.querySelector('img'), cap = dlg.querySelector('figcaption');
    function show(n) { i = (n + items.length) % items.length; im.src = items[i].src; im.alt = items[i].alt; cap.textContent = items[i].caption + ' (' + (i + 1) + ' de ' + items.length + ')'; }
    d.querySelectorAll('.g-item').forEach(function (b) {
      b.addEventListener('click', function () { opener = b; show(+b.getAttribute('data-g')); dlg.showModal(); dlg.querySelector('.lb-close').focus(); });
    });
    dlg.querySelector('.lb-prev').addEventListener('click', function () { show(i - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { show(i + 1); });
    dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
})();
