/* ==========================================================================
   Plan finder: a short quiz that recommends Starter, Business or Premium.
   Each answer has a tier (0 Starter, 1 Business, 2 Premium). The result is
   the average tier, raised to at least the "min" of any answer that needs a
   bigger plan (e.g. two languages can't be done on Starter). An answer with
   "addon" also suggests that add-on (its price comes from the add-on card).
   Prices are read from the pricing cards in index.html.
   ========================================================================== */
(function () {
  "use strict";

  var dialog = document.getElementById("finder");
  var openBtn = document.getElementById("finder-open");
  if (!dialog || !openBtn || typeof dialog.showModal !== "function") {
    if (openBtn) openBtn.hidden = true;
    return;
  }

  var PLANS = ["Starter", "Business", "Premium"];

  var QUESTIONS = [
    {
      q: { en: "How much do you need to show on your website?", el: "Πόσο περιεχόμενο χρειάζεται να έχει η ιστοσελίδα σας;" },
      a: [
        { tier: 0, en: "Just the essentials: what we do and how to reach us", el: "Μόνο τα βασικά: τι κάνουμε και πώς θα μας βρείτε" },
        { tier: 1, min: 1, en: "A few pages: services, gallery, about us, contact", el: "Λίγες σελίδες: υπηρεσίες, gallery, σχετικά, επικοινωνία" },
        { tier: 2, min: 2, en: "A lot: a full menu, class timetable or product catalogue", el: "Πολλά: πλήρες μενού, πρόγραμμα μαθημάτων ή κατάλογο προϊόντων" }
      ]
    },
    {
      q: { en: "Which languages do you need?", el: "Σε ποιες γλώσσες τη χρειάζεστε;" },
      a: [
        { tier: 0, en: "One language is enough", el: "Μία γλώσσα αρκεί" },
        { tier: 1, min: 1, en: "Both English and Greek", el: "Αγγλικά και Ελληνικά" }
      ]
    },
    {
      q: { en: "What should visitors be able to do?", el: "Τι θέλετε να μπορούν να κάνουν οι επισκέπτες;" },
      a: [
        { tier: 0, en: "Call me or send a message", el: "Να με καλέσουν ή να μου στείλουν μήνυμα" },
        { tier: 1, min: 1, en: "Book a table or appointment, or send an enquiry", el: "Να κλείσουν τραπέζι ή ραντεβού, ή να στείλουν αίτημα" },
        { tier: 1, min: 1, addon: "Online ordering", en: "Order food or drinks online and pay", el: "Να παραγγέλνουν φαγητό ή ποτά online και να πληρώνουν" },
        { tier: 2, min: 2, en: "Use interactive features, like a filterable menu or live timetable", el: "Να χρησιμοποιούν διαδραστικές λειτουργίες, όπως μενού με φίλτρα ή ζωντανό πρόγραμμα" }
      ]
    },
    {
      q: { en: "How should your website look and feel?", el: "Πώς θέλετε να δείχνει η ιστοσελίδα σας;" },
      a: [
        { tier: 0, en: "Clean and simple", el: "Καθαρή και απλή" },
        { tier: 1, en: "Polished, with photos and customer reviews", el: "Προσεγμένη, με φωτογραφίες και κριτικές πελατών" },
        { tier: 2, min: 2, en: "Eye-catching, with video and scroll animation", el: "Εντυπωσιακή, με βίντεο και animation στο scroll" }
      ]
    },
    {
      q: { en: "How important is Google to you?", el: "Πόσο σημαντικό είναι για εσάς το Google;" },
      a: [
        { tier: 0, en: "Not very, I mostly share the link myself", el: "Όχι πολύ, συνήθως στέλνω εγώ το link στους πελάτες" },
        { tier: 1, en: "I want to show up on Google Maps and local searches", el: "Θέλω να εμφανίζομαι στο Google Maps και στις τοπικές αναζητήσεις" },
        { tier: 2, en: "Very, I want to grow search traffic and track visitors", el: "Πολύ, θέλω να αυξήσω την επισκεψιμότητα και να βλέπω στατιστικά" }
      ]
    },
    {
      q: { en: "What budget do you have in mind?", el: "Τι budget έχετε κατά νου;" },
      budget: true,
      a: [
        { tier: 0, en: "As affordable as possible", el: "Όσο πιο οικονομικά γίνεται" },
        { tier: 1, en: "Mid-range, for a complete result", el: "Μεσαίο, για ένα ολοκληρωμένο αποτέλεσμα" },
        { tier: 2, en: "I'm ready to invest in something that stands out", el: "Θέλω να επενδύσω σε κάτι που ξεχωρίζει" }
      ]
    }
  ];

  var TEXT = {
    en: {
      close: "Close",
      step: "Question {n} of {total}",
      back: "Back",
      resultEyebrow: "Recommended for you",
      from: "from",
      why: "Why this plan",
      addonNote: "Add Online ordering (from {price}) so customers can order and pay on your site.",
      budgetNote: "This is above the budget you picked. Get in touch and we can look at starting smaller and adding features later.",
      quote: "Get a quote for {plan}",
      compare: "Compare plans",
      restart: "Start again",
      reasons: [
        "A clear one-page site covers what you need without paying for extras.",
        "Several pages, both languages and booking or enquiry forms are all included.",
        "Video, animation and custom features like menus or timetables are part of this plan."
      ]
    },
    el: {
      close: "Κλείσιμο",
      step: "Ερώτηση {n} από {total}",
      back: "Πίσω",
      resultEyebrow: "Η πρότασή μου για εσάς",
      from: "από",
      why: "Γιατί αυτό το πακέτο",
      addonNote: "Προσθέστε τις Online παραγγελίες (από {price}) για να παραγγέλνουν και να πληρώνουν οι πελάτες στην ιστοσελίδα σας.",
      budgetNote: "Είναι πάνω από το budget που επιλέξατε. Επικοινωνήστε μαζί μου και μπορούμε να ξεκινήσουμε με κάτι μικρότερο και να προσθέσουμε λειτουργίες αργότερα.",
      quote: "Ζητήστε προσφορά για το {plan}",
      compare: "Σύγκριση πακέτων",
      restart: "Από την αρχή",
      reasons: [
        "Μια ξεκάθαρη ιστοσελίδα μίας σελίδας καλύπτει ό,τι χρειάζεστε χωρίς περιττά έξοδα.",
        "Περιλαμβάνει πολλές σελίδες, δύο γλώσσες και φόρμες κράτησης ή αιτήματος.",
        "Το βίντεο, το animation και οι ειδικές λειτουργίες, όπως μενού ή προγράμματα, είναι μέρος του πακέτου."
      ]
    }
  };

  var body = document.getElementById("finder-body");
  var bar = document.getElementById("finder-bar");
  var closeBtn = document.getElementById("finder-close");
  var answers = [];
  var step = 0;

  function lang() { return document.documentElement.lang === "el" ? "el" : "en"; }
  function tx(key) { return TEXT[lang()][key]; }
  function fill(str, vars) { return str.replace(/\{(\w+)\}/g, function (_, k) { return vars[k]; }); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function card(plan) { return document.querySelector('[data-plan-card="' + plan + '"]'); }
  function planName(plan) { var c = card(plan); return c ? c.querySelector("h3").textContent.trim() : plan; }
  function planPrice(plan) { var c = card(plan); return c ? c.querySelector(".plan-price strong").textContent.trim() : ""; }

  function addonPrice(name) {
    var c = document.querySelector('[data-addon-card="' + name + '"] .care-price strong');
    return c ? c.textContent.trim() : "";
  }
  function pickedAddon() {
    var found = null;
    QUESTIONS.forEach(function (Q, i) { var opt = Q.a[answers[i]]; if (opt && opt.addon) found = opt.addon; });
    return found;
  }

  function renderQuestion() {
    var Q = QUESTIONS[step];
    var L = lang();
    bar.style.width = (step / QUESTIONS.length * 100) + "%";
    body.innerHTML = "";

    body.appendChild(el("p", "finder-step", fill(tx("step"), { n: step + 1, total: QUESTIONS.length })));
    var h = el("h2", "finder-q", Q.q[L]);
    h.id = "finder-title";
    h.tabIndex = -1;
    body.appendChild(h);

    var list = el("div", "finder-options");
    Q.a.forEach(function (opt, i) {
      var b = el("button", "finder-opt", opt[L]);
      b.type = "button";
      if (answers[step] === i) b.classList.add("is-picked");
      b.addEventListener("click", function () {
        answers[step] = i;
        step++;
        if (step < QUESTIONS.length) renderQuestion(); else renderResult();
      });
      list.appendChild(b);
    });
    body.appendChild(list);

    if (step > 0) {
      var back = el("button", "finder-back", tx("back"));
      back.type = "button";
      back.addEventListener("click", function () { step--; renderQuestion(); });
      body.appendChild(back);
    }
    h.focus();
  }

  function recommend() {
    var sum = 0, floor = 0, budget = 2;
    QUESTIONS.forEach(function (Q, i) {
      var opt = Q.a[answers[i]];
      sum += opt.tier;
      if (opt.min) floor = Math.max(floor, opt.min);
      if (Q.budget) budget = opt.tier;
    });
    var tier = Math.max(floor, Math.round(sum / QUESTIONS.length));
    return { tier: tier, overBudget: tier > budget };
  }

  // Plain-text summary that goes into the enquiry form (always in English, for you)
  function summary(plan) {
    var addon = pickedAddon();
    return "Recommended: " + plan + (addon ? " + " + addon + " add-on" : "") + " | " + QUESTIONS.map(function (Q, i) {
      return Q.q.en + " " + Q.a[answers[i]].en;
    }).join(" | ");
  }

  function renderResult() {
    var r = recommend();
    var plan = PLANS[r.tier];
    bar.style.width = "100%";
    body.innerHTML = "";

    body.appendChild(el("p", "finder-step", tx("resultEyebrow")));
    var h = el("h2", "finder-q finder-plan", planName(plan));
    h.id = "finder-title";
    h.tabIndex = -1;
    body.appendChild(h);

    var price = el("p", "finder-price");
    price.appendChild(el("small", null, tx("from") + " "));
    price.appendChild(el("strong", null, planPrice(plan)));
    body.appendChild(price);

    var why = el("div", "finder-why");
    why.appendChild(el("p", "finder-why-t", tx("why")));
    why.appendChild(el("p", null, tx("reasons")[r.tier]));
    body.appendChild(why);

    var addon = pickedAddon();
    if (addon) body.appendChild(el("p", "finder-addon", fill(tx("addonNote"), { price: addonPrice(addon) })));
    if (r.overBudget) body.appendChild(el("p", "finder-note", tx("budgetNote")));

    var actions = el("div", "finder-actions");
    var quote = el("button", "btn btn-primary btn-block");
    quote.type = "button";
    quote.appendChild(el("span", null, fill(tx("quote"), { plan: planName(plan) })));
    quote.addEventListener("click", function () {
      var sel = document.getElementById("f-plan");
      var hidden = document.getElementById("f-finder");
      if (sel) sel.value = plan;
      if (hidden) hidden.value = summary(plan);
      var feature = addon && document.querySelector('input[name="features"][value^="' + addon + '"]');
      if (feature) feature.checked = true;
      hide();
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
    });
    actions.appendChild(quote);

    var row = el("div", "finder-links");
    var compare = el("button", "finder-back", tx("compare"));
    compare.type = "button";
    compare.addEventListener("click", function () {
      hide();
      var c = card(plan);
      if (!c) return;
      c.scrollIntoView({ behavior: "smooth", block: "center" });
      c.classList.remove("is-match");
      void c.offsetWidth; // restart the highlight animation
      c.classList.add("is-match");
    });
    var restart = el("button", "finder-back", tx("restart"));
    restart.type = "button";
    restart.addEventListener("click", start);
    row.appendChild(compare);
    row.appendChild(restart);
    actions.appendChild(row);
    body.appendChild(actions);
    h.focus();
  }

  // Unlock page scrolling right away (the dialog's "close" event fires a tick later)
  function hide() {
    document.documentElement.classList.remove("finder-open");
    dialog.close();
  }

  function start() {
    answers = [];
    step = 0;
    renderQuestion();
  }

  openBtn.addEventListener("click", function () {
    closeBtn.setAttribute("aria-label", tx("close"));
    start();
    dialog.showModal();
    document.documentElement.classList.add("finder-open");
  });
  closeBtn.addEventListener("click", hide);
  dialog.addEventListener("close", function () { document.documentElement.classList.remove("finder-open"); });
  // Click on the dimmed backdrop closes it
  dialog.addEventListener("click", function (e) { if (e.target === dialog) hide(); });
})();
