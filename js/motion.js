/* ==========================================================================
   Scroll motion: "aurora flow".
   Smooth scrolling (Lenis), a living colour field behind the page that changes
   palette per section, and scroll-driven entrances and exits (GSAP ScrollTrigger).
   Skipped entirely for reduced motion or if the libraries fail to load; main.js
   then handles the simple fade-in reveals on its own.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  if (!window.MOTION) return;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  var headerH = parseFloat(getComputedStyle(root).getPropertyValue("--header-h")) || 72;
  var mm = gsap.matchMedia();

  /* ---------- Smooth scrolling ---------- */
  var lenis = new window.Lenis({
    lerp: .1,
    // Let dialogs (plan finder, review form) scroll natively
    prevent: function (node) { return !!(node.closest && node.closest("dialog, [data-lenis-prevent]")); }
  });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // In-page links glide to their section instead of jumping
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute("href");
    var target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: id === "#home" ? 0 : -headerH, duration: 1.5 });
    history.replaceState(null, "", id);
  });

  // Freeze the page while a modal dialog is open
  $$("dialog").forEach(function (d) {
    new MutationObserver(function () {
      if (d.open) return lenis.stop();
      lenis.start();
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    })
      .observe(d, { attributes: true, attributeFilter: ["open"] });
  });

  // If anything below throws (an older browser, say), undo it all so no content is left hidden
  var splitHeads = [];
  try { setup(); } catch (err) { bail(err); }

  function bail(err) {
    if (window.console) console.error("motion.js disabled:", err);
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    gsap.globalTimeline.clear();
    lenis.destroy();
    window.lenis = null;
    root.classList.remove("motion", "lenis", "lenis-smooth", "lenis-stopped", "lenis-scrolling");
    splitHeads.forEach(function (h) { h.el.innerHTML = h.html; });
    $$(".reveal").forEach(function (n) { n.classList.remove("reveal"); });
    $$("main [style], .ticker-track[style]").forEach(function (n) {
      ["opacity", "transform", "translate", "rotate", "scale", "clip-path", "transition", "--draw"].forEach(function (prop) { n.style.removeProperty(prop); });
    });
  }

  function setup() {
    /* ---------- Aurora: colour field that follows the section you are in ---------- */
    var PALETTES = {
      home:     ["#4CC9E0", "#3B82F6", "#8B5CF6"],
      work:     ["#2DD4BF", "#4CC9E0", "#3B82F6"],
      services: ["#8B5CF6", "#4CC9E0", "#3B82F6"],
      process:  ["#22D3EE", "#2DD4BF", "#6366F1"],
      pricing:  ["#4CC9E0", "#A78BFA", "#F472B6"],
      reviews:  ["#F472B6", "#8B5CF6", "#4CC9E0"],
      about:    ["#F59E0B", "#F472B6", "#8B5CF6"],
      faq:      ["#3B82F6", "#22D3EE", "#8B5CF6"],
      contact:  ["#4CC9E0", "#8B5CF6", "#F472B6"]
    };
    var blobs = $$(".aur");
    var current = "";
    function setPalette(id) {
      var colors = PALETTES[id];
      if (!colors || id === current) return;
      current = id;
      blobs.forEach(function (b, i) {
        gsap.to(b, { "--c": colors[i], duration: 1.6, ease: "power2.inOut", overwrite: "auto" });
      });
    }
    $$("main section[id]").forEach(function (s) {
      ScrollTrigger.create({
        trigger: s, start: "top 55%", end: "bottom 55%",
        onToggle: function (self) { if (self.isActive) setPalette(s.id); }
      });
    });
    // Blobs drift on their own, and the whole field turns slowly as you scroll
    blobs.forEach(function (b, i) {
      gsap.to(b, {
        xPercent: [18, -22, 14][i], yPercent: [-14, 16, 20][i], scale: [1.15, .9, 1.1][i],
        duration: [14, 17, 12][i], ease: "sine.inOut", repeat: -1, yoyo: true
      });
    });
    gsap.to(".aurora-field", { rotate: 80, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 2 } });

    /* ---------- Headings: words rise out of a mask ---------- */
    // Wraps each word in .w > .wi; the original markup comes back once the animation is done,
    // so language switching (which rewrites innerHTML) never sees the wrappers.
    function splitWords(el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (node) {
        var frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement("span"), wi = document.createElement("span");
          w.className = "w"; wi.className = "wi"; wi.textContent = part;
          w.appendChild(wi); frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      });
      return $$(".wi", el);
    }

    $$(".section-head, .about-copy, .contact-intro").forEach(function (head) {
      head.classList.remove("reveal");
      var h2 = $("h2", head);
      var original = h2.innerHTML;
      splitHeads.push({ el: h2, html: original });
      var words = splitWords(h2);
      var rest = Array.prototype.filter.call(head.children, function (c) { return c !== h2; });
      gsap.set(words, { yPercent: 115 });
      gsap.set(rest, { opacity: 0, y: 24 });
      gsap.timeline({
        scrollTrigger: { trigger: head, start: "top 86%", once: true },
        // Skip the restore if a language switch has already replaced the words
        onComplete: function () { if (h2.contains(words[0])) h2.innerHTML = original; }
      })
        .to(words, { yPercent: 0, duration: 1, ease: "expo.out", stagger: .045 })
        .to(rest, { opacity: 1, y: 0, duration: .9, ease: "power3.out", stagger: .08, clearProps: "transform,opacity" }, .15);
    });

    /* ---------- Everything else marked .reveal: staggered rise ---------- */
    var reveals = $$(".reveal");
    reveals.forEach(function (n) { n.classList.remove("reveal"); });
    // CSS transitions are switched off while GSAP animates them in (some cards transition opacity themselves)
    gsap.set(reveals, { opacity: 0, y: 48, transition: "none" });
    ScrollTrigger.batch(reveals, {
      start: "top 90%", once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 1.05, ease: "power3.out", stagger: .09, overwrite: true, clearProps: "transform,opacity,transition" });
      }
    });

    /* ---------- Hero: the copy and the cards drift away as you scroll on ---------- */
    var hero = $(".hero");
    gsap.to(".hero-visual", { y: -12, duration: 3.5, ease: "sine.inOut", repeat: -1, yoyo: true });
    mm.add("(min-width: 961px)", function () {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
        .to(".hero-copy", { yPercent: -18, opacity: 0, ease: "none" }, 0)
        .to(".hero-visual", { yPercent: -10, scale: .9, opacity: 0, ease: "none" }, 0);
    });

    /* ---------- Ticker: speeds up (and turns around) with the scroll ---------- */
    var tickerTrack = $(".ticker-track");
    if (tickerTrack) {
      var tick = gsap.to(tickerTrack, { xPercent: -50, duration: 45, ease: "none", repeat: -1 });
      var dir = 1;
      lenis.on("scroll", function (l) {
        if (Math.abs(l.velocity) < .5) return;
        dir = l.velocity > 0 ? 1 : -1;
        gsap.to(tick, { timeScale: dir * Math.min(1 + Math.abs(l.velocity) / 3, 8), duration: .2, overwrite: true });
        gsap.to(tick, { timeScale: dir, duration: 1.2, delay: .25, ease: "power2.out" });
      });
    }

    /* ---------- Section hand-off: the section you leave settles back as the next one arrives ---------- */
    ["work", "services", "process", "reviews", "about", "faq"].forEach(function (id) {
      var box = $("#" + id + " > .container");
      if (!box) return;
      gsap.to(box, {
        opacity: .3, y: -60, scale: .985, ease: "none",
        // Starts only once the section's last lines are near the top, so nothing fades while it's being read
        scrollTrigger: { trigger: box.parentNode, start: "bottom 22%", end: "bottom top", scrub: true }
      });
    });

    /* ---------- Project screenshots open up like a lens and float ---------- */
    $$(".project-media").forEach(function (m) {
      gsap.fromTo(m, { clipPath: "inset(10% 8% 10% 8% round 28px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 16px)", ease: "none",
        scrollTrigger: { trigger: m, start: "top 95%", end: "top 45%", scrub: .6 }
      });
      gsap.fromTo(m, { y: 50 }, { y: -30, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".about-photo img").forEach(function (img) {
      gsap.fromTo(img, { y: 40 }, { y: -30, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* ---------- Process: a coloured line draws across the steps ---------- */
    var steps = $$(".step");
    if (steps.length) {
      var draw = gsap.timeline({ scrollTrigger: { trigger: ".steps", start: "top 82%", end: "bottom 55%", scrub: .5 } });
      steps.forEach(function (s) { draw.fromTo(s, { "--draw": 0 }, { "--draw": 1, ease: "none" }); });
    }

    /* ---------- Pricing: the light panel grows to full width, then tucks back in ---------- */
    var pricing = $("#pricing");
    if (pricing) {
      mm.add("(min-width: 601px)", function () {
        var inset = "inset(0% 4% 0% 4% round 40px)", full = "inset(0% 0% 0% 0% round 0px)";
        gsap.fromTo(pricing, { clipPath: inset }, { clipPath: full, ease: "none", scrollTrigger: { trigger: pricing, start: "top bottom", end: "top 20%", scrub: true } });
        gsap.fromTo(pricing, { clipPath: full }, { clipPath: inset, ease: "none", immediateRender: false, scrollTrigger: { trigger: pricing, start: "bottom 80%", end: "bottom top", scrub: true } });
      });
    }

    /* ---------- Keep trigger positions right when content changes height (reviews load, FAQ opens) ---------- */
    if ("ResizeObserver" in window) {
      var refreshTimer;
      new ResizeObserver(function () {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 200);
      }).observe($("main"));
    }

    // Opened with a #hash: land on that section once the triggers are measured
    if (location.hash.length > 1) {
      var start = document.getElementById(location.hash.slice(1));
      if (start) requestAnimationFrame(function () { lenis.scrollTo(start, { offset: -headerH, immediate: true }); });
    }
  }
})();
