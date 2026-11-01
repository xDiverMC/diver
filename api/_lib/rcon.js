// api/_lib/rcon.js — klien RCON minimal (protokol Source/Minecraft), tanpa dependency.
import net from "node:net";

const TYPE_CMD = 2;
const TYPE_AUTH = 3;

function encode(id, type, body) {
  const payload = Buffer.from(body, "utf8");
  const buf = Buffer.alloc(14 + payload.length);
  buf.writeInt32LE(10 + payload.length, 0);
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  payload.copy(buf, 12);
  return buf; // 2 byte null di akhir sudah 0
}

class Reader {
  constructor(socket) {
    this.buf = Buffer.alloc(0);
    this.queue = [];
    this.waiters = [];
    this.error = null;
    socket.on("data", (d) => {
      this.buf = Buffer.concat([this.buf, d]);
      this.drain();
    });
    socket.on("error", (e) => this.fail(e));
    socket.on("close", () => this.fail(new Error("Koneksi RCON ditutup")));
  }
  drain() {
    while (this.buf.length >= 4) {
      const len = this.buf.readInt32LE(0);
      if (len < 10 || len > 4110) return this.fail(new Error("Paket RCON tidak valid"));
      if (this.buf.length < 4 + len) return;
      const packet = {
        id: this.buf.readInt32LE(4),
        type: this.buf.readInt32LE(8),
        body: this.buf.toString("utf8", 12, 4 + len - 2),
      };
      this.buf = this.buf.subarray(4 + len);
      const w = this.waiters.shift();
      if (w) {
        clearTimeout(w.timer);
        w.resolve(packet);
      } else {
        this.queue.push(packet);
      }
    }
  }
  fail(err) {
    if (this.error) return;
    this.error = err;
    for (const w of this.waiters.splice(0)) {
      clearTimeout(w.timer);
      w.reject(err);
    }
  }
  next(timeoutMs) {
    if (this.queue.length) return Promise.resolve(this.queue.shift());
    if (this.error) return Promise.reject(this.error);
    return new Promise((resolve, reject) => {
      const w = { resolve, reject };
      w.timer = setTimeout(() => {
        this.waiters = this.waiters.filter((x) => x !== w);
        reject(new Error("RCON timeout menunggu balasan"));
      }, timeoutMs);
      this.waiters.push(w);
    });
  }
}

function connect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const t = setTimeout(() => {
      socket.destroy();
      reject(new Error("RCON timeout saat konek ke server"));
    }, timeoutMs);
    socket.once("connect", () => {
      clearTimeout(t);
      resolve(socket);
    });
    socket.once("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

/**
 * Jalankan daftar command lewat satu sesi RCON.
 * @returns {Promise<{command: string, output: string}[]>}
 */
export async function runRconCommands(commands, opts = {}) {
  const host = opts.host ?? process.env.RCON_HOST;
  const port = Number(opts.port ?? process.env.RCON_PORT ?? 25575);
  const password = opts.password ?? process.env.RCON_PASSWORD;
  const timeoutMs = opts.timeoutMs ?? 6000;

  if (!host || !password) {
    throw new Error("RCON belum dikonfigurasi (set RCON_HOST dan RCON_PASSWORD)");
  }

  const clean = commands.map((c) => String(c).replace(/^\//, "").trim());
  for (const c of clean) {
    if (!c || /[\r\n\0]/.test(c)) throw new Error("Command tidak valid: " + JSON.stringify(c));
  }

  const socket = await connect(host, port, timeoutMs);
  const reader = new Reader(socket);
  try {
    socket.write(encode(1, TYPE_AUTH, password));
    for (;;) {
      const p = await reader.next(timeoutMs);
      if (p.type !== 2) continue; // lewati paket kosong sebelum auth response
      if (p.id === -1) throw new Error("Password RCON salah");
      break;
    }

    const results = [];
    let id = 10;
    for (const command of clean) {
      id += 1;
      socket.write(encode(id, TYPE_CMD, command));
      for (;;) {
        const p = await reader.next(timeoutMs);
        if (p.id === id) {
          results.push({ command, output: p.body });
          break;
        }
      }
    }
    return results;
  } finally {
    socket.destroy();
  }
}
