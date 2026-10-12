(function () {
  "use strict";

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var navWrap = document.querySelector(".nav-wrap");
  var burger = document.querySelector(".burger");
  var cookie = document.getElementById("cookie");

  function closeMenus() {
    document.querySelectorAll(".has-menu.is-open").forEach(function (item) {
      item.classList.remove("is-open");
      var button = item.querySelector(".menu-btn");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function closeNav() {
    if (!navWrap) return;
    navWrap.classList.remove("is-open");
    if (burger) {
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Abrir menú");
    }
    closeMenus();
  }

  document.querySelectorAll(".has-menu > .menu-btn").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      var item = button.parentElement;
      var willOpen = !item.classList.contains("is-open");
      closeMenus();
      if (willOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

  if (burger && navWrap) {
    burger.addEventListener("click", function () {
      var open = navWrap.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      if (!open) closeMenus();
    });
  }

  document.querySelectorAll("#site-nav a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".has-menu")) closeMenus();
    if (navWrap && !event.target.closest(".nav")) closeNav();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNav();
  });

  var topbarClose = document.querySelector(".topbar-close");
  if (topbarClose) {
    topbarClose.addEventListener("click", function () {
      document.documentElement.classList.add("topbar-off");
      try { sessionStorage.setItem("berea-topbar", "off"); } catch (err) { /* ignore */ }
    });
  }

  function setCookieChoice(value) {
    try { localStorage.setItem("berea-cookie", value); } catch (err) { /* ignore */ }
    document.documentElement.classList.add("cookie-ok");
    document.body.classList.remove("has-cookie");
    if (cookie) cookie.hidden = true;
    writeCookieState();
  }

  function writeCookieState() {
    var node = document.getElementById("cookie-state");
    if (!node) return;
    var choice = "";
    try { choice = localStorage.getItem("berea-cookie") || ""; } catch (err) { choice = ""; }
    if (choice === "accepted") node.textContent = "Tu elección en este navegador: aceptada.";
    else if (choice === "rejected") node.textContent = "Tu elección en este navegador: rechazada. La página sigue usable.";
    else node.textContent = "Todavía no elegiste en el aviso de cookies.";
  }

  if (cookie && !document.documentElement.classList.contains("cookie-ok")) {
    document.body.classList.add("has-cookie");
  }
  writeCookieState();

  document.querySelectorAll("[data-cookie]").forEach(function (button) {
    button.addEventListener("click", function () {
      setCookieChoice(button.getAttribute("data-cookie"));
    });
  });

  function showTour(id) {
    document.querySelectorAll(".tour-tab").forEach(function (tab) {
      var on = tab.getAttribute("data-tour") === id;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll(".tour-panel").forEach(function (panel) {
      panel.hidden = panel.id !== "panel-" + id;
    });
  }

  document.querySelectorAll(".tour-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      showTour(tab.getAttribute("data-tour"));
    });
  });

  var tablist = document.querySelector(".tour-nav");
  if (tablist) {
    tablist.addEventListener("keydown", function (event) {
      var tabs = Array.prototype.slice.call(document.querySelectorAll(".tour-tab"));
      var index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      var next = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      next.focus();
      showTour(next.getAttribute("data-tour"));
    });
  }

  document.addEventListener("click", function (event) {
    var go = event.target.closest("[data-goto]");
    if (!go) return;
    showTour(go.getAttribute("data-goto"));
    if (go.tagName === "BUTTON") {
      var stage = document.getElementById("recorrido");
      if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  var lastFocus = null;

  function openDialog(id, trigger) {
    var dialog = document.getElementById(id);
    if (!dialog || typeof dialog.showModal !== "function") return;
    lastFocus = trigger || document.activeElement;
    if (!dialog.open) dialog.showModal();
    var field = dialog.querySelector("input, select, textarea") || dialog.querySelector("[href], button");
    if (field) field.focus();
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) dialog.close();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.querySelectorAll("[data-open]").forEach(function (button) {
    button.addEventListener("click", function () {
      var which = button.getAttribute("data-open") === "login" ? "login-dialog" : "demo-dialog";
      closeNav();
      openDialog(which, button);
    });
  });

  document.querySelectorAll("[data-close]").forEach(function (button) {
    button.addEventListener("click", function () {
      closeDialog(button.closest("dialog"));
    });
  });

  var form = document.getElementById("demo-form");
  var fields = document.getElementById("demo-fields");
  var success = document.getElementById("demo-success");
  var fallback = document.getElementById("wa-fallback");
  var reset = document.getElementById("demo-reset");

  function setError(name, message) {
    var input = document.getElementById(name);
    var error = document.getElementById("err-" + name);
    if (!input || !error) return;
    var field = input.closest(".field");
    if (field) field.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
  }

  function clearErrors() {
    ["nombre", "comercio", "ciudad", "whatsapp"].forEach(function (name) { setError(name, ""); });
  }

  function waUrl(text) {
    return "https://wa.me/573001575829?text=" + encodeURIComponent(text);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();
      var data = {
        nombre: form.nombre.value.trim(),
        comercio: form.comercio.value.trim(),
        ciudad: form.ciudad.value.trim(),
        tipo: form.tipo.value,
        whatsapp: form.whatsapp.value.trim()
      };
      var ok = true;
      if (data.nombre.length < 2) { setError("nombre", "Escribe tu nombre."); ok = false; }
      if (data.comercio.length < 2) { setError("comercio", "Escribe el nombre del comercio."); ok = false; }
      if (data.ciudad.length < 2) { setError("ciudad", "Escribe la ciudad."); ok = false; }
      if (data.whatsapp.replace(/\D/g, "").length < 10) {
        setError("whatsapp", "Escribe un WhatsApp de 10 dígitos.");
        ok = false;
      }
      if (!ok) {
        var firstInvalid = form.querySelector(".is-invalid input, .is-invalid select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var text = "Hola, escribo desde la página de Berea. Quiero empezar con el panel.\n" +
        "Nombre: " + data.nombre + "\n" +
        "Comercio: " + data.comercio + "\n" +
        "Ciudad: " + data.ciudad + "\n" +
        "Tipo: " + data.tipo + "\n" +
        "WhatsApp: " + data.whatsapp;
      var url = waUrl(text);
      if (fallback) fallback.href = url;

      try {
        var key = "berea-demo-requests";
        var saved = JSON.parse(localStorage.getItem(key) || "[]");
        if (!Array.isArray(saved)) saved = [];
        saved.push({
          nombre: data.nombre,
          comercio: data.comercio,
          ciudad: data.ciudad,
          tipo: data.tipo,
          whatsapp: data.whatsapp,
          at: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(saved.slice(-20)));
      } catch (err) { /* el chat igual se puede abrir */ }

      if (fields) fields.hidden = true;
      if (success) success.hidden = false;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  if (reset && form) {
    reset.addEventListener("click", function () {
      form.reset();
      clearErrors();
      if (fields) fields.hidden = false;
      if (success) success.hidden = true;
      var nombre = document.getElementById("nombre");
      if (nombre) nombre.focus();
    });
  }

  var reveal = document.querySelectorAll(
    ".card, .case, .section-head, .cloud-grid > *, .phone-copy, .phone, .faq-grid > :first-child, .faq-list details, .cta-box"
  );
  if (!("IntersectionObserver" in window)) {
    reveal.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        seen.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });
    reveal.forEach(function (el) { seen.observe(el); });
  }
})();
