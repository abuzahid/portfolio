const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');

// Simple file-level mutex
const locks = {};

function acquireLock(file) {
  return new Promise((resolve) => {
    if (!locks[file]) {
      locks[file] = false;
    }
    const check = () => {
      if (!locks[file]) {
        locks[file] = true;
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

function releaseLock(file) {
  locks[file] = false;
}

function readJSON(filename) {
  const filePath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJSON(filename, data) {
  const filePath = path.join(dataDir, filename);
  const tmpPath = filePath + '.tmp';

  await acquireLock(filename);
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } finally {
    releaseLock(filename);
  }
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { readJSON, writeJSON, nextId, slugify };
