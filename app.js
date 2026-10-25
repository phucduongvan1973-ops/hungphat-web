const $ = s => document.querySelector(s);
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let cat = '', cart = {}, lang = 'vi';
try { cart = JSON.parse(localStorage.getItem('hp_cart') || '{}'); } catch (e) {}
try { lang = localStorage.getItem('hp_lang') || ((navigator.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en'); } catch (e) {}
const save = () => { try { localStorage.setItem('hp_cart', JSON.stringify(cart)); } catch (e) {} };

const T = {
  vi: { all: 'Tất cả', items: 'sản phẩm', add: 'Thêm vào giỏ', added: 'Đã thêm', code: 'Mã: ', contact: 'Liên hệ', sum: 'Tạm tính: ', quote: ' (chưa gồm món Liên hệ)', empty: 'Giỏ hàng đang trống.', none: 'Không tìm thấy sản phẩm phù hợp. Anh chị nhắn Zalo, cửa hàng sẽ tìm giúp.', copied: 'Đã sao chép đơn hàng. Anh chị dán vào khung chat Zalo của cửa hàng nhé.', copyAsk: 'Sao chép nội dung đơn này rồi dán vào Zalo cửa hàng:', title: 'Hưng Phát Souvenirs - Quà lưu niệm Huế' },
  en: { all: 'All', items: 'products', add: 'Add to cart', added: 'Added', code: 'Code: ', contact: 'Contact us', sum: 'Subtotal: ', quote: ' (not including Contact-us items)', empty: 'Your cart is empty.', none: 'No matching products. Message us on Zalo and we will help you find it.', copied: 'Your order was copied. Please paste it into the shop chat on Zalo.', copyAsk: 'Copy this order and paste it into the shop chat on Zalo:', title: 'Hung Phat Souvenirs - Hue gifts and souvenirs' }
};
const t = k => T[lang][k];
const money = n => n == null ? t('contact') : (lang === 'en' ? n.toLocaleString('en-US') + ' VND' : n.toLocaleString('vi-VN') + ' đ');
const pname = p => lang === 'en' ? EN[p.id].n : p.name;
const pdesc = p => lang === 'en' ? EN[p.id].d : p.desc;
const cname = c => lang === 'en' ? CAT_EN[c.id] : c.name;

function chips() {
  const all = [{ id: '', name: t('all') + ' (' + PRODUCTS.length + ')' }]
    .concat(CATS.map(c => ({ id: c.id, name: cname(c) + ' (' + PRODUCTS.filter(p => p.cat === c.id).length + ')' })));
  $('#chips').innerHTML = all.map(c => `<button class="chip${c.id === cat ? ' on' : ''}" data-c="${c.id}">${esc(c.name)}</button>`).join('');
}

function render() {
  const q = $('#q').value.trim().toLowerCase();
  const sort = $('#sort').value;
  let list = PRODUCTS.filter(p => (!cat || p.cat === cat) && (!q || (p.name + ' ' + p.desc + ' ' + EN[p.id].n + ' ' + EN[p.id].d + ' ' + p.id).toLowerCase().includes(q)));
  if (sort) list = list.slice().sort((a, b) => sort === 'asc' ? (a.price ?? Infinity) - (b.price ?? Infinity) : (b.price ?? -1) - (a.price ?? -1));
  $('#count').textContent = list.length + ' ' + t('items');
  $('#grid').innerHTML = list.map(p => `
    <article class="card" data-id="${esc(p.id)}">
      <img src="img/sp/${p.img}" alt="${esc(pname(p))}" loading="lazy">
      <div class="in">
        <div class="nm">${esc(pname(p))}</div>
        <p class="price">${money(p.price)}</p>
        <button class="add" data-add="${esc(p.id)}">${t('add')}</button>
      </div>
    </article>`).join('') || `<p class="empty">${t('none')}</p>`;
  chips();
}

function add(id) { cart[id] = (cart[id] || 0) + 1; save(); cartUI(); }
function cartUI() {
  const ids = Object.keys(cart).filter(i => byId[i]);
  $('#cartCount').textContent = ids.reduce((s, i) => s + cart[i], 0);
  $('#cartList').innerHTML = ids.length ? ids.map(i => {
    const p = byId[i];
    return `<div class="crow"><img src="img/sp/${p.img}" alt=""><div><div class="nm">${esc(pname(p))}</div>
      <div class="qty"><button data-q="-1" data-id="${esc(i)}">-</button>${cart[i]}<button data-q="1" data-id="${esc(i)}">+</button></div></div>
      <b>${p.price == null ? t('contact') : money(p.price * cart[i])}</b></div>`;
  }).join('') : `<p class="empty">${t('empty')}</p>`;
  const sum = ids.reduce((s, i) => s + (byId[i].price || 0) * cart[i], 0);
  const hasQuote = ids.some(i => byId[i].price == null);
  $('#cartTotal').textContent = ids.length ? t('sum') + money(sum) + (hasQuote ? t('quote') : '') : '';
  $('#orderForm').style.display = ids.length ? '' : 'none';
}

function open(m) { $(m).hidden = false; document.body.style.overflow = 'hidden'; }
function closeAll() { document.querySelectorAll('.modal').forEach(m => m.hidden = true); document.body.style.overflow = ''; }

let cur = null;
function detail(id) {
  const p = byId[id]; cur = id;
  $('#pmImg').src = 'img/sp/' + p.img; $('#pmImg').alt = pname(p);
  $('#pmCode').textContent = t('code') + p.id;
  $('#pmName').textContent = pname(p);
  $('#pmPrice').textContent = money(p.price);
  $('#pmDesc').textContent = pdesc(p);
  open('#pm');
}

function applyLang() {
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-en]').forEach(el => {
    if (el.dataset.vi === undefined) el.dataset.vi = el.textContent;
    el.textContent = lang === 'en' ? el.dataset.en : el.dataset.vi;
  });
  document.querySelectorAll('[data-en-ph]').forEach(el => {
    if (el.dataset.viPh === undefined) el.dataset.viPh = el.placeholder;
    el.placeholder = lang === 'en' ? el.dataset.enPh : el.dataset.viPh;
  });
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
  render(); cartUI();
  if (!$('#pm').hidden && cur) detail(cur);
}

