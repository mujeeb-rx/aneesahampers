// ============================================================
//  ANEESA HAMPERS — Shared Firebase Config v3.0
//  Production-ready with real-time listeners
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy,
  where, serverTimestamp, getDoc, setDoc, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage, ref as storRef, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const FB_CONFIG = {
  apiKey: "AIzaSyCT98OpXIDMCHEiZl6PRrQ6GDziOo2hnTM",
  authDomain: "aneesa-hampers.firebaseapp.com",
  projectId: "aneesa-hampers",
  storageBucket: "aneesa-hampers.firebasestorage.app",
  messagingSenderId: "909653560410",
  appId: "1:909653560410:web:397db4fec2d9f042609c63"
};

const _app  = initializeApp(FB_CONFIG);
const db    = getFirestore(_app);
const stor  = getStorage(_app);
const auth  = getAuth(_app);

export { db, stor, auth };

// ── SESSION ───────────────────────────────────────────────
export function getSession() {
  try {
    const d = JSON.parse(localStorage.getItem('ah_user') || 'null');
    if (d && d.savedAt && Date.now() - d.savedAt > 7*86400000) {
      localStorage.removeItem('ah_user'); return null;
    }
    return d;
  } catch { return null; }
}
export function setSession(user) {
  const d = {
    uid: user.uid, email: user.email,
    name: user.displayName || user.email.split('@')[0],
    photoURL: user.photoURL || null, savedAt: Date.now()
  };
  localStorage.setItem('ah_user', JSON.stringify(d));
  return d;
}
export function clearSession() {
  Object.keys(localStorage).filter(k => k.startsWith('ah_')).forEach(k => localStorage.removeItem(k));
}
export async function doLogout() {
  try { await signOut(auth); } catch(e) {}
  clearSession();
  window.location.href = 'index.html';
}

// ── AUTH ──────────────────────────────────────────────────
export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, updateProfile, signOut };

