/**
 * bottomnav.js — Aneesa Hampers
 * Unified bottom navigation bar for all pages.
 * Fixes: consistent tabs, iOS safe-area, active state, cart badge.
 * Include at end of <body> on every page. Replaces inline #bottomNavAuto.
 */
(function () {

  /* ── page detection ──────────────────────────────────── */
  var path = location.pathname.split("/").pop() || "index.html";
  if (path === "") path = "index.html";

  /* ── cart count (per-user) ───────────────────────────── */
  function cartCount() {
    try {
      var u = JSON.parse(localStorage.getItem("ah_user") || "{}");
      var key = u.uid ? "ah_cart_" + u.uid : "ah_cart_guest";
      return JSON.parse(localStorage.getItem(key) || "[]")
        .reduce(function (s, i) { return s + (i.qty || 1); }, 0);
    } catch (e) { return 0; }
  }

  /* ── nav items ───────────────────────────────────────── */
  var TABS = [
    { href: "index.html",    icon: "🏠", label: "Home" },
    { href: "products.html", icon: "🎁", label: "Shop" },
    { href: "track.html",    icon: "📍", label: "Track" },
    { href: "cart.html",     icon: "🛒", label: "Cart",   isCart: true },
    { href: "account.html",  icon: "👤", label: "Account" },
  ];

  /* ── inject styles ───────────────────────────────────── */
  var style = document.createElement("style");
  style.textContent = [
    /* Wrapper */
    "#ah-bnav{",
      "display:none;",
      "position:fixed;",
      "bottom:0;left:0;right:0;",
      "height:62px;",
      /* iOS safe area */
      "padding-bottom:env(safe-area-inset-bottom,0px);",
      "height:calc(62px + env(safe-area-inset-bottom,0px));",
      "background:#fff;",
      "border-top:1px solid rgba(192,100,122,.12);",
      "box-shadow:0 -3px 18px rgba(59,13,26,.07);",
      "z-index:989;",                /* below sidebar (8000) and modal overlays */
      "justify-content:space-around;",
      "align-items:stretch;",
    "}",

    /* Tab item */
    ".ahbn-item{",
      "display:flex;",
      "flex-direction:column;",
      "align-items:center;",
      "justify-content:center;",
      "gap:3px;",
      "flex:1;",
      "text-decoration:none;",
      "color:rgba(59,13,26,.38);",
      "font-family:'Jost',sans-serif;",
      "font-size:.44rem;",
      "letter-spacing:.4px;",
      "text-transform:uppercase;",
      "font-weight:500;",
      "position:relative;",
      "padding:6px 2px calc(6px + env(safe-area-inset-bottom,0px)) 2px;",
      "transition:color .15s;",
      "-webkit-tap-highlight-color:transparent;",
      "min-width:0;overflow:hidden;",
    "}",

    /* Active indicator bar on top */
    ".ahbn-item::before{",
      "content:'';",
      "position:absolute;",
      "top:0;left:25%;right:25%;",
      "height:2.5px;",
      "background:transparent;",
      "border-radius:0 0 4px 4px;",
      "transition:background .15s;",
    "}",
    ".ahbn-item.ahbn-active{color:#c0647a;}",
    ".ahbn-item.ahbn-active::before{background:#c0647a;}",

    /* Icon */
    ".ahbn-icon{font-size:1.22rem;line-height:1;display:block;}",

    /* Label */
    ".ahbn-lbl{font-size:.44rem;white-space:nowrap;margin-top:1px;display:block;}",

    /* Cart badge */
    ".ahbn-badge{",
      "position:absolute;",
      "top:4px;left:50%;",
      "margin-left:5px;",
      "background:#c0647a;",
      "color:white;",
      "font-size:.5rem;",
      "font-weight:700;",
      "min-width:16px;",
      "height:16px;",
      "border-radius:10px;",
      "padding:0 4px;",
      "display:none;",  /* shown via JS */
      "align-items:center;",
      "justify-content:center;",
      "border:2px solid white;",
      "pointer-events:none;",
    "}",

    /* Only show on mobile/tablet */
    "@media(max-width:768px){",
      "#ah-bnav{display:flex!important;}",
      "body.has-bnav{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px))!important;}",
    "}",
    "@media(min-width:769px){#ah-bnav{display:none!important;}}",
  ].join("");
  document.head.appendChild(style);

  /* ── remove old inline bottom nav (any page may have it) ── */
  ["bottomNavAuto", "bottomNav"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  });
  /* Remove any leftover @media style blocks that target #bottomNavAuto */
  document.querySelectorAll("style").forEach(function (s) {
    if (s.textContent.indexOf("bottomNavAuto") > -1 && s !== style) {
      s.remove();
    }
  });

  /* ── build nav HTML ──────────────────────────────────── */
  var cc = cartCount();
  var tabsHtml = TABS.map(function (t) {
    var isActive = (path === t.href) ? " ahbn-active" : "";
    var badge = "";
    if (t.isCart) {
      badge = '<span class="ahbn-badge" id="ahbn-cart-badge"' +
        (cc > 0 ? ' style="display:flex"' : '') + '>' + (cc || "") + '</span>';
    }
    return '<a href="' + t.href + '" class="ahbn-item' + isActive + '">' +
      badge +
      '<span class="ahbn-icon">' + t.icon + '</span>' +
      '<span class="ahbn-lbl">' + t.label + '</span>' +
      '</a>';
  }).join("");

  var nav = document.createElement("nav");
  nav.id = "ah-bnav";
  nav.setAttribute("aria-label", "Main navigation");
  nav.innerHTML = tabsHtml;
  document.body.appendChild(nav);

  /* ── add body class so pages can add padding ─────────── */
  document.body.classList.add("has-bnav");

  /* ── cart badge live update ──────────────────────────── */
  function updateBadge() {
    var n = cartCount();
    var el = document.getElementById("ahbn-cart-badge");
    if (!el) return;
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
    /* Also update any existing .bn-badge or .cart-count elements */
    document.querySelectorAll(".bn-badge").forEach(function (b) {
      b.textContent = n; b.style.display = n > 0 ? "flex" : "none";
    });
    document.querySelectorAll(".cart-count,.cart-badge,[data-cart-count]").forEach(function (b) {
      b.textContent = n;
    });
  }

  /* Poll + storage event */
  window.addEventListener("storage", updateBadge, { passive: true });
  setInterval(updateBadge, 2500);

  /* ── iOS momentum scroll fix ─────────────────────────── */
  /* Prevent body scroll locking when sidebar is open */
  nav.addEventListener("touchmove", function (e) {
    e.stopPropagation();
  }, { passive: true });

})();