document.addEventListener('click', e => {
  const x = e.target;
  if (x.dataset.lang) { lang = x.dataset.lang; try { localStorage.setItem('hp_lang', lang); } catch (er) {} applyLang(); return; }
  if (x.dataset.c !== undefined && x.classList.contains('chip')) { cat = x.dataset.c; render(); return; }
  if (x.dataset.add) { e.stopPropagation(); add(x.dataset.add); x.textContent = t('added'); setTimeout(() => x.textContent = t('add'), 900); return; }
  if (x.dataset.q) { const i = x.dataset.id; cart[i] = (cart[i] || 0) + Number(x.dataset.q); if (cart[i] <= 0) delete cart[i]; save(); cartUI(); return; }
  if (x.hasAttribute('data-close') || x.classList.contains('modal')) { closeAll(); return; }
  const card = x.closest('.card'); if (card) detail(card.dataset.id);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
$('#q').addEventListener('input', render);
$('#sort').addEventListener('change', render);
$('#openCart').addEventListener('click', () => { cartUI(); open('#cm'); });
$('#pmAdd').addEventListener('click', () => { add(cur); closeAll(); cartUI(); open('#cm'); });

$('#orderForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const ids = Object.keys(cart).filter(i => byId[i]);
  // Đơn gửi cho cửa hàng luôn bằng tiếng Việt kèm tên tiếng Anh để chủ cửa hàng dễ đọc
  const lines = ids.map(i => `- ${byId[i].id} | ${byId[i].name}${lang === 'en' ? ' (' + EN[i].n + ')' : ''} | SL ${cart[i]} | ${byId[i].price == null ? 'Liên hệ' : (byId[i].price * cart[i]).toLocaleString('vi-VN') + ' đ'}`);
  const sum = ids.reduce((s, i) => s + (byId[i].price || 0) * cart[i], 0);
  const msg = `ĐƠN HÀNG TỪ WEB HƯNG PHÁT${lang === 'en' ? ' (khách dùng bản tiếng Anh)' : ''}\nKhách: ${f.get('name')}\nSĐT: ${f.get('phone')}\nĐịa chỉ: ${f.get('addr')}\n${f.get('note') ? 'Ghi chú: ' + f.get('note') + '\n' : ''}Sản phẩm:\n${lines.join('\n')}\nTạm tính: ${sum.toLocaleString('vi-VN')} đ`;
  const go = () => window.open('https://zalo.me/0914101032', '_blank');
  (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(() => { alert(t('copied')); go(); })
    .catch(() => { prompt(t('copyAsk'), msg); go(); });
});

applyLang();
