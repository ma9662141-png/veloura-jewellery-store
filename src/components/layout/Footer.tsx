import { Link } from 'react-router-dom';
import { VelouraLogo } from '@/components/shared/VelouraLogo';
import { Instagram } from 'lucide-react';
import { STORE_SETTINGS, CATEGORIES } from '@/data/mock';

export function Footer() {
  const whatsappUrl = `https://wa.me/${STORE_SETTINGS.whatsapp_number.replace(/[^0-9]/g, '')}`;
  const instagramUrl = 'https://www.instagram.com/velourajewels.co_/';

  return (
    <footer className="bg-charcoal text-primary-foreground">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <VelouraLogo size="md" theme="dark" />
            <p className="font-body text-sm text-primary-foreground/60">
              {STORE_SETTINGS.store_tagline}
            </p>
            <div className="flex gap-3">
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 font-body text-sm text-primary-foreground/60">
              {[{ l: 'Shop All', h: '/shop' }, { l: 'About Us', h: '/about' }, { l: 'Contact', h: '/contact' }, { l: 'Track Order', h: '/track' }].map(({ l, h }) => (
                <li key={h}><Link to={h} className="transition-colors hover:text-primary">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2 font-body text-sm text-primary-foreground/60">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.slug}>
                  <Link to={`/shop?category=${cat.slug}`} className="transition-colors hover:text-primary">
                    {cat.emoji} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Help</h4>
            <ul className="space-y-2 font-body text-sm text-primary-foreground/60">
              <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">WhatsApp Support</a></li>
              <li><Link to="/track" className="transition-colors hover:text-primary">Track Order</Link></li>
              <li className="text-primary-foreground/40 pt-2 text-xs">
                {STORE_SETTINGS.whatsapp_number}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/10 pt-6 text-center font-body text-xs text-primary-foreground/40">
          © {new Date().getFullYear()} Veloura Jewels · Made in Pakistan 🇵🇰
        </div>
      </div>
    </footer>
  );
}
