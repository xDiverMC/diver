// src/pages/legal/legalContent.js — isi halaman Syarat, Privasi, dan Refund.
//
// PENTING: ini DRAF STANDAR untuk toko item digital server Minecraft. Pemilik toko wajib
// membaca dan menyesuaikannya (terutama batas waktu refund, kebijakan ban, dan kontak) sebelum
// dipakai. Bukan nasihat hukum.
//
// Format: setiap bagian = { heading, body: [teks | { list: [teks, ...] }] }
import { CONTACT_EMAIL, DISCORD_INVITE_URL, SITE_NAME } from "../../config/site";

function contactLine() {
  const via = [];
  if (DISCORD_INVITE_URL) via.push(`Discord resmi ${SITE_NAME} (${DISCORD_INVITE_URL})`);
  if (CONTACT_EMAIL) via.push(`email ${CONTACT_EMAIL}`);
  return via.length
    ? `Hubungi kami melalui ${via.join(" atau ")}.`
    : `Hubungi kami melalui channel dukungan di Discord resmi ${SITE_NAME}.`;
}

export const REFUND_WINDOW_DAYS = 7; // ubah di sini kalau kebijakannya berbeda

export const TERMS = {
  title: "Syarat & Ketentuan",
  path: "/terms",
  description: `Syarat dan ketentuan penggunaan situs dan toko ${SITE_NAME}.`,
  intro: `Dengan mengakses situs ini atau membeli di toko ${SITE_NAME}, kamu menyatakan telah membaca, memahami, dan menyetujui syarat berikut. Jika tidak setuju, mohon jangan melakukan pembelian.`,
  sections: [
    {
      heading: "1. Tentang layanan",
      body: [
        `${SITE_NAME} adalah server Minecraft (Java & Bedrock). Toko di situs ini menjual barang digital untuk dipakai di dalam server, seperti rank, crate key, dan paket mata uang in-game.`,
      ],
    },
    {
      heading: "2. Data pembelian dan username Minecraft",
      body: [
        "Item dikirim ke username Minecraft yang kamu isi saat checkout. Pastikan penulisannya benar:",
        {
          list: [
            "Pemain Java: 3–16 karakter, hanya huruf, angka, dan underscore.",
            "Pemain Bedrock: awali dengan titik, contoh .NamaKamu.",
            "Kesalahan penulisan username dan email menjadi tanggung jawab pembeli.",
          ],
        },
      ],
    },
    {
      heading: "3. Harga dan pembayaran",
      body: [
        "Harga di toko ditampilkan dalam USD dan ditagih dalam Rupiah memakai kurs yang berlaku di sistem kami saat transaksi dibuat. Pembayaran diproses oleh penyedia pembayaran pihak ketiga (Tripay). Biaya layanan dari penyedia pembayaran, jika ada, ditampilkan di halaman pembayaran sebelum kamu membayar.",
        "Pesanan yang belum dibayar dalam 24 jam akan kedaluwarsa otomatis dan perlu dibuat ulang.",
      ],
    },
    {
      heading: "4. Pengiriman item",
      body: [
        "Setelah pembayaran terkonfirmasi, item dikirim otomatis ke akun Minecraft kamu, umumnya segera setelah pembayaran diterima. Beberapa item mungkin mengharuskan kamu pernah bergabung atau sedang online di server.",
        `Jika pengiriman otomatis gagal, sistem akan mencoba ulang dan tim kami dapat mengirimkannya secara manual. Kamu dapat memantau status pesanan kapan saja di halaman Cek Pesanan menggunakan username Minecraft atau email yang dipakai saat checkout.`,
      ],
    },
    {
      heading: "5. Sifat barang digital",
      body: [
        "Semua item adalah barang digital yang hanya berlaku di dalam server. Item tidak memiliki nilai uang nyata, tidak dapat diuangkan, dan tidak boleh dijual kembali atau dipindahtangankan di luar server.",
        "Demi keseimbangan permainan, kami dapat menyesuaikan isi, fitur, atau harga item dari waktu ke waktu. Layanan disediakan sebagaimana adanya, dan kami berupaya menjaganya tetap berjalan tetapi tidak dapat menjamin tanpa gangguan.",
      ],
    },
    {
      heading: "6. Aturan server dan sanksi",
      body: [
        "Membeli item tidak membebaskan pemain dari aturan server. Pelanggaran seperti curang (cheat), penyalahgunaan bug, atau perilaku merugikan pemain lain dapat berujung pada pembatasan atau pemblokiran akun. Pembelian pada akun yang dikenai sanksi karena pelanggaran tidak dapat dikembalikan.",
      ],
    },
    {
      heading: "7. Kupon dan batas pembelian",
      body: [
        "Kupon berlaku sesuai ketentuannya masing-masing, misalnya masa berlaku, kuota pemakaian, minimal belanja, atau batas satu kali per pemain. Beberapa produk memiliki batas pembelian per pesanan, per hari, atau satu kali per pemain. Kami berhak membatalkan kupon atau pesanan yang terindikasi disalahgunakan.",
      ],
    },
    {
      heading: "8. Penipuan dan penyalahgunaan",
      body: [
        "Transaksi yang mencurigakan, penggunaan metode pembayaran milik orang lain tanpa izin, atau upaya penipuan dapat dibatalkan, dan akun terkait dapat diblokir tanpa pengembalian.",
      ],
    },
    {
      heading: "9. Pembeli di bawah umur",
      body: [
        "Jika kamu berusia di bawah 18 tahun, pastikan kamu mendapat izin orang tua atau wali sebelum melakukan pembelian.",
      ],
    },
    {
      heading: "10. Batas tanggung jawab",
      body: [
        "Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung, gangguan layanan pihak ketiga (penyedia pembayaran, hosting, jaringan), atau kehilangan item akibat kesalahan pengguna. Tanggung jawab kami terbatas pada nilai pembelian yang bersangkutan.",
      ],
    },
    {
      heading: "11. Bukan layanan resmi Minecraft",
      body: [
        `${SITE_NAME} bukan layanan resmi Minecraft dan tidak disetujui atau berafiliasi dengan Mojang Studios maupun Microsoft. Minecraft adalah merek dagang milik pemegang haknya.`,
      ],
    },
    {
      heading: "12. Perubahan syarat",
      body: [
        "Kami dapat memperbarui syarat ini sewaktu-waktu. Versi terbaru berlaku sejak dipublikasikan di halaman ini. Dengan terus memakai situs atau toko, kamu dianggap menyetujui perubahan tersebut.",
      ],
    },
    { heading: "13. Kontak", body: [contactLine()] },
  ],
};

