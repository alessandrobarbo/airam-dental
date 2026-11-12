// Ajuste único de src/index.html para a nova estrutura (executar uma vez). Cada substituição é verificada.
import fs from 'node:fs';
const F = new URL('../src/index.html', import.meta.url);
let h = fs.readFileSync(F, 'utf8');
const done = [];
function rep(find, repl, { all = false } = {}) {
  if (!h.includes(find)) throw new Error('NO ENCONTRADO: ' + find.slice(0, 90));
  h = all ? h.split(find).join(repl) : h.replace(find, repl);
  done.push(find.slice(0, 50));
}

// marcadores do build
rep('<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="viewport" content="width=device-width, initial-scale=1">\n<!--@head-->');
rep('<header class="site-header" id="top">', '<header class="site-header" id="top">\n  <!--@banner-->');

// navegação principal e móvel
const navOld = `      <a href="#especialidades">Especialidades</a>
      <a href="#clinica">La clínica</a>
      <a href="#equipo">Equipo</a>
      <a href="#opiniones">Opiniones</a>
      <a href="#contacto">Contacto</a>`;
const navNew = `      <a href="#especialidades">Tratamientos</a>
      <a href="#clinica">Clínica</a>
      <a href="#equipo">Equipo</a>
      <a href="#opiniones">Opiniones</a>
      <a href="recomendaciones/">Recomendaciones</a>
      <a href="noticias/">Blog</a>
      <a href="#contacto">Contacto</a>`;
rep(navOld, navNew);
rep(navOld.replace(/^      /gm, '    '), navNew.replace(/^      /gm, '    '));

// "Pedir cita" -> "Solicitar cita" (é um pedido de contato, não uma reserva confirmada)
rep('Pedir cita por WhatsApp', 'Solicitar cita por WhatsApp', { all: true });
rep('</svg>Pedir cita</a>', '</svg>Solicitar cita</a>', { all: true });
rep('Hola, me gustaría pedir cita en Clínica Dental Airam.', 'Hola, me gustaría solicitar cita en Clínica Dental Airam.');

// "Más información" em cada tratamento do acordeão
const MAP = { 'ortodoncia': ['ortodoncia', 'ortodoncia'], 'implantes dentales': ['implantologia', 'implantología'], 'odontopediatría': ['odontopediatria', 'odontopediatría'],
  'estética dental': ['estetica-dental', 'estética dental'], 'blanqueamiento dental': ['blanqueamiento-dental', 'blanqueamiento dental'], 'odontología restauradora': ['restauradora', 'odontología restauradora'],
  'endodoncia': ['endodoncia', 'endodoncia'], 'prótesis dentales': ['protesis', 'prótesis dental'], 'cirugía dental': ['cirugia-dental', 'cirugía dental'], 'periodoncia': ['periodoncia', 'periodoncia'] };
let n = 0;
h = h.replace(/(<a class="ask" data-wa="([^"]+)"[^>]*>[\s\S]*?<\/a>)/g, (m, a, topic) => {
  const t = MAP[topic]; if (!t) return m; n++;
  return `<span class="esp-links">${a}<a class="more" href="${t[0]}/">Más información<span class="sr-only"> sobre ${t[1]}</span></a></span>`;
});
if (n !== 10) throw new Error('enlaces «Más información»: ' + n);
rep('</svg>Preguntar por la sedación</a>', '</svg>Preguntar por la sedación</a>\n          <a class="btn btn-line" href="sedacion-consciente/">Más información sobre la sedación</a>');

// contadores estáticos (sem números provisórios durante a animação)
rep('<div><dt>Especialidades</dt>', '<div><dt>Especialidades, además de la sedación consciente</dt>');
rep('data-since="2000">26</span>', 'data-since="2000"><!--@years--></span>');
rep('var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));', 'var counters = []; /* contadores estáticos: sin animación para no mostrar cifras provisionales */');

