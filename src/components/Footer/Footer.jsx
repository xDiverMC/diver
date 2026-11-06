import { Link } from "react-router-dom";
import { Code2, MessageCircle, PlayCircle, X as XIcon } from "lucide-react";
import { SITE_NAME, SOCIAL_LINKS } from "../../config/site";
import "./Footer.css";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "News", to: "/news" },
      { label: "Vote", to: "/votes" },
      { label: "Store", to: "/store" },
      { label: "Cek Pesanan", to: "/orders" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Staff", to: "/staff" },
      { label: "Syarat & Ketentuan", to: "/terms" },
      { label: "Kebijakan Privasi", to: "/privacy" },
      { label: "Kebijakan Refund", to: "/refund" },
    ],
  },
];

// Hanya sosial media yang URL-nya diisi di config/site.js yang ditampilkan.
const socials = [
  { icon: MessageCircle, label: "Discord", href: SOCIAL_LINKS.discord },
  { icon: XIcon, label: "X", href: SOCIAL_LINKS.x },
  { icon: PlayCircle, label: "YouTube", href: SOCIAL_LINKS.youtube },
  { icon: Code2, label: "GitHub", href: SOCIAL_LINKS.github },
].filter((s) => s.href);

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__logo">{SITE_NAME.toUpperCase()}</span>
          <p className="site-footer__tagline">A friendly Minecraft survival server for everyone.</p>
          {socials.length > 0 && (
            <div className="site-footer__socials">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="site-footer__social"
                >
                  <Icon size={16} strokeWidth={2} />
                </a>
              ))}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.heading} className="site-footer__col">
            <h3>{col.heading}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer__bottom">
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </span>
        <span className="site-footer__disclaimer">
          {SITE_NAME} is not an official Minecraft service and is not approved by or associated with Mojang or Microsoft.
        </span>
      </div>
    </footer>
  );
}
