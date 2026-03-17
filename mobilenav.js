/**
 * mobilenav.js — Aneesa Hampers
 * Injects a beautiful mobile sidebar on every page.
 * Include this script at end of <body> on every page.
 * Usage: <script src="mobilenav.js"></script>
 */
(function () {

  /* ── which page are we on? ─────────────────────────── */
  var path = location.pathname.split("/").pop() || "index.html";
  var isActive = function (pg) { return path === pg ? "mn-active" : ""; };

  /* ── cart count helper ──────────────────────────────── */
  function cartKey() {
    try { var u = JSON.parse(localStorage.getItem("ah_user") || "{}"); return u.uid ? "ah_cart_" + u.uid : "ah_cart_guest"; } catch (e) { return "ah_cart_guest"; }
  }
  function cartCount() {
    try { return JSON.parse(localStorage.getItem(cartKey()) || "[]").reduce(function (s, i) { return s + (i.qty || 1); }, 0); } catch (e) { return 0; }
  }

  /* ── user greeting ──────────────────────────────────── */
  function userGreeting() {
    try {
      var u = JSON.parse(localStorage.getItem("ah_user") || "{}");
      if (u && u.name) return { name: u.name.split(" ")[0], email: u.email || "", loggedIn: true };
    } catch (e) {}
    return { name: "", email: "", loggedIn: false };
  }

  /* ── inject CSS ─────────────────────────────────────── */
  var style = document.createElement("style");
  style.textContent = `
    /* ── HAMBURGER BUTTON ── */
    #mn-ham {
      display: none;
      position: fixed;
      top: 14px;
      left: 14px;
      z-index: 8001;
      width: 44px;
      height: 44px;
      background: var(--burgundy, #3b0d1a);
      border: none;
      border-radius: 12px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(59,13,26,.28);
      transition: background .2s;
    }
    #mn-ham span {
      display: block;
      width: 20px;
      height: 2px;
      background: white;
      border-radius: 2px;
      transition: all .3s;
    }
    #mn-ham.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    #mn-ham.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    #mn-ham.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* ── OVERLAY ── */
    #mn-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(20,4,10,.55);
      backdrop-filter: blur(4px);
      z-index: 7999;
      opacity: 0;
      transition: opacity .3s;
    }
    #mn-overlay.show { opacity: 1; }

    /* ── SIDEBAR PANEL ── */
    #mn-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 285px;
      height: 100%;
      background: linear-gradient(160deg, #1e0a10 0%, #2d1018 60%, #3b0d1a 100%);
      z-index: 8000;
      display: flex;
      flex-direction: column;
      transform: translateX(-100%);
      transition: transform .35s cubic-bezier(.4,0,.2,1);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    #mn-sidebar.open { transform: translateX(0); }

    /* ── SIDEBAR HEADER ── */
    .mn-header {
      padding: 22px 22px 16px;
      border-bottom: 1px solid rgba(255,255,255,.07);
      flex-shrink: 0;
    }
    .mn-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem;
      font-style: italic;
      color: white;
      text-decoration: none;
      display: block;
      margin-bottom: 3px;
    }
    .mn-logo em { color: #e8a0b0; font-style: normal; }
    .mn-tagline {
      font-size: .58rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,.28);
    }

    /* ── USER STRIP ── */
    .mn-user {
      margin: 14px 16px 0;
      padding: 12px 14px;
      background: rgba(255,255,255,.06);
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mn-user-av {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e8a0b0, #c0647a);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
      font-weight: 600;
      color: white;
    }
    .mn-user-name {
      font-size: .82rem;
      font-weight: 600;
      color: white;
    }
    .mn-user-email {
      font-size: .62rem;
      color: rgba(255,255,255,.32);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }

    /* ── NAV LINKS ── */
    .mn-nav { flex: 1; padding: 12px 0 8px; }
    .mn-section-lbl {
      font-size: .55rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,.2);
      padding: 12px 22px 5px;
    }
    .mn-link {
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 13px 22px;
      text-decoration: none;
      color: rgba(255,255,255,.5);
      font-family: 'Jost', sans-serif;
      font-size: .82rem;
      font-weight: 400;
      border-left: 3px solid transparent;
      transition: all .2s;
      position: relative;
    }
    .mn-link:hover {
      color: white;
      background: rgba(255,255,255,.05);
      border-left-color: rgba(232,160,176,.4);
    }
    .mn-link.mn-active {
      color: white;
      background: rgba(192,100,122,.18);
      border-left-color: #e8a0b0;
      font-weight: 500;
    }
    .mn-icon { font-size: 1.1rem; width: 22px; text-align: center; flex-shrink: 0; }
    .mn-badge {
      margin-left: auto;
      background: #c0647a;
      color: white;
      font-size: .6rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      min-width: 20px;
      text-align: center;
    }

    /* ── QR SECTION ── */
    .mn-qr-section {
      margin: 8px 16px 16px;
      background: rgba(255,255,255,.05);
      border-radius: 14px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .mn-qr-header {
      padding: 12px 14px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mn-qr-title {
      font-size: .7rem;
      color: rgba(255,255,255,.55);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .mn-qr-title strong { color: white; display: block; font-size: .78rem; text-transform: none; letter-spacing: 0; margin-bottom: 1px; }
    .mn-unlock-btn {
      background: #c0647a;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 6px 12px;
      font-family: 'Jost', sans-serif;
      font-size: .65rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      transition: background .2s;
      white-space: nowrap;
    }
    .mn-unlock-btn:hover { background: #a0506a; }
    .mn-qr-wrap {
      position: relative;
      padding: 0 14px 14px;
    }
    .mn-qr-img {
      width: 100%;
      border-radius: 10px;
      display: block;
    }
    /* LOCK OVERLAY */
    .mn-qr-lock {
      position: absolute;
      inset: 0 14px 14px;
      background: rgba(20,4,10,.82);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      backdrop-filter: blur(8px);
      transition: opacity .35s;
    }
    .mn-qr-lock.hidden { opacity: 0; pointer-events: none; }
    .mn-lock-icon { font-size: 2rem; }
    .mn-lock-text { font-size: .68rem; color: rgba(255,255,255,.6); text-align: center; letter-spacing: .5px; line-height: 1.5; }
    .mn-lock-tap {
      font-size: .63rem;
      color: #e8a0b0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .mn-upi {
      padding: 0 14px 14px;
      font-size: .7rem;
      color: rgba(255,255,255,.35);
      text-align: center;
      letter-spacing: .5px;
    }
    .mn-upi span { color: rgba(255,255,255,.65); font-weight: 500; }

    /* ── FOOTER BUTTONS ── */
    .mn-footer {
      padding: 14px 16px 28px;
      border-top: 1px solid rgba(255,255,255,.07);
      display: flex;
      flex-direction: column;
      gap: 9px;
      flex-shrink: 0;
    }
    .mn-wa-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #25D366;
      color: white;
      border-radius: 10px;
      text-decoration: none;
      font-family: 'Jost', sans-serif;
      font-size: .72rem;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 500;
      transition: opacity .2s;
    }
    .mn-wa-btn:hover { opacity: .88; }
    .mn-logout-btn {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 11px;
      background: rgba(255,255,255,.06);
      color: rgba(255,255,255,.45);
      border: none;
      border-radius: 10px;
      font-family: 'Jost', sans-serif;
      font-size: .72rem;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all .2s;
      width: 100%;
    }
    .mn-logout-btn:hover { background: rgba(200,60,60,.15); color: #e88888; }

    /* ── SHOW ONLY ON MOBILE ── */
    @media (min-width: 901px) {
      #mn-ham, #mn-overlay, #mn-sidebar { display: none !important; }
    }
    @media (max-width: 900px) {
      #mn-ham { display: flex; }
    }
  `;
  document.head.appendChild(style);

  /* ── build HTML ─────────────────────────────────────── */
  var user = userGreeting();
  var cc   = cartCount();

  var userStripHtml = user.loggedIn
    ? '<div class="mn-user"><div class="mn-user-av">' + user.name.charAt(0).toUpperCase() + '</div><div><div class="mn-user-name">Hi, ' + user.name + '!</div><div class="mn-user-email">' + user.email + '</div></div></div>'
    : '<div class="mn-user"><div class="mn-user-av">👤</div><div><div class="mn-user-name">Guest</div><div class="mn-user-email">Sign in to track orders</div></div></div>';

  var sidebarHTML = `
    <!-- HAMBURGER -->
    <button id="mn-ham" aria-label="Menu" onclick="mnToggle()">
      <span></span><span></span><span></span>
    </button>

    <!-- OVERLAY -->
    <div id="mn-overlay" onclick="mnClose()"></div>

    <!-- SIDEBAR -->
    <div id="mn-sidebar">

      <!-- HEADER -->
      <div class="mn-header">
        <a href="index.html" class="mn-logo"><em>Aneesa</em> Hampers</a>
        <div class="mn-tagline">Premium Gifting · Kadapa</div>
      </div>

      <!-- USER STRIP -->
      ${userStripHtml}

      <!-- NAV LINKS -->
      <nav class="mn-nav">
        <div class="mn-section-lbl">Menu</div>
        <a href="index.html" class="mn-link ${isActive("index.html")}">
          <span class="mn-icon">🏠</span> Home
        </a>
        <a href="products.html" class="mn-link ${isActive("products.html")}">
          <span class="mn-icon">🎁</span> Collections
        </a>
        <a href="cart.html" class="mn-link ${isActive("cart.html")}">
          <span class="mn-icon">🛍️</span> Cart
          ${cc > 0 ? '<span class="mn-badge">' + cc + '</span>' : ''}
        </a>

        <div class="mn-section-lbl">Account</div>
        ${user.loggedIn
          ? `<a href="orders.html" class="mn-link ${isActive("orders.html")}">
               <span class="mn-icon">📦</span> My Orders
             </a>`
          : `<a href="login.html" class="mn-link ${isActive("login.html")}">
               <span class="mn-icon">🔑</span> Sign In / Register
             </a>`
        }
        <a href="track.html" class="mn-link ${isActive("track.html")}">
          <span class="mn-icon">📍</span> Track Order
        </a>

        <div class="mn-section-lbl">Support</div>
        <a href="https://wa.me/918639066613" target="_blank" class="mn-link">
          <span class="mn-icon">💬</span> WhatsApp Us
        </a>
      </nav>

      <!-- QR PAYMENT SECTION -->
      <div class="mn-qr-section">
        <div class="mn-qr-header">
          <div class="mn-qr-title">
            <strong>📱 Pay via PhonePe</strong>
            Tap unlock to scan QR
          </div>
          <button class="mn-unlock-btn" id="mnUnlockBtn" onclick="mnUnlockQR()">🔓 Unlock</button>
        </div>
        <div class="mn-qr-wrap">
          <img class="mn-qr-img" src="phonepe-qr.jpg" alt="PhonePe QR Code"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><rect width=%22200%22 height=%22200%22 fill=%22%23f9e4e9%22/><text x=%2250%25%22 y=%2245%25%22 text-anchor=%22middle%22 font-size=%2228%22>📱</text><text x=%2250%25%22 y=%2262%25%22 text-anchor=%22middle%22 font-size=%2211%22 fill=%22%23c0647a%22>PhonePe QR</text><text x=%2250%25%22 y=%2275%25%22 text-anchor=%22middle%22 font-size=%229%22 fill=%22%233b0d1a%22>8639066613@ybl</text></svg>'"/>
          <!-- LOCK OVERLAY -->
          <div class="mn-qr-lock" id="mnQrLock">
            <div class="mn-lock-icon">🔒</div>
            <div class="mn-lock-text">QR code is locked<br/>to prevent misuse</div>
            <div class="mn-lock-tap">Tap Unlock to pay</div>
          </div>
        </div>
        <div class="mn-upi">UPI ID: <span>8639066613@ybl</span> · Pay to <span>Aneesa</span></div>
      </div>

      <!-- FOOTER -->
      <div class="mn-footer">
        <a href="https://wa.me/918639066613?text=Hi%20Aneesa%20Hampers!%20I%20want%20to%20order%20a%20hamper%20%F0%9F%8E%81"
           target="_blank" class="mn-wa-btn">💬 Order on WhatsApp</a>
        <button class="mn-logout-btn" id="mnLogoutBtn" onclick="mnLogout()">🔒 Logout</button>
      </div>

    </div><!-- end sidebar -->
  `;

  var container = document.createElement("div");
  container.innerHTML = sidebarHTML;
  document.body.appendChild(container);

  /* ── show logout button if logged in ───────────────── */
  if (user.loggedIn) {
    var lb = document.getElementById("mnLogoutBtn");
    if (lb) lb.style.display = "flex";
  }

  /* ── FUNCTIONS ──────────────────────────────────────── */
  var _open = false;

  window.mnToggle = function () { _open ? mnClose() : mnOpen(); };

  window.mnOpen = function () {
    _open = true;
    document.getElementById("mn-ham").classList.add("open");
    document.getElementById("mn-sidebar").classList.add("open");
    var ov = document.getElementById("mn-overlay");
    ov.style.display = "block";
    setTimeout(function () { ov.classList.add("show"); }, 10);
    document.body.style.overflow = "hidden";
  };

  window.mnClose = function () {
    _open = false;
    document.getElementById("mn-ham").classList.remove("open");
    document.getElementById("mn-sidebar").classList.remove("open");
    var ov = document.getElementById("mn-overlay");
    ov.classList.remove("show");
    setTimeout(function () { ov.style.display = "none"; }, 300);
    document.body.style.overflow = "";
  };

  /* ── QR UNLOCK ──────────────────────────────────────── */
  var _unlocked = false;
  var _lockTimer = null;

  window.mnUnlockQR = function () {
    var lock = document.getElementById("mnQrLock");
    var btn  = document.getElementById("mnUnlockBtn");
    if (!lock || !btn) return;

    if (_unlocked) {
      // re-lock
      lock.classList.remove("hidden");
      btn.textContent = "🔓 Unlock";
      _unlocked = false;
      clearTimeout(_lockTimer);
    } else {
      // unlock
      lock.classList.add("hidden");
      btn.textContent = "🔒 Lock";
      _unlocked = true;
      // auto re-lock after 30 seconds
      _lockTimer = setTimeout(function () {
        lock.classList.remove("hidden");
        btn.textContent = "🔓 Unlock";
        _unlocked = false;
      }, 30000);
    }
  };

  /* ── LOGOUT ─────────────────────────────────────────── */
  window.mnLogout = async function () {
    if (!confirm("Log out of your account?")) return;
    try {
      // try Firebase signOut if available
      if (window._firebaseAuth) await window._firebaseAuth.signOut();
    } catch (e) {}
    localStorage.removeItem("ah_user");
    window.location.href = "login.html";
  };

  /* ── swipe to close (touch) ─────────────────────────── */
  var _tx = null;
  document.addEventListener("touchstart", function (e) {
    _tx = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (_tx === null) return;
    var dx = e.changedTouches[0].clientX - _tx;
    _tx = null;
    if (_open && dx < -60) mnClose();       // swipe left → close
    if (!_open && dx > 60 && e.changedTouches[0].clientX < 40) mnOpen(); // swipe right from edge
  }, { passive: true });

  /* ── ESC to close ───────────────────────────────────── */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && _open) mnClose();
  });

})();
