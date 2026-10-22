(function () {
  "use strict";

  var SITE = window.SITE || {};
  var EL = window.I18N_EL || {};
  var EN_EXTRA = window.I18N_EN_EXTRA || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lang = "en";
  // Full scroll motion (motion.js) needs its libraries from the CDN; otherwise the simple reveals below run
  window.MOTION = !reduceMotion && !!(window.gsap && window.ScrollTrigger && window.Lenis);
  if (window.MOTION) root.classList.add("motion");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------- Config → links & text ---------- */
  var digits = (SITE.phone || "").replace(/[^\d]/g, "");
  function hrefFor(key) {
    switch (key) {
      case "whatsapp": return "https://wa.me/" + digits + "?text=" + encodeURIComponent((SITE.waText || {})[lang] || "");
      case "viber": return "viber://chat?number=%2B" + digits;
      case "phone": return "tel:+" + digits;
      case "email": return "mailto:" + SITE.email;
      default: return SITE[key];
    }
  }
  function applyConfig() {
    $$("[data-cfg-href]").forEach(function (a) {
      var url = hrefFor(a.getAttribute("data-cfg-href"));
      if (url) a.setAttribute("href", url);
    });
    $$("[data-cfg-text]").forEach(function (n) {
      var v = SITE[n.getAttribute("data-cfg-text")];
      if (v) n.textContent = v;
    });
  }

  /* ---------- Language ---------- */
  var originals = new Map();
  var titleEN = document.title;
  var metaDesc = $('meta[name="description"]');
  var descEN = metaDesc ? metaDesc.content : "";

  $$("[data-i18n]").forEach(function (n) { originals.set(n, n.innerHTML); });
  $$("[data-i18n-ph]").forEach(function (n) { originals.set(n, n.getAttribute("placeholder")); });

  function t(key) {
    if (lang === "el" && EL[key]) return EL[key];
    return EN_EXTRA[key] || key;
  }

  function setLang(next) {
    lang = next === "el" ? "el" : "en";
    root.lang = lang;
    $$("[data-i18n]").forEach(function (n) {
      var key = n.getAttribute("data-i18n");
      n.innerHTML = lang === "el" && EL[key] ? EL[key] : originals.get(n);
    });
    $$("[data-i18n-ph]").forEach(function (n) {
      var key = n.getAttribute("data-i18n-ph");
      n.setAttribute("placeholder", lang === "el" && EL[key] ? EL[key] : originals.get(n));
    });
    document.title = lang === "el" ? EL["meta.title"] : titleEN;
    if (metaDesc) metaDesc.content = lang === "el" ? EL["meta.desc"] : descEN;
    $$(".lang-switch button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    applyConfig(); // WhatsApp pre-filled message follows the language
    store("lang", lang);
  }

  $$(".lang-switch button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  // ?lang=el in the URL wins (handy for sharing a Greek link), then the saved choice, then the browser language
  var fromUrl = (location.search.match(/[?&]lang=(en|el)\b/) || [])[1];
  var saved = store("lang");
  var initial = fromUrl || saved || ((navigator.language || "").toLowerCase().indexOf("el") === 0 ? "el" : "en");
  setLang(initial);

  /* ---------- Hero: rotating business type ---------- */
  // The headline's <span class="rotator"> cycles through these (setLang rewrites the
  // headline, so the span is looked up again on every tick)
  var ROTATE = {
    en: ["café", "gym", "clinic", "restaurant", "salon", "shop"],
    el: ["καφέ", "γυμναστήριο", "ιατρείο", "εστιατόριο", "κομμωτήριο", "κατάστημα"]
  };
  var rotateIndex = 0;
  // Off-screen copy of the headline styles, used to measure the next word's width
  // (kept outside the <h1> so the heading's text stays clean)
  var measureBox = document.createElement("div");
  measureBox.className = "hero-title";
  measureBox.setAttribute("aria-hidden", "true");
  measureBox.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;margin:0;font-weight:600";
  var measure = document.createElement("span");
  measure.className = "rotator";
  measureBox.appendChild(measure);
  $(".hero-copy").appendChild(measureBox);
  function rotateWord() {
    var rot = $(".hero-title .rotator");
    if (!rot || document.hidden) return;
    var words = ROTATE[lang] || ROTATE.en;
    rotateIndex = (rotateIndex + 1) % words.length;
    var next = words[rotateIndex];
    rot.style.width = rot.getBoundingClientRect().width + "px";
    rot.classList.remove("is-in");
    rot.classList.add("is-out");
    setTimeout(function () {
      measure.textContent = next;
      rot.textContent = next;
      rot.style.width = measure.getBoundingClientRect().width + "px";
      rot.classList.remove("is-out");
      rot.classList.add("is-in");
    }, 280);
  }
  if (!reduceMotion) setInterval(rotateWord, 2600);

  /* ---------- Hero: 3D tilt and spotlight that follow the pointer (mouse devices only) ---------- */
  var heroEl = $(".hero");
  var stage = $(".hero .stage");
  if (stage && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var tiltFrame = 0, px = 0, py = 0;
    var paintTilt = function () {
      var r = heroEl.getBoundingClientRect();
      var nx = (px - r.left) / r.width - .5, ny = (py - r.top) / r.height - .5;
      stage.style.setProperty("--ry", (nx * 10).toFixed(2) + "deg");
      stage.style.setProperty("--rx", (-ny * 8).toFixed(2) + "deg");
      heroEl.style.setProperty("--mx", (px - r.left) + "px");
      heroEl.style.setProperty("--my", (py - r.top) + "px");
      tiltFrame = 0;
    };
    heroEl.addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
      heroEl.classList.add("has-pointer");
      if (!tiltFrame) tiltFrame = requestAnimationFrame(paintTilt);
    });
    heroEl.addEventListener("pointerleave", function () {
      heroEl.classList.remove("has-pointer");
      stage.style.setProperty("--rx", "0deg");
      stage.style.setProperty("--ry", "0deg");
    });
  }

  /* ---------- Header & mobile nav ---------- */
  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    root.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () { setNav(!root.classList.contains("nav-open")); });
  $$("#main-nav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setNav(false); setQuick(false); }
  });

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.main-nav a[href^="#"]:not(.btn)');
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = "#" + en.target.id;
        navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = window.MOTION ? [] : $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (n) { n.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    // Stagger siblings that enter together
    reveals.forEach(function (n) {
      var sibs = n.parentElement ? $$(":scope > .reveal", n.parentElement) : [];
      var i = sibs.indexOf(n);
      if (i > 0) n.style.transitionDelay = Math.min(i, 4) * 60 + "ms";
      io.observe(n);
      // Once it has arrived, drop the reveal styles so hover transitions are the element's own again
      n.addEventListener("transitionend", function done(e) {
        if (e.target !== n || e.propertyName !== "opacity" || !n.classList.contains("is-in")) return;
        n.classList.remove("reveal", "is-in");
        n.style.transitionDelay = "";
        n.removeEventListener("transitionend", done);
      });
    });
  }

  /* ---------- Reading progress (CSS scroll timeline where supported, otherwise this) ---------- */
  var progress = $(".scroll-progress");
  if (progress && !(window.CSS && CSS.supports("animation-timeline: scroll()"))) {
    var ticking = false;
    var paintProgress = function () {
      var max = root.scrollHeight - window.innerHeight;
      progress.style.setProperty("--progress", max > 0 ? Math.min(window.scrollY / max, 1) : 0);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paintProgress); }
    }, { passive: true });
    window.addEventListener("resize", paintProgress);
    paintProgress();
  }

  /* ---------- Floating quick-contact ---------- */
  var quick = $("#quick");
  var quickBtn = $("#quick-btn");
  var quickMenu = $("#quick-menu");
  function setQuick(open) {
    quickMenu.hidden = !open;
    quickBtn.setAttribute("aria-expanded", String(open));
  }
  quickBtn.addEventListener("click", function (e) { e.stopPropagation(); setQuick(quickMenu.hidden); });
  document.addEventListener("click", function (e) { if (!quick.contains(e.target)) setQuick(false); });

  var hero = $("#home");
  var contact = $("#contact");
  if ("IntersectionObserver" in window) {
    var heroVisible = true, contactVisible = false;
    var updateQuick = function () {
      var show = !heroVisible && !contactVisible;
      quick.classList.toggle("is-visible", show);
      if (!show) setQuick(false);
    };
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; updateQuick(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver(function (en) { contactVisible = en[0].isIntersecting; updateQuick(); }, { threshold: 0.1 }).observe(contact);
  }

  /* ---------- Pricing buttons pre-select the package ---------- */
  var planSelect = $("#f-plan");
  $$("[data-plan]").forEach(function (b) {
    b.addEventListener("click", function () { planSelect.value = b.getAttribute("data-plan"); });
  });

  /* ---------- Project brief: 4 steps, sent with Web3Forms ---------- */
  var form = $("#contact-form");
  var status = $(".form-status", form);
  var steps = $$(".brief-step", form);
  var current = 0;
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showStep(i, move) {
    current = i;
    steps.forEach(function (s, n) { s.classList.toggle("is-current", n === i); });
    $(".brief-n", form).textContent = i + 1;
    $(".brief-progress span", form).style.width = (i + 1) / steps.length * 100 + "%";
    form.classList.toggle("is-first", i === 0);
    form.classList.toggle("is-last", i === steps.length - 1);
    status.className = "form-status";
    status.textContent = "";
    if (move) {
      if (window.lenis) window.lenis.scrollTo(form, { offset: -100 });
      else form.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      var title = $(".brief-step-title", steps[i]);
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  }

  // Marks empty required fields (and a bad email) in one step; returns the first bad field
  function checkStep(step) {
    var bad = $$("[required]", step).filter(function (f) {
      var v = f.value.trim();
      return !v || (f.type === "email" && !emailRe.test(v));
    });
    $$("[required]", step).forEach(function (f) {
      var isBad = bad.indexOf(f) > -1;
      f.classList.toggle("is-invalid", isBad);
      f.setAttribute("aria-invalid", String(isBad));
    });
    return bad[0];
  }

  function showError(field) {
    status.className = "form-status err";
    status.textContent = t("form.invalid");
    field.focus();
  }

  $(".brief-next", form).addEventListener("click", function () {
    var bad = checkStep(steps[current]);
    if (bad) return showError(bad);
    showStep(current + 1, true);
  });
  $(".brief-back", form).addEventListener("click", function () { showStep(current - 1, true); });
  showStep(0, false);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // Enter in a text field moves to the next step rather than sending early
    if (current < steps.length - 1) { $(".brief-next", form).click(); return; }
    for (var i = 0; i < steps.length; i++) {
      var bad = checkStep(steps[i]);
      if (bad) { showStep(i, true); return showError(bad); }
    }

    var btn = $('button[type="submit"]', form);
    var btnLabel = $("span", btn);
    var oldLabel = btnLabel.innerHTML;
    btn.disabled = true;
    btnLabel.textContent = t("form.sending");
    status.className = "form-status";
    status.textContent = "";

    // Ticked checkboxes share a name; join them so the email shows "Home, Gallery, Contact"
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = data[k] ? data[k] + ", " + v : v; });
    data.subject = "New project brief: " + data.business + " (" + data.name + ")";
    // Web3Forms emails the brief to you; replies go to the client's "email" field
    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res.success) throw new Error(res.message);
        $(".form-title", form).textContent = t("form.okTitle");
        status.className = "form-status ok";
        status.textContent = t("form.ok");
        form.classList.add("is-sent");
        form.reset();
      })
      .catch(function () {
        status.className = "form-status err";
        status.textContent = t("form.err");
      })
      .then(function () {
        btn.disabled = false;
        btnLabel.innerHTML = oldLabel;
      });
  });
  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("is-invalid")) { e.target.classList.remove("is-invalid"); e.target.removeAttribute("aria-invalid"); }
  });

  /* ---------- Misc ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
