import { Link } from "react-router-dom";
import PixelButton from "../components/ui/PixelButton";
import { useSeo } from "../hooks/useSeo";

export default function NotFound() {
  useSeo({ title: "Halaman tidak ditemukan", path: "/404", noindex: true });
  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <h1 className="title gold-gradient-text">404</h1>
      <p className="p mt-2">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
      <Link to="/" className="mt-6 inline-block">
        <PixelButton tone="primary" className="px-6! py-5!">Kembali ke Beranda</PixelButton>
      </Link>
    </section>
  );
}
