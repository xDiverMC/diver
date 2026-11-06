// src/pages/legal/LegalPage.jsx — tata letak umum halaman legal (teks panjang memakai font yang mudah dibaca).
import { Link } from "react-router-dom";
import { useSeo } from "../../hooks/useSeo";
import { LEGAL_UPDATED } from "../../config/site";

const URL_RE = /(https?:\/\/[^\s)]+)/g;

// Ubah URL polos di dalam teks menjadi link yang bisa diklik.
function Linkified({ text }) {
  return text.split(URL_RE).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="underline text-(--color-primary)">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const OTHER_PAGES = [
  { to: "/terms", label: "Syarat & Ketentuan" },
  { to: "/privacy", label: "Kebijakan Privasi" },
  { to: "/refund", label: "Kebijakan Refund" },
];

export default function LegalPage({ doc }) {
  useSeo({ title: doc.title, path: doc.path, description: doc.description });

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="title gold-gradient-text">{doc.title}</h1>
      <p className="mt-2 text-[11px] text-(--color-text-dim)">Terakhir diperbarui: {LEGAL_UPDATED}</p>

      <div className="mt-6 font-sans text-[14px] leading-7 text-(--color-text-muted)">
        <p>{doc.intro}</p>

        {doc.sections.map((s) => (
          <div key={s.heading} className="mt-8">
            <h2 className="mb-2 text-[15px] font-semibold text-(--color-text)">{s.heading}</h2>
            <div className="space-y-3">
              {s.body.map((b, i) =>
                typeof b === "string" ? (
                  <p key={i}>
                    <Linkified text={b} />
                  </p>
                ) : (
                  <ul key={i} className="list-disc space-y-1.5 pl-5">
                    {b.list.map((item) => (
                      <li key={item}>
                        <Linkified text={item} />
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-[12px]">
        {OTHER_PAGES.filter((p) => p.to !== doc.path).map((p) => (
          <Link key={p.to} to={p.to} className="underline text-(--color-primary)">
            {p.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