// equipe: gerada a partir de src/data/team.json
const s = h.indexOf('      <div class="docs">');
const e = h.indexOf('\n    </div>\n  </section>', s);
if (s < 0 || e < 0) throw new Error('bloque de equipo');
h = h.slice(0, s) + '      <!--@team-->\n      <p class="team-more rv"><a class="btn btn-line" href="equipo/">Conocer al equipo y su forma de trabajar</a></p>' + h.slice(e);
rep('<p>Detrás de cada sonrisa hay un equipo que se conoce bien y trabaja mano a mano.</p>', '<p>Detrás de cada sonrisa hay un equipo que se conoce bien y trabaja mano a mano desde hace años.</p>');

// depoimentos completos (texto íntegro publicado na web atual)
rep('Llevamos ya muchos años llevando a mis 3 hijas y estamos encantados con el trato recibido. Son un equipo de personas muy profesionales y que inspiran confianza. Totalmente recomendable.',
  'Llevamos ya muchos años llevando a mis 3 hijas y estamos encantados con el trato recibido. Son un equipo de personas muy profesionales y que inspiran confianza. María, Noelia, Maria y Liliana todas unas bellísimas personas que nos tratan con familiaridad y dedicación. Totalmente recomendable.');
rep('Llevo visitando la clínica varios años, tanto yo como mi familia estamos muy contentos. Tuve muy malas experiencias antes y ahora que he encontrado un sitio de confianza no lo cambio.',
  'Llevo visitando la clínica varios años, tanto yo como mi familia estamos muy contentos. Muy buen trato, el equipo muy amable y muy profesional. Tuve muy malas experiencias antes y ahora que he encontrado un sitio de confianza no lo cambio. Seguiré con ellos sin duda os lo recomiendo un montón');
rep('<span>Paciente</span></figcaption>', '<span>Opinión publicada en la web de la clínica</span></figcaption>', { all: true });

// horário: dados centralizados + indicação qualificada
const hs = h.indexOf('  /* Horario: abierto/cerrado según la hora de Madrid */');
const he = h.indexOf('  }catch(e){}', hs);
if (hs < 0 || he < 0) throw new Error('bloque de horario');
h = h.slice(0, hs) + `  /* Horario: estado orientativo según el horario habitual (zona Europe/Madrid, incluye horario de verano).
     Las excepciones (festivos, vacaciones) se definen en src/data/site.json -> hoursExceptions. */
  var AH = (window.AIRAM && window.AIRAM.hours) || [], AX = (window.AIRAM && window.AIRAM.exceptions) || { dates: [] };
  var DN = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  function madridNow(){
    var p = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
    var o = {}; p.forEach(function(x){ o[x.type] = x.value; });
    return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], m:(+o.hour % 24) * 60 + (+o.minute), date:o.year+"-"+o.month+"-"+o.day};
  }
  function mins(s){ var a = s.split(":"); return +a[0]*60 + +a[1]; }
  function hoursFor(d){ return AH.filter(function(x){ return x.days.indexOf(d) > -1 && !x.closed; })[0]; }
  try{
    var now = madridNow(), qual = AX.validated ? "" : ", según el horario habitual";
    document.querySelectorAll("#hours tr").forEach(function(tr){
      if(tr.dataset.d.split(" ").indexOf(String(now.d)) > -1) tr.classList.add("today");
    });
    var st = document.getElementById("status"), t = st.querySelector(".st-t"), dd = st.querySelector(".st-d");
    var ex = (AX.dates || []).filter(function(e){ return e.date === now.date; })[0];
    var today = ex ? (ex.closed ? null : ex) : hoursFor(now.d);
    if(today && now.m >= mins(today.open) && now.m < mins(today.close)){
      st.classList.add("open"); t.textContent = "Abierto ahora"; dd.textContent = "Hasta las " + today.close + " h" + qual;
    } else {
      var label = "";
      for(var i = 0; i < 7; i++){
        var day = (now.d + i) % 7, hh = hoursFor(day);
        if(!hh) continue;
        if(i === 0 && now.m < mins(hh.open)){ label = "Hoy abrimos a las " + hh.open + " h"; break; }
        if(i > 0){ label = (i === 1 ? "Mañana" : "El " + DN[day]) + " abrimos a las " + hh.open + " h"; break; }
      }
      t.textContent = "Cerrado ahora"; dd.textContent = label + qual;
    }
` + h.slice(he);
// dados do horário injetados pelo build antes do script principal
rep('<script>\n(function(){', '<!--@hours-->\n<script>\n(function(){');

