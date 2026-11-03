// Lockup horizontal: coração à esquerda, "CARDIO PRIME" + fio vermelho à direita.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('/Users/joaomarcosom/Dev/Conexxio/proposta-kit/package.json');
const { chromium } = require('playwright');
const dir = '/Users/joaomarcosom/Dev/propostas/cardio-prime/';
const data = 'data:image/png;base64,' + fs.readFileSync(dir + 'brand/logo-original.png').toString('base64');
const b = await chromium.launch({ channel: 'chromium' });
const p = await b.newPage();
const r = await p.evaluate(async (data) => {
  const img = new Image(); img.src = data; await img.decode();
  const W0 = img.naturalWidth, H0 = img.naturalHeight;
  const src = document.createElement('canvas'); src.width = W0; src.height = H0;
  const sx = src.getContext('2d'); sx.drawImage(img, 0, 0);
  const d = sx.getImageData(0, 0, W0, H0).data;
  // faixas de linhas com conteúdo
  const rows = []; for (let y = 0; y < H0; y++) { let n = 0; for (let x = 0; x < W0; x++) if (d[(y * W0 + x) * 4 + 3] > 60) n++; rows.push(n); }
  const bands = []; let s = -1;
  rows.forEach((n, y) => { if (n > 0 && s < 0) s = y; if (n === 0 && s >= 0) { bands.push([s, y - 1]); s = -1; } });
  if (s >= 0) bands.push([s, H0 - 1]);
  const box = ([y0, y1]) => { let x0 = W0, x1 = 0; for (let y = y0; y <= y1; y++) for (let x = 0; x < W0; x++) if (d[(y * W0 + x) * 4 + 3] > 60) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return [x0, y0, x1 - x0 + 1, y1 - y0 + 1]; };
  const boxes = bands.filter(([a, z]) => z - a > 3).map(box);
  if (boxes.length < 2) return { boxes };
  const mark = boxes[0];
  // tudo abaixo do coração (texto + fio) vira um bloco só
  const last = boxes[boxes.length - 1];
  const tx0 = Math.min(...boxes.slice(1).map(b => b[0])), tx1 = Math.max(...boxes.slice(1).map(b => b[0] + b[2]));
  const word = [tx0, boxes[1][1], tx1 - tx0, last[1] + last[3] - boxes[1][1]];
  const mh = 300, ms = mh / mark[3], mw = mark[2] * ms;
  const wh = 150, ws = wh / word[3], ww = word[2] * ws, gap = 50;
  const c = document.createElement('canvas'); c.width = Math.round(mw + gap + ww); c.height = mh;
  const x = c.getContext('2d');
  x.drawImage(src, ...mark, 0, 0, mw, mh);
  x.drawImage(src, ...word, mw + gap, (mh - wh) / 2 + 20, ww, wh);
  // escurece o prata para ler no cabeçalho branco, sem tocar no vermelho
  const id = x.getImageData(0, 0, c.width, c.height), e = id.data;
  for (let i = 0; i < e.length; i += 4) {
    const mx = Math.max(e[i], e[i + 1], e[i + 2]), mn = Math.min(e[i], e[i + 1], e[i + 2]);
    if (mx - mn < 40) { e[i] *= .55; e[i + 1] *= .55; e[i + 2] *= .55; }
  }
  x.putImageData(id, 0, 0);
  return { boxes, url: c.toDataURL('image/png'), w: c.width, h: c.height };
}, data);
console.log(JSON.stringify(r.boxes), r.w + 'x' + r.h);
if (r.url) fs.writeFileSync(dir + 'brand/logo.png', Buffer.from(r.url.split(',')[1], 'base64'));
await b.close();