// ── CART (per-user localStorage) ─────────────────────────
function cartKey() {
  const u = getSession();
  return u?.uid ? `ah_cart_${u.uid}` : 'ah_cart_guest';
}
export const Cart = {
  get() { try { return JSON.parse(localStorage.getItem(cartKey())||'[]'); } catch { return []; } },
  save(items) { localStorage.setItem(cartKey(), JSON.stringify(items)); Cart.badge(); },
  add(p) {
    const items = Cart.get(), ex = items.find(i => i.id === p.id);
    if (ex) ex.qty = (ex.qty||1) + 1; else items.push({...p, qty:1});
    Cart.save(items);
    Cart.toast(`✅ "${p.name}" added to cart!`);
  },
  remove(id)    { Cart.save(Cart.get().filter(i => i.id !== id)); },
  updateQty(id, d) {
    const items = Cart.get(), item = items.find(i => i.id === id);
    if (item) { item.qty = Math.max(1, (item.qty||1) + d); Cart.save(items); }
  },
  total()  { return Cart.get().reduce((s,i) => s + i.price*(i.qty||1), 0); },
  count()  { return Cart.get().reduce((s,i) => s + (i.qty||1), 0); },
  clear()  { localStorage.removeItem(cartKey()); Cart.badge(); },
  badge() {
    const n = Cart.count();
    document.querySelectorAll('.cart-count, .cart-badge, [data-cart-count]')
      .forEach(el => el.textContent = n);
    document.querySelectorAll('.bn-badge').forEach(el => {
      el.textContent = n; el.style.display = n > 0 ? 'flex' : 'none';
    });
  },
  toast(msg) {
    let t = document.getElementById('ah-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'ah-toast';
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#3b0d1a;color:white;padding:11px 24px;border-radius:30px;font-size:.78rem;z-index:99999;display:none;font-family:Jost,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.2);pointer-events:none;white-space:nowrap;';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', 2600);
  }
};

// ── PRODUCTS ──────────────────────────────────────────────
export async function addProduct(data) {
  return addDoc(collection(db,'products'), {...data, createdAt: serverTimestamp()});
}
export function listenProducts(cb, catFilter=null) {
  const q = catFilter && catFilter !== 'all'
    ? query(collection(db,'products'), where('category','==',catFilter), orderBy('createdAt','desc'))
    : query(collection(db,'products'), orderBy('createdAt','desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({id:d.id,...d.data()}))));
}
export async function getProduct(id) {
  const snap = await getDoc(doc(db,'products',id));
  return snap.exists() ? {id:snap.id,...snap.data()} : null;
}
export async function updateProduct(id, data) {
  return updateDoc(doc(db,'products',id), {...data, updatedAt: serverTimestamp()});
}
export async function deleteProduct(id) {
  return deleteDoc(doc(db,'products',id));
}

// ── ORDERS ────────────────────────────────────────────────
export async function placeOrder(orderData) {
  // Generate human-readable tracking ID: AH + 6 random alphanumeric chars
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let trackingId = 'AH';
  for (let i = 0; i < 6; i++) trackingId += chars[Math.floor(Math.random() * chars.length)];

  const ref = await addDoc(collection(db,'orders'), {
    ...orderData,
    status: 'pending',
    trackingId,
    createdAt: serverTimestamp()
  });
  // Return both for callers that need trackingId (backward compat: still returns string id)
  const result = ref.id;
  result._trackingId = trackingId; // attach for callers that check this
  return ref.id;
}

// Helper: get trackingId for a placed order
export async function getTrackingId(orderId) {
  const snap = await getDoc(doc(db,'orders',orderId));
  return snap.exists() ? (snap.data().trackingId || ('#' + orderId.slice(-6).toUpperCase())) : null;
}
export function listenOrders(cb, uid=null) {
  const q = uid
    ? query(collection(db,'orders'), where('uid','==',uid), orderBy('createdAt','desc'))
    : query(collection(db,'orders'), orderBy('createdAt','desc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({id:d.id,...d.data()}))));
}
export async function updateOrderStatus(id, status) {
  return updateDoc(doc(db,'orders',id), {status, updatedAt: serverTimestamp()});
}
export async function cancelOrder(id) {
  return updateDoc(doc(db,'orders',id), {status:'cancelled', cancelledAt: serverTimestamp()});
}

// ── USERS ─────────────────────────────────────────────────
export async function saveUserProfile(uid, data) {
  return setDoc(doc(db,'users',uid), {...data, updatedAt: serverTimestamp()}, {merge:true});
}
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db,'users',uid));
  return snap.exists() ? {id:snap.id,...snap.data()} : null;
}
export function listenUserProfile(uid, cb) {
  return onSnapshot(doc(db,'users',uid), snap => cb(snap.exists() ? {id:snap.id,...snap.data()} : null));
}

// ── CATEGORIES ────────────────────────────────────────────
export function listenCategories(cb) {
  return onSnapshot(
    query(collection(db,'categories'), orderBy('order','asc')),
    snap => cb(snap.docs.map(d => ({id:d.id,...d.data()})))
  );
}
export async function saveCategory(id, data) {
  return setDoc(doc(db,'categories',id), {...data, updatedAt: serverTimestamp()}, {merge:true});
}
export async function deleteCategory(id) {
  return deleteDoc(doc(db,'categories',id));
}

// ── SITE SETTINGS ─────────────────────────────────────────
export function listenSettings(cb) {
  return onSnapshot(doc(db,'siteSettings','config'), snap => {
    if (snap.exists()) cb(snap.data());
  });
}
export async function saveSettings(data) {
  return setDoc(doc(db,'siteSettings','config'), data, {merge:true});
}

// ── FILE UPLOAD (imgbb) ───────────────────────────────────
const IMGBB = '9f8a4bb8beff4d9e610a52d2962f2a3e';
export async function uploadImage(file, onProg) {
  if (file.size > 10*1024*1024) throw new Error('File too large. Max 10MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = ev.target.result.split(',')[1];
      const fd = new FormData(); fd.append('image', b64);
      try {
        onProg && onProg(50);
        const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB}`, {method:'POST',body:fd});
        const d = await r.json();
        if (d.success) { onProg && onProg(100); resolve(d.data.url); }
        else reject(new Error('Upload failed'));
      } catch(e) { reject(e); }
    };
    reader.readAsDataURL(file);
  });
}

// ── WHATSAPP ──────────────────────────────────────────────
export const WA = {
  number: '918639066613',
  open(msg) { window.open(`https://wa.me/${this.number}?text=${encodeURIComponent(msg)}`, '_blank'); },
  sendOrder(order) {
    const lines = order.items.map(i=>`• ${i.name} ×${i.qty} = ₹${(i.price*i.qty).toLocaleString()}`).join('\n');
    this.open(`🎁 *New Order — Aneesa Hampers*\n━━━━━━━━━━━━━━━\n👤 *Name:* ${order.name}\n📞 *Phone:* ${order.phone}\n📍 *Address:* ${order.address}\n🚚 *Delivery:* ${order.deliveryType}\n━━━━━━━━━━━━━━━\n🛍️ *Items:*\n${lines}\n━━━━━━━━━━━━━━━\n💰 *Total: ₹${order.total.toLocaleString()}*\n🆔 *Order ID:* #${order.orderId}`);
  }
};