export const PRIVACY = {
  title: "Kebijakan Privasi",
  path: "/privacy",
  description: `Bagaimana ${SITE_NAME} mengumpulkan, memakai, dan melindungi data pribadi pembeli.`,
  intro: `Kebijakan ini menjelaskan data apa yang kami kumpulkan saat kamu memakai situs dan toko ${SITE_NAME}, untuk apa data itu dipakai, dan pilihan yang kamu miliki.`,
  sections: [
    {
      heading: "1. Data yang kami kumpulkan",
      body: [
        {
          list: [
            "Data pesanan: nama, alamat email, username Minecraft, item yang dibeli, jumlah, total pembayaran, metode pembayaran, kode kupon, serta status dan waktu transaksi.",
            "Data teknis: alamat IP, jenis perangkat/peramban, dan log akses yang dicatat oleh penyedia hosting kami untuk keamanan dan operasional.",
            "Data di peramban: isi keranjang belanja disimpan di penyimpanan lokal peramban kamu agar tidak hilang saat halaman dimuat ulang.",
            "Catatan sistem: kejadian seperti pesanan dibuat, pembayaran diterima, dan hasil pengiriman item, untuk pemecahan masalah.",
          ],
        },
        "Kami tidak menyimpan nomor kartu, rekening, atau akun e-wallet kamu. Pembayaran diproses langsung oleh penyedia pembayaran.",
      ],
    },
    {
      heading: "2. Untuk apa data dipakai",
      body: [
        {
          list: [
            "Memproses pesanan dan mengirim item ke akun Minecraft kamu.",
            "Mengirim email konfirmasi pembayaran dan pengiriman.",
            "Memberi dukungan, menangani sengketa dan permintaan refund.",
            "Mencegah penipuan dan penyalahgunaan.",
            "Menampilkan papan donatur dan statistik toko.",
          ],
        },
      ],
    },
    {
      heading: "3. Papan donatur publik",
      body: [
        "Halaman toko menampilkan papan donatur berisi username Minecraft dan total pembelian (bulan ini dan sepanjang waktu). Jika kamu ingin username kamu disembunyikan dari papan tersebut, hubungi kami dan kami akan menyembunyikannya.",
      ],
    },
    {
      heading: "4. Pihak ketiga yang memproses data",
      body: [
        "Untuk menjalankan layanan, data tertentu diproses oleh penyedia berikut:",
        {
          list: [
            "Tripay — pemrosesan pembayaran.",
            "Supabase — penyimpanan database dan berkas.",
            "Vercel — hosting situs.",
            "Layanan pengiriman email transaksional — pengiriman email konfirmasi.",
            "Discord — notifikasi internal ke tim admin (berisi username, item, dan total pesanan).",
          ],
        },
        "Kami tidak menjual data pribadi kamu. Data dibagikan hanya sejauh diperlukan untuk menjalankan layanan, atau bila diwajibkan oleh hukum.",
      ],
    },
    {
      heading: "5. Penyimpanan data",
      body: [
        "Catatan transaksi disimpan selama diperlukan untuk pembukuan, penanganan sengketa, pencegahan penipuan, dan kewajiban hukum.",
      ],
    },
    {
      heading: "6. Hak kamu",
      body: [
        "Kamu dapat meminta akses, koreksi, atau penghapusan data pribadi kamu. Sebagian catatan transaksi mungkin tetap harus kami simpan untuk keperluan hukum dan pembukuan.",
      ],
    },
    {
      heading: "7. Keamanan",
      body: [
        "Situs diakses melalui HTTPS dan akses panel admin dibatasi. Namun, tidak ada sistem yang sepenuhnya bebas risiko, dan kami tidak dapat menjamin keamanan mutlak.",
      ],
    },
    {
      heading: "8. Anak di bawah umur",
      body: [
        "Karena banyak pemain Minecraft berusia muda, pengguna di bawah 18 tahun sebaiknya didampingi orang tua atau wali saat bertransaksi.",
      ],
    },
    {
      heading: "9. Perubahan kebijakan",
      body: ["Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini."],
    },
    { heading: "10. Kontak", body: [contactLine()] },
  ],
};

