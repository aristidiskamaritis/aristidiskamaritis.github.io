/* ==========================================================================
   Reviews: shows the approved reviews written in index.html (#reviews), with
   stars and an average, and lets clients send a new review. New reviews are
   emailed to you through Web3Forms and only appear once you add them to the
   page, so nobody can post fake or abusive reviews straight onto the site.
   ========================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var section = document.getElementById("reviews");
  if (!section) return;

  var TEXT = {
    en: {
      count: function (n) { return "from " + n + (n === 1 ? " review" : " reviews"); },
      stars: function (n) { return n + " out of 5 stars"; },
      sending: "Sending…",
      invalid: "Please choose a rating and fill in the highlighted fields.",
      okTitle: "Thank you!",
      ok: "Your review has been sent. It will appear on the website once I’ve checked it.",
      err: "Something went wrong. Please try again, or send your review to me on WhatsApp."
    },
    el: {
      count: function (n) { return "από " + n + (n === 1 ? " κριτική" : " κριτικές"); },
      stars: function (n) { return n + " στα 5 αστέρια"; },
      sending: "Αποστολή…",
      invalid: "Επιλέξτε βαθμολογία και συμπληρώστε τα πεδία που επισημαίνονται.",
      okTitle: "Ευχαριστώ!",
      ok: "Η κριτική σας στάλθηκε. Θα εμφανιστεί στην ιστοσελίδα μόλις την ελέγξω.",
      err: "Κάτι πήγε στραβά. Δοκιμάστε ξανά ή στείλτε μου την κριτική σας στο WhatsApp."
    }
  };
  function lang() { return document.documentElement.lang === "el" ? "el" : "en"; }
  function tx(key) { return TEXT[lang()][key]; }
  function starString(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

  /* ---------- Approved reviews: stars + average ---------- */
  var list = section.querySelector(".review-list");
  var reviews = Array.prototype.slice.call(list.querySelectorAll(".review"));
  var summary = section.querySelector(".review-summary");

  function renderSummary() {
    if (!reviews.length) { list.hidden = true; return; }
    var total = 0;
    reviews.forEach(function (r) {
      var n = Math.max(1, Math.min(5, parseInt(r.getAttribute("data-rating"), 10) || 5));
      total += n;
      var stars = r.querySelector(".review-stars");
      if (!stars) {
        stars = document.createElement("p");
        stars.className = "review-stars";
        r.insertBefore(stars, r.firstChild);
      }
      stars.textContent = starString(n);
      stars.setAttribute("aria-label", tx("stars")(n));
    });
    var avg = total / reviews.length;
    summary.querySelector(".review-stars").textContent = starString(Math.round(avg));
    summary.querySelector(".review-avg").textContent = avg.toFixed(1).replace(/\.0$/, "");
    summary.querySelector(".review-count").textContent = tx("count")(reviews.length);
    summary.hidden = false;
  }
  renderSummary();
  // Re-run when the language switches so "from 3 reviews" follows it
  document.querySelectorAll(".lang-switch button").forEach(function (b) {
    b.addEventListener("click", function () { setTimeout(renderSummary, 0); });
  });

  /* ---------- "Or review me on Google" (only when the link is set in config.js) ---------- */
  var google = section.querySelector(".review-google");
  if (google && SITE.googleReview) { google.href = SITE.googleReview; google.hidden = false; }

  /* ---------- The review form ---------- */
  var dialog = document.getElementById("review-dialog");
  var openBtn = document.getElementById("review-open");
  if (!dialog || !openBtn || typeof dialog.showModal !== "function") { if (openBtn) openBtn.hidden = true; return; }
  var form = document.getElementById("review-form");
  var status = form.querySelector(".form-status");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function hide() {
    document.documentElement.classList.remove("finder-open");
    dialog.close();
  }
  openBtn.addEventListener("click", function () {
    dialog.showModal();
    document.documentElement.classList.add("finder-open");
  });
  document.getElementById("review-close").addEventListener("click", hide);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) hide(); });
  dialog.addEventListener("close", function () { document.documentElement.classList.remove("finder-open"); });

  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("is-invalid")) { e.target.classList.remove("is-invalid"); e.target.removeAttribute("aria-invalid"); }
    if (e.target.name === "rating") form.querySelector(".stars-field").classList.remove("is-invalid");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = form.elements;
    var rating = form.querySelector('input[name="rating"]:checked');
    var bad = [];
    if (f.review.value.trim().length < 10) bad.push(f.review);
    if (!f.name.value.trim()) bad.push(f.name);
    if (f.email.value.trim() && !emailRe.test(f.email.value.trim())) bad.push(f.email);
    if (!f.consent.checked) bad.push(f.consent);
    [f.review, f.name, f.email, f.consent].forEach(function (el) {
      var isBad = bad.indexOf(el) > -1;
      el.classList.toggle("is-invalid", isBad);
      el.setAttribute("aria-invalid", String(isBad));
    });
    form.querySelector(".stars-field").classList.toggle("is-invalid", !rating);
    if (!rating || bad.length) {
      status.className = "form-status err";
      status.textContent = tx("invalid");
      (rating ? bad[0] : form.querySelector('input[name="rating"]')).focus();
      return;
    }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    var n = parseInt(rating.value, 10);
    data.rating = starString(n) + " (" + n + "/5)";
    data.subject = "New review: " + n + "/5 from " + data.name + (data.business ? " (" + data.business + ")" : "");

    var btn = form.querySelector('button[type="submit"]');
    var label = btn.querySelector("span");
    var old = label.innerHTML;
    btn.disabled = true;
    label.textContent = tx("sending");
    status.className = "form-status";
    status.textContent = "";

    fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res.success) throw new Error(res.message);
        form.querySelector(".finder-q").textContent = tx("okTitle");
        status.className = "form-status ok";
        status.textContent = tx("ok");
        form.classList.add("is-sent");
        form.reset();
      })
      .catch(function () {
        status.className = "form-status err";
        status.textContent = tx("err");
      })
      .then(function () {
        btn.disabled = false;
        label.innerHTML = old;
      });
  });
})();
