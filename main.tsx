/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  Clock, 
  Globe, 
  HelpCircle, 
  Layers, 
  MessageCircle, 
  Monitor, 
  Play, 
  Server, 
  Smartphone, 
  Star, 
  Video, 
  Zap, 
  ArrowRight,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PACKAGES = [
  { id: 'tk-no-rev', name: 'TikTok (Tanpa Revisi)', price: 'Rp 45.000', oldPrice: 'Rp 50.000', category: 'Promosi — Tanpa Revisi', badge: 'Populer' },
  { id: 'yt-no-rev', name: 'YouTube (Tanpa Revisi)', price: 'Rp 45.000', oldPrice: 'Rp 50.000', category: 'Promosi — Tanpa Revisi', badge: 'Best Reach' },
  { id: 'combo-no-rev', name: 'TikTok + YouTube (Tanpa Revisi)', price: 'Rp 80.000', oldPrice: 'Rp 90.000', category: 'Promosi — Tanpa Revisi', badge: 'Hemat' },
  { id: 'tk-2-rev', name: 'TikTok (2 Revisi)', price: 'Rp 55.000', oldPrice: 'Rp 65.000', category: 'Promosi — 2 Revisi', badge: 'Rekomendasi' },
  { id: 'yt-2-rev', name: 'YouTube (2 Revisi)', price: 'Rp 55.000', oldPrice: 'Rp 65.000', category: 'Promosi — 2 Revisi', badge: 'Rekomendasi' },
  { id: 'combo-2-rev', name: 'TikTok + YouTube (2 Revisi)', price: 'Rp 95.000', oldPrice: 'Rp 105.000', category: 'Promosi — 2 Revisi', badge: 'Best Value' },
  { id: 'owning', name: 'Owning Content', price: 'Rp 15.000', oldPrice: 'Rp 20.000', category: 'Konten & Tambahan', badge: 'Eksklusif' },
  { id: 'skip', name: 'Skip Antrian', price: 'Rp 15.000', oldPrice: 'Rp 20.000', category: 'Konten & Tambahan', badge: 'Prioritas' },
  { id: 'extra-rev', name: 'Revisi Ekstra', price: 'Rp 5.000', oldPrice: 'Rp 10.000', category: 'Konten & Tambahan', badge: 'Add-on', unit: '/revisi' },
  { id: 'mc-server', name: 'Setup Server Minecraft', price: 'Custom', category: 'Setup & Dev', badge: 'Custom' },
  { id: 'web-dev', name: 'Jasa Pembuatan Website', price: 'Custom', category: 'Setup & Dev', badge: 'Custom' },
];