export const REFUND = {
  title: "Kebijakan Refund",
  path: "/refund",
  description: `Ketentuan pengembalian dana untuk pembelian di toko ${SITE_NAME}.`,
  intro: `Karena yang dijual adalah barang digital yang langsung dikirim ke akun Minecraft kamu, pembelian yang sudah berhasil dikirim pada dasarnya tidak dapat dikembalikan. Pengecualiannya diatur di bawah ini.`,
  sections: [
    {
      heading: "1. Refund dapat diajukan jika",
      body: [
        {
          list: [
            `Pembayaran sudah berhasil tetapi item tidak terkirim dan tim kami tidak dapat menyelesaikannya dalam ${REFUND_WINDOW_DAYS} hari sejak pembayaran.`,
            "Terjadi pembayaran ganda untuk pesanan yang sama.",
            "Pembayaran berhasil tetapi pesanan berstatus kedaluwarsa atau gagal di sistem kami.",
          ],
        },
      ],
    },
    {
      heading: "2. Refund tidak dapat diajukan jika",
      body: [
        {
          list: [
            "Item sudah berhasil terkirim ke username yang diisi saat checkout.",
            "Salah menuliskan username Minecraft atau email saat checkout.",
            "Berubah pikiran setelah pembelian, atau tidak sengaja membeli.",
            "Akun dikenai sanksi atau pemblokiran karena pelanggaran aturan server.",
            "Penyesuaian keseimbangan permainan, perubahan fitur, atau reset server yang berdampak pada item.",
            "Pesanan atau kupon yang terindikasi disalahgunakan.",
          ],
        },
      ],
    },
    {
      heading: "3. Cara mengajukan refund",
      body: [
        `Hubungi kami dalam ${REFUND_WINDOW_DAYS} hari sejak pembayaran dengan menyertakan:`,
        {
          list: [
            "Nomor referensi pesanan (diawali SNT-, terlihat di halaman status pesanan).",
            "Username Minecraft dan email yang dipakai saat checkout.",
            "Bukti pembayaran dan penjelasan singkat masalahnya.",
          ],
        },
        contactLine(),
      ],
    },
    {
      heading: "4. Proses refund",
      body: [
        "Kami akan memeriksa pesanan terlebih dahulu. Refund yang disetujui dikembalikan melalui mekanisme yang tersedia dari penyedia pembayaran, dan lama prosesnya bergantung pada penyedia tersebut. Biaya layanan dari penyedia pembayaran, jika ada, dapat tidak ikut dikembalikan.",
        "Pesanan yang direfund akan ditandai di sistem, dan item terkait dapat dicabut dari akun.",
      ],
    },
    {
      heading: "5. Perubahan kebijakan",
      body: ["Kebijakan ini dapat diperbarui sewaktu-waktu. Versi yang berlaku adalah yang tertera di halaman ini."],
    },
  ],
};