// rodapé: páginas legais nas URLs atuais, recomendações e blog internos, newsletter
rep('<a href="aviso-legal.html">Aviso legal</a>', '<a href="aviso-legal/">Aviso legal</a>');
rep('<a href="privacidad.html">Política de privacidad</a>', '<a href="politicadeprivacidad/">Política de privacidad</a>');
rep('<a href="cookies.html">Política de cookies</a>', '<a href="politica-de-cookies/">Política de cookies</a>');
rep('<a href="https://airamdental.com/recomendaciones/">Recomendaciones post tratamiento</a>', '<a href="recomendaciones/">Recomendaciones</a>');
rep('<a href="https://airamdental.com/noticias/">Blog</a>', '<a href="noticias/">Blog</a>\n      <a href="https://7782a46e.sibforms.com/serve/MUIFAC6qWefVmhI0dbAXW5PlVBlKniNWDZzTIJeXi1S_GvzCJw7sw_ZBe3PCoXJ1KTH4uc_dpAN2tXgBUDnUgnZTDbVrSOHFraBk_tJSqgOof_1_I4tJEycAL7wxhUk3XIPsheWSRtwfWjvUwxDfWywc86GZHN6Bp5OQZ8NaJ_RgeJ2aUmMJNJKlzM51pQosy8OE3vLr7C2ATHQu" target="_blank" rel="noopener">Newsletter</a>');
rep('href="cookies.html">Más información</a>', 'href="politica-de-cookies/">Más información</a>');

// estilos: equipe completa, links «Más información», faixa demo, navegação com 7 itens
rep('.docs{display:grid;grid-template-columns:repeat(5,1fr);gap:clamp(16px,2vw,28px)}', '.docs{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,2.4vw,32px)}\n.doc-link{display:block;text-decoration:none}\n.doc-link:hover h3{text-decoration:underline}\n.team-more{margin-top:28px}');
rep('.staff{display:grid;grid-template-columns:repeat(5,1fr);', '.staff{display:grid;grid-template-columns:repeat(2,1fr);');
rep('.staff .p{display:flex;align-items:center;gap:12px}', '.staff .p{display:flex;align-items:flex-start;gap:14px}\n.staff h3{font-size:16.5px;font-weight:600;line-height:1.25}\n.staff h3 a{text-decoration:none}\n.staff h3 a:hover{text-decoration:underline}\n.staff p{font-size:15px;color:var(--nogal);margin-top:6px;line-height:1.55}');
rep('  .staff{grid-template-columns:repeat(3,1fr)}', '  .staff{grid-template-columns:1fr 1fr}');
rep('  .staff{grid-template-columns:1fr 1fr;gap:18px 14px}', '  .staff{grid-template-columns:1fr;gap:22px}');
rep('.esp-body .ask svg{width:18px;height:18px}', '.esp-body .ask svg{width:18px;height:18px}\n.esp-links{display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center}\n.esp-body .more{display:inline-flex;align-items:center;min-height:44px;margin-top:18px;font-weight:600;font-size:15.5px;color:var(--nogal);text-underline-offset:3px}\n.esp-body .more:hover{color:var(--pizarra)}\n.demo-banner{background:var(--arena);color:var(--pizarra-2);font-size:13px;line-height:1.35;text-align:center;padding:7px 16px}\n@media (max-width:1100px){.nav,.header-cta{display:none}.menu-btn{display:block}}');

fs.writeFileSync(F, h);
console.log('ok', done.length, 'sustituciones');
