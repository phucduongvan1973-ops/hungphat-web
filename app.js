const $ = s => document.querySelector(s);
const money = n => n == null ? 'Liên hệ' : n.toLocaleString('vi-VN') + ' đ';
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let cat = '', cart = {};
try { cart = JSON.parse(localStorage.getItem('hp_cart') || '{}'); } catch (e) {}
const save = () => { try { localStorage.setItem('hp_cart', JSON.stringify(cart)); } catch (e) {} };

function chips() {
  const all = [{ id: '', name: 'Tất cả (' + PRODUCTS.length + ')' }]
    .concat(CATS.map(c => ({ id: c.id, name: c.name + ' (' + PRODUCTS.filter(p => p.cat === c.id).length + ')' })));
  $('#chips').innerHTML = all.map(c => `<button class="chip${c.id === cat ? ' on' : ''}" data-c="${c.id}">${esc(c.name)}</button>`).join('');
}

function render() {
  const q = $('#q').value.trim().toLowerCase();
  const sort = $('#sort').value;
  let list = PRODUCTS.filter(p => (!cat || p.cat === cat) && (!q || (p.name + ' ' + p.desc + ' ' + p.id).toLowerCase().includes(q)));
  if (sort) list = list.slice().sort((a, b) => {
    const x = a.price ?? Infinity, y = b.price ?? Infinity;
    return sort === 'asc' ? x - y : (b.price ?? -1) - (a.price ?? -1);
  });
  $('#count').textContent = list.length + ' sản phẩm';
  $('#grid').innerHTML = list.map(p => `
    <article class="card" data-id="${esc(p.id)}">
      <img src="img/sp/${p.img}" alt="${esc(p.name)}" loading="lazy">
      <div class="in">
        <div class="nm">${esc(p.name)}</div>
        <p class="price">${money(p.price)}</p>
        <button class="add" data-add="${esc(p.id)}">Thêm vào giỏ</button>
      </div>
    </article>`).join('') || '<p class="empty">Không tìm thấy sản phẩm phù hợp. Anh chị nhắn Zalo, cửa hàng sẽ tìm giúp.</p>';
  chips();
}

function add(id) { cart[id] = (cart[id] || 0) + 1; save(); cartUI(); }
function cartUI() {
  const ids = Object.keys(cart).filter(i => byId[i]);
  $('#cartCount').textContent = ids.reduce((s, i) => s + cart[i], 0);
  $('#cartList').innerHTML = ids.length ? ids.map(i => {
    const p = byId[i];
    return `<div class="crow"><img src="img/sp/${p.img}" alt=""><div><div class="nm">${esc(p.name)}</div>
      <div class="qty"><button data-q="-1" data-id="${esc(i)}">-</button>${cart[i]}<button data-q="1" data-id="${esc(i)}">+</button></div></div>
      <b>${p.price == null ? 'Liên hệ' : (p.price * cart[i]).toLocaleString('vi-VN') + ' đ'}</b></div>`;
  }).join('') : '<p class="empty">Giỏ hàng đang trống.</p>';
  const sum = ids.reduce((s, i) => s + (byId[i].price || 0) * cart[i], 0);
  const hasQuote = ids.some(i => byId[i].price == null);
  $('#cartTotal').textContent = ids.length ? 'Tạm tính: ' + sum.toLocaleString('vi-VN') + ' đ' + (hasQuote ? ' (chưa gồm món Liên hệ)' : '') : '';
  $('#orderForm').style.display = ids.length ? '' : 'none';
}

function open(m) { $(m).hidden = false; document.body.style.overflow = 'hidden'; }
function closeAll() { document.querySelectorAll('.modal').forEach(m => m.hidden = true); document.body.style.overflow = ''; }

let cur = null;
function detail(id) {
  const p = byId[id]; cur = id;
  $('#pmImg').src = 'img/sp/' + p.img; $('#pmImg').alt = p.name;
  $('#pmCode').textContent = 'Mã: ' + p.id;
  $('#pmName').textContent = p.name;
  $('#pmPrice').textContent = money(p.price);
  $('#pmDesc').textContent = p.desc;
  open('#pm');
}

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.c !== undefined && t.classList.contains('chip')) { cat = t.dataset.c; render(); return; }
  if (t.dataset.add) { e.stopPropagation(); add(t.dataset.add); t.textContent = 'Đã thêm'; setTimeout(() => t.textContent = 'Thêm vào giỏ', 900); return; }
  if (t.dataset.q) { const i = t.dataset.id; cart[i] = (cart[i] || 0) + Number(t.dataset.q); if (cart[i] <= 0) delete cart[i]; save(); cartUI(); return; }
  if (t.hasAttribute('data-close') || t.classList.contains('modal')) { closeAll(); return; }
  const card = t.closest('.card'); if (card) detail(card.dataset.id);
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
  const lines = ids.map(i => `- ${byId[i].id} | ${byId[i].name} | SL ${cart[i]} | ${byId[i].price == null ? 'Liên hệ' : (byId[i].price * cart[i]).toLocaleString('vi-VN') + ' đ'}`);
  const sum = ids.reduce((s, i) => s + (byId[i].price || 0) * cart[i], 0);
  const msg = `ĐƠN HÀNG TỪ WEB HƯNG PHÁT\nKhách: ${f.get('name')}\nSĐT: ${f.get('phone')}\nĐịa chỉ: ${f.get('addr')}\n${f.get('note') ? 'Ghi chú: ' + f.get('note') + '\n' : ''}Sản phẩm:\n${lines.join('\n')}\nTạm tính: ${sum.toLocaleString('vi-VN')} đ`;
  const go = () => window.open('https://zalo.me/0914101032', '_blank');
  (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(() => { alert('Đã sao chép đơn hàng. Anh chị dán vào khung chat Zalo của cửa hàng nhé.'); go(); })
    .catch(() => { prompt('Sao chép nội dung đơn này rồi dán vào Zalo cửa hàng:', msg); go(); });
});

render(); cartUI();