const PREVIEWS = [
  { id: 1, title: 'Gaming Montage', category: 'Video Editing', likes: '1.2k', views: '15k' },
  { id: 2, title: 'Brand Story', category: 'Promosi', likes: '850', views: '10k' },
  { id: 3, title: 'Shorts Content', category: 'TikTok/Reels', likes: '2.5k', views: '45k' },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsAppOrder = (pkg?: string) => {
    const pkgName = pkg || selectedPackage;
    const message = `Halo Diver Service, saya ingin memesan paket: ${pkgName || 'Custom'}`;
    window.open(`https://wa.me/628123731343?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-indigo-500/30">
      {/* Background Aura Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="#" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Diver<span className="text-indigo-400">Service</span></span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#beranda" className="text-sm font-medium hover:text-indigo-400 transition-colors">Beranda</a>
            <a href="#layanan" className="text-sm font-medium hover:text-indigo-400 transition-colors">Layanan</a>
            <a href="#preview" className="text-sm font-medium hover:text-indigo-400 transition-colors">Preview</a>
            <a href="#booking" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-all">Pesan Sekarang</a>
          </div>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Open for new projects • Joki & Creator Service
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold tracking-tight mb-8"
          >
            Diver <br /> 
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">elite boosting</span> <br />
            eksekusi kilat.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-neutral-400 text-base md:text-xl mb-12 leading-relaxed"
          >
            Bantu rank, konten, dan brand kamu melesat lewat pengerjaan terarah oleh tim profesional.
            Privasi aman, pengerjaan cepat, dan hasil yang memuaskan.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <a href="#layanan" className="w-full md:w-auto px-8 py-4 rounded-2xl bg-indigo-600 font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group">
              Lihat Layanan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#booking" className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all">
              Booking Slot
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-white/5 pt-12"
          >
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">1-2k • 60</div>
              <div className="text-xs md:text-sm text-neutral-500 uppercase tracking-widest">Kualitas Render</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">1–3 Hari</div>
              <div className="text-xs md:text-sm text-neutral-500 uppercase tracking-widest">Estimasi Rata-rata</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">4 Brand</div>
              <div className="text-xs md:text-sm text-neutral-500 uppercase tracking-widest">Telah Bekerja Sama</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MessageCircle, title: 'Request Fleksibel', desc: 'Detail brief, durasi, dan style menyesuaikan kebutuhan kamu.' },
              { icon: Zap, title: 'Desain Menarik', desc: 'Konsep visual fresh, transisi halus, dan ritme cut yang dinamis.' },
              { icon: Clock, title: 'Proses Cepat', desc: 'Antrian rapi dan komunikasi aktif. Selesai sesuai estimasi.' },
              { icon: HelpCircle, title: 'Layanan Ramah', desc: 'Konsultasi santai, revisi terbuka, dan respon yang sopan.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#111114] border border-white/5 hover:border-indigo-500/30 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4 block">Pricelist</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Layanan & <span className="text-indigo-400">Harga</span></h2>
            <p className="max-w-2xl mx-auto text-neutral-500">Pilih paket yang paling pas, atau diskusikan custom request langsung dengan Diver.</p>
          </div>

          {[
            'Promosi — Tanpa Revisi',
            'Promosi — 2 Revisi',
            'Konten & Tambahan',
            'Setup & Dev'
          ].map((category) => (
            <div key={category} className="mb-16">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-4">
                <span className="w-8 h-[1px] bg-indigo-500/30" />
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PACKAGES.filter(p => p.category === category).map((pkg) => (
                  <div key={pkg.id} className="p-6 rounded-3xl bg-[#111114] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">{pkg.badge}</span>
                        {pkg.oldPrice && <span className="text-xs text-neutral-600 line-through">{pkg.oldPrice}</span>}
                      </div>
                      <h4 className="text-lg font-bold mb-2">{pkg.name}</h4>
                      <p className="text-neutral-500 text-sm mb-6">Pengerjaan profesional dengan kualitas terbaik.</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold text-white">
                        {pkg.price}
                        {pkg.unit && <span className="text-xs text-neutral-500 ml-1">{pkg.unit}</span>}
                      </div>
                      <button 
                        onClick={() => handleWhatsAppOrder(pkg.name)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white text-white hover:text-black transition-all"
                      >
                        Beli
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-24 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <span className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4 block">Reservasi</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Booking <span className="text-indigo-400">Slot</span></h2>
              <p className="text-neutral-500 mb-12">Isi form di samping untuk memesan slot. Tim akan konfirmasi via WhatsApp. Pastikan brief sudah jelas.</p>
              
              <div className="space-y-6">
                {[
                  { icon: Check, text: 'Konfirmasi cepat via WhatsApp' },
                  { icon: Check, text: 'Pembayaran setelah deal' },
                  { icon: Check, text: 'Prioritas untuk pengerjaan tepat waktu' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <item.icon className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-neutral-400">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#111114] border border-white/10">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleWhatsAppOrder(); }}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Nama Lengkap</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Nama atau nickname" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Pilih Paket</label>
                  <select 
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="" disabled className="bg-[#111114]">Pilih paket layanan</option>
                    {PACKAGES.map(pkg => (
                      <option key={pkg.id} value={pkg.name} className="bg-[#111114]">{pkg.name} — {pkg.price}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Brief Singkat</label>
                  <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Style, durasi, referensi..." />
                </div>
                <button type="submit" className="w-full py-4 rounded-xl bg-indigo-600 font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Kirim via WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-left">
              <span className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-4 block">Showcase</span>
              <h2 className="text-3xl md:text-4xl font-bold">Preview <span className="text-indigo-400">Karya</span></h2>
            </div>
            <p className="max-w-xs text-neutral-500 text-sm">Lihat langsung contoh hasil pengerjaan terbaik dari Diver Service.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PREVIEWS.map((preview) => (
              <motion.div 
                key={preview.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[16/9] rounded-3xl bg-neutral-900 border border-white/5 overflow-hidden relative mb-6">
                  <img 
                    src={`https://images.unsplash.com/photo-${1500000000000 + preview.id}?auto=format&fit=crop&q=80&w=800`} 
                    alt={preview.title}
                    className="w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                      <Play className="w-6 h-6 text-white group-hover:text-black ml-1" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold mb-1">{preview.title}</h4>
                    <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{preview.category}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-indigo-400" /> {preview.likes}</span>
                    <span>{preview.views} views</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <a href="#" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">Diver<span className="text-indigo-400">Service</span></span>
              </a>
              <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">
                Spesialis joki game, promosi media sosial, dan creator service. 
                Eksekusi kilat, aman terpercaya, dan hasil berkualitas.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Navigasi</h4>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><a href="#beranda" className="hover:text-white transition-colors">Beranda</a></li>
                <li><a href="#layanan" className="hover:text-white transition-colors">Layanan</a></li>
                <li><a href="#preview" className="hover:text-white transition-colors">Preview</a></li>
                <li><a href="#booking" className="hover:text-white transition-colors">Booking</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest mb-6">Kontak</h4>
              <ul className="space-y-4 text-sm text-neutral-500">
                <li><a href="https://wa.me/628123731343" className="hover:text-white transition-colors">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li>Mataram, NTB</li>
                <li>18.00 – 21.00 WITA</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-600 border-t border-white/5 pt-8">
            <p>© 2026 Diver Service. All rights reserved.</p>
            <p>Designed by Diver.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
