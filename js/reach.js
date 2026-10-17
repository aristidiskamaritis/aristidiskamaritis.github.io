/* ==========================================================================
   Contact buttons that always lead somewhere.
   Viber, phone and email links open an app on the visitor's device. When no
   app answers (no Viber installed, no mail app, a computer that can't call),
   the click would do nothing, so we watch for the page losing focus and, if
   it doesn't, offer working alternatives: Gmail/Outlook on the web, copy the
   number or address, or switch to WhatsApp.
   ========================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var dialog = document.getElementById("reach");
  if (!dialog || typeof dialog.showModal !== "function") return;

  var body = document.getElementById("reach-body");
  var digits = (SITE.phone || "").replace(/[^\d]/g, "");

  var TEXT = {
    en: {
      close: "Close",
      copy: "Copy",
      copied: "Copied",
      emailTitle: "Send me an email",
      emailText: "If no email app opened, write to me from your browser or copy my address.",
      gmail: "Open in Gmail",
      outlook: "Open in Outlook",
      viberTitle: "Message me on Viber",
      viberText: "Viber didn't open? It needs the Viber app on this device. You can also save my number in Viber, or message me on WhatsApp instead.",
      getViber: "Get Viber",
      phoneTitle: "Call me",
      phoneText: "Call this number from your phone, or message me on WhatsApp or Viber.",
      callApp: "Call from this computer",
      whatsapp: "WhatsApp instead",
      whatsappShort: "WhatsApp",
      viber: "Viber",
      subject: "Website enquiry",
      mailBody: "Hi Aristeidis,\n\nI'd like to talk about a website for my business.\n\n"
    },
    el: {
      close: "Κλείσιμο",
      copy: "Αντιγραφή",
      copied: "Αντιγράφηκε",
      emailTitle: "Στείλτε μου email",
      emailText: "Αν δεν άνοιξε εφαρμογή email, γράψτε μου από τον browser ή αντιγράψτε τη διεύθυνσή μου.",
      gmail: "Άνοιγμα στο Gmail",
      outlook: "Άνοιγμα στο Outlook",
      viberTitle: "Στείλτε μου στο Viber",
      viberText: "Δεν άνοιξε το Viber; Χρειάζεται η εφαρμογή Viber σε αυτή τη συσκευή. Μπορείτε επίσης να αποθηκεύσετε τον αριθμό μου στο Viber ή να μου στείλετε στο WhatsApp.",
      getViber: "Λήψη Viber",
      phoneTitle: "Τηλεφωνήστε μου",
      phoneText: "Καλέστε αυτόν τον αριθμό από το κινητό σας ή στείλτε μου μήνυμα στο WhatsApp ή στο Viber.",
      callApp: "Κλήση από αυτόν τον υπολογιστή",
      whatsapp: "WhatsApp αντί για αυτό",
      whatsappShort: "WhatsApp",
      viber: "Viber",
      subject: "Ερώτηση για ιστοσελίδα",
      mailBody: "Γεια σου Αριστείδη,\n\nΘα ήθελα να μιλήσουμε για μια ιστοσελίδα για την επιχείρησή μου.\n\n"
    }
  };

  function lang() { return document.documentElement.lang === "el" ? "el" : "en"; }
  function tx(key) { return TEXT[lang()][key]; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function waUrl() { return "https://wa.me/" + digits + "?text=" + encodeURIComponent((SITE.waText || {})[lang()] || ""); }
  function viberUrl() { return "viber://chat?number=%2B" + digits; }
  function mailParams() { return { subject: tx("subject"), body: tx("mailBody") }; }
  function mailtoUrl() {
    var p = mailParams();
    return "mailto:" + SITE.email + "?subject=" + encodeURIComponent(p.subject) + "&body=" + encodeURIComponent(p.body);
  }
  function gmailUrl() {
    var p = mailParams();
    return "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(SITE.email) +
      "&su=" + encodeURIComponent(p.subject) + "&body=" + encodeURIComponent(p.body);
  }
  function outlookUrl() {
    var p = mailParams();
    return "https://outlook.live.com/mail/0/deeplink/compose?to=" + encodeURIComponent(SITE.email) +
      "&subject=" + encodeURIComponent(p.subject) + "&body=" + encodeURIComponent(p.body);
  }

  // A computer with a mouse usually has nothing that can place a phone call
  var canCall = window.matchMedia("(pointer: coarse)").matches;

  /* ---------- The fallback panel ---------- */
  function link(label, href, primary, newTab) {
    var a = el("a", "btn " + (primary ? "btn-primary" : "btn-ghost"), label);
    a.href = href;
    if (newTab) { a.target = "_blank"; a.rel = "noopener"; }
    a.addEventListener("click", function () { if (newTab) dialog.close(); });
    return a;
  }

  function copyRow(value) {
    var row = el("div", "reach-copy");
    row.appendChild(el("span", "reach-value", value));
    var b = el("button", "btn btn-ghost btn-sm", tx("copy"));
    b.type = "button";
    b.addEventListener("click", function () {
      var done = function () { b.textContent = tx("copied"); setTimeout(function () { b.textContent = tx("copy"); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(value).then(done, function () { selectText(row); });
      else selectText(row);
    });
    row.appendChild(b);
    return row;
  }
  function selectText(row) {
    var r = document.createRange();
    r.selectNodeContents(row.querySelector(".reach-value"));
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  function open(kind) {
    body.innerHTML = "";
    var actions = el("div", "reach-actions");
    var title, text, value;
    if (kind === "email") {
      title = tx("emailTitle"); text = tx("emailText"); value = SITE.email;
      actions.appendChild(link(tx("gmail"), gmailUrl(), true, true));
      actions.appendChild(link(tx("outlook"), outlookUrl(), false, true));
    } else if (kind === "viber") {
      title = tx("viberTitle"); text = tx("viberText"); value = SITE.phoneDisplay;
      actions.appendChild(link(tx("whatsapp"), waUrl(), true, true));
      actions.appendChild(link(tx("getViber"), "https://www.viber.com/download/", false, true));
    } else {
      title = tx("phoneTitle"); text = tx("phoneText"); value = SITE.phoneDisplay;
      actions.appendChild(link(tx("whatsappShort"), waUrl(), true, true));
      actions.appendChild(link(tx("viber"), viberUrl(), false, false));
      var call = el("a", "reach-small", tx("callApp"));
      call.href = "tel:+" + digits;
      actions.appendChild(call);
    }
    var h = el("h2", "reach-title", title);
    h.id = "reach-title";
    body.appendChild(h);
    body.appendChild(el("p", "reach-text", text));
    body.appendChild(copyRow(value));
    body.appendChild(actions);
    document.getElementById("reach-close").setAttribute("aria-label", tx("close"));
    if (!dialog.open) dialog.showModal();
  }

  /* ---------- Did an app take over? ---------- */
  var pending = null;
  function appOpened() { if (pending) { clearTimeout(pending); pending = null; } }
  window.addEventListener("blur", appOpened);
  window.addEventListener("pagehide", appOpened);
  document.addEventListener("visibilitychange", function () { if (document.hidden) appOpened(); });

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[data-cfg-href="viber"], a[data-cfg-href="phone"], a[data-cfg-href="email"]');
    if (!a) return;
    var kind = a.getAttribute("data-cfg-href");
    if (kind === "email") a.href = mailtoUrl(); // pre-filled subject and greeting
    if (kind === "phone" && !canCall) { e.preventDefault(); open("phone"); return; }
    appOpened();
    pending = setTimeout(function () {
      pending = null;
      if (document.hasFocus() && !document.hidden) open(kind);
    }, 1400);
  });

  document.getElementById("reach-close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
})();
