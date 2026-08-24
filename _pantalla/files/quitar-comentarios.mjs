import fs from 'fs';
import path from 'path';

const raiz = 'src';
let tocados = 0, quitados = 0;

const archivos = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? archivos(p) : [p];
  });

const ANTES_DE_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^', '<', '>', 'return', 'typeof', 'case', 'in', 'of', 'do', 'else']);

function limpiarTS(t) {
  let s = '';
  let i = 0;
  let ultimoSignificativo = '';

  const anteriorPermiteRegex = () => {
    const c = ultimoSignificativo;
    if (!c) return true;
    if (/[A-Za-z0-9_$)\]]/.test(c.slice(-1))) {
      return ANTES_DE_REGEX.has(c);
    }
    return true;
  };

  while (i < t.length) {
    const c = t[i];
    const d = t[i + 1];

    if (c === '/' && d === '/') {
      const f = t.indexOf('\n', i);
      i = f === -1 ? t.length : f;
      quitados++;
      continue;
    }

    if (c === '/' && d === '*') {
      const f = t.indexOf('*/', i + 2);
      i = f === -1 ? t.length : f + 2;
      quitados++;
      continue;
    }

    if (c === '"' || c === "'") {
      const cierre = c;
      s += c; i++;
      while (i < t.length) {
        if (t[i] === '\\') { s += t[i] + (t[i + 1] ?? ''); i += 2; continue; }
        s += t[i];
        if (t[i] === cierre) { i++; break; }
        i++;
      }
      ultimoSignificativo = cierre;
      continue;
    }

    if (c === '`') {
      s += c; i++;
      let prof = 0;
      while (i < t.length) {
        if (t[i] === '\\') { s += t[i] + (t[i + 1] ?? ''); i += 2; continue; }
        if (t[i] === '$' && t[i + 1] === '{') { prof++; s += '${'; i += 2; continue; }
        if (prof > 0 && t[i] === '}') { prof--; s += '}'; i++; continue; }
        if (prof === 0 && t[i] === '`') { s += '`'; i++; break; }
        s += t[i]; i++;
      }
      ultimoSignificativo = '`';
      continue;
    }

    if (c === '/' && anteriorPermiteRegex()) {
      let j = i + 1, enClase = false, ok = false;
      while (j < t.length) {
        if (t[j] === '\\') { j += 2; continue; }
        if (t[j] === '\n') break;
        if (t[j] === '[') enClase = true;
        else if (t[j] === ']') enClase = false;
        else if (t[j] === '/' && !enClase) { ok = true; break; }
        j++;
      }
      if (ok) {
        while (j + 1 < t.length && /[gimsuyvd]/.test(t[j + 1])) j++;
        s += t.slice(i, j + 1);
        i = j + 1;
        ultimoSignificativo = '/';
        continue;
      }
    }

    s += c;
    if (!/\s/.test(c)) {
      ultimoSignificativo = /[A-Za-z0-9_$]/.test(c)
        ? (ultimoSignificativo.match(/[A-Za-z0-9_$]+$/) ? ultimoSignificativo + c : c)
        : c;
    }
    i++;
  }
  return s;
}

function limpiarCSS(t) {
  let s = '', i = 0, comilla = null;
  while (i < t.length) {
    const c = t[i];
    if (comilla) { s += c; if (c === '\\') { s += t[i+1] ?? ''; i += 2; continue; } if (c === comilla) comilla = null; i++; continue; }
    if (c === '"' || c === "'") { comilla = c; s += c; i++; continue; }
    if (c === '/' && t[i+1] === '*') { const f = t.indexOf('*/', i + 2); i = f === -1 ? t.length : f + 2; quitados++; continue; }
    s += c; i++;
  }
  return s;
}

function limpiarHTML(t) {
  let s = '', i = 0;
  while (i < t.length) {
    if (t.startsWith('<!--', i)) { const f = t.indexOf('-->', i + 4); i = f === -1 ? t.length : f + 3; quitados++; continue; }
    s += t[i]; i++;
  }
  return s;
}

const ordenar = (t) =>
  t.split('\n').map((l) => l.replace(/[ \t]+$/, '')).join('\n')
   .replace(/\n{3,}/g, '\n\n')
   .replace(/\{\n\n/g, '{\n')
   .replace(/\n\n(\s*[)\]}])/g, '\n$1')
   .replace(/^\n+/, '')
   .replace(/\n+$/, '\n');

for (const f of archivos(raiz)) {
  const ext = path.extname(f);
  if (!['.ts', '.html', '.css'].includes(ext)) continue;
  const antes = fs.readFileSync(f, 'utf8');
  let d = ext === '.ts' ? limpiarTS(antes) : ext === '.css' ? limpiarCSS(antes) : limpiarHTML(antes);
  d = ordenar(d);
  if (d !== antes) { fs.writeFileSync(f, d); tocados++; }
}

console.log(`archivos modificados: ${tocados}`);
console.log(`comentarios quitados: ${quitados}`);
