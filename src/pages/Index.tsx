import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Send, Truck, CreditCard, Sparkles, RotateCcw, Instagram } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { STORE_SETTINGS, REVIEWS } from '@/data/mock'; // REVIEWS used as fallback if no live reviews yet
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&h=1500&fit=crop';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const sectionFade = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function HomePage() {
  // Live best sellers: featured first, then newest, capped at 8
  const { data: bestSellers } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, alt_text, sort_order, is_main),
          category:categories(id, name, slug, emoji, sort_order, is_active)
        `)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  // Live reviews: visible, highest rated
  const { data: liveReviews } = useQuery({
    queryKey: ['homepage-reviews'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, city:id)')
        .eq('is_visible', true)
        .order('rating', { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubmit = async () => {
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setNewsletterLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setNewsletterLoading(false);
    setNewsletterEmail('');
    toast.success("You're subscribed! Check your email for your 10% discount code 🎉");
  };

  const { data: heroSettings } = useQuery({
    queryKey: ['hero-image'],
    queryFn: async () => {
      const { data } = await supabase.from('store_settings').select('hero_image_url').eq('id', 1).single();
      return data;
    },
  });
  const heroImage = heroSettings?.hero_image_url || FALLBACK_HERO;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, slug, emoji, image_url, is_active').eq('is_active', true).order('sort_order');
      return data ?? [];
    },
  });

  return (
    <div>
      <AnnouncementBar />

      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-16 md:min-h-screen">
        <div className="container grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial="hidden"
            animate="visible"
            className="flex flex-col justify-center space-y-6"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-block self-start rounded-full border border-primary bg-primary/5 px-4 py-1.5 font-body text-xs font-medium tracking-wide text-primary"
            >
              {STORE_SETTINGS.store_tagline}
            </motion.span>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
            >
              Jewellery That Tells{' '}
              <span className="text-primary text-glow-gold">Your Story</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="max-w-md font-body text-lg text-muted-foreground"
            >
              Minimal. Elegant. Affordable.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4 pt-2">
              <Button asChild size="lg" className="rounded-full px-8 py-3 font-body text-sm font-medium">
                <Link to="/shop">Shop Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full border-primary bg-cream px-8 py-3 font-body text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                <Link to="/collections">Explore Collections</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative hidden md:block"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-2xl">
              <div
                className="absolute inset-y-0 left-0 z-10 w-20"
                style={{
                  background: 'linear-gradient(to right, hsl(var(--background)), transparent)',
                }}
              />
              <img
                src={heroImage}
                alt="Veloura Jewels collection"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 z-20 rounded-xl bg-card p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <span className="font-body text-sm font-medium">500+ Happy Customers</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionFade}
        className="border-y border-primary/25 bg-cream-dark py-8 mt-8"
      >
        <div className="container grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Truck, text: 'Free Delivery Rs.1500+' },
            { icon: CreditCard, text: 'Cash on Delivery' },
            { icon: Sparkles, text: 'Premium Quality' },
            { icon: RotateCcw, text: 'Easy Returns 7 Days' },
          ].map(({ icon: Icon, text }, idx) => (
            <div
              key={text}
              className={`flex items-center justify-center gap-3 py-2 font-body text-sm text-foreground ${
                idx < 3 ? 'md:border-r md:border-primary/20' : ''
              }`}
            >
              <span className="flex items-center justify-center rounded-full bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <span className="font-medium">{text}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionFade}
        className="py-20"
      >
        <div className="container">
          <SectionHeading title="Shop by Category" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {(categories ?? []).map((cat, i) => (
              <motion.div
                key={cat.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <Link
                  to={`/shop?category=${cat.slug}`}
                  className="group relative block overflow-hidden rounded-2xl transition-all duration-300 hover:ring-2 hover:ring-primary hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-cream-dark" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                      <h3 className="font-body text-sm font-semibold text-primary-foreground drop-shadow-md">
                        {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                        {cat.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Best Sellers */}
      <section className="pb-20">
        <div className="container">
          <div className="mb-12 flex items-end justify-between">
            <SectionHeading title="Our Best Sellers" subtitle="Loved by our customers" className="mb-0 text-left" />
            <Link to="/shop" className="hidden font-body text-sm font-medium text-primary hover:underline md:block">
              View All <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {(bestSellers ?? []).length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ))
              : (bestSellers ?? []).map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </div>
      </section>

      {/* Instagram Follow CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionFade}
        className="bg-cream-darker py-20"
      >
        <div className="container">
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-primary/20 bg-primary/5 py-16 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-md">
              <Instagram className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold">Follow Us on Instagram</h2>
              <p className="mt-2 font-body text-muted-foreground max-w-md mx-auto">
                See our latest drops, styling inspiration & customer favourites — new arrivals every week ✨
              </p>
            </div>
            <a
              href="https://www.instagram.com/velourajewels.co_/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] px-8 py-3 font-body text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all hover:scale-105"
            >
              <Instagram className="h-4 w-4" />
              Follow {STORE_SETTINGS.instagram_handle}
            </a>
            <p className="font-body text-xs text-muted-foreground">✦ &nbsp; Join our community &nbsp; ✦ &nbsp; Tag us to be featured &nbsp; ✦</p>
          </div>
        </div>
      </motion.section>

      {/* Reviews */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionFade}
        className="py-20"
      >
        <div className="container">
          <SectionHeading title="What Our Customers Say" />
          <div className="grid gap-6 md:grid-cols-3">
            {(liveReviews && liveReviews.length > 0 ? liveReviews : REVIEWS).map((review: any) => (
              <motion.div
                key={review.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
                className="rounded-2xl bg-card p-6 shadow-sm"
              >
                <div className="mb-3 flex">
                  {Array.from({ length: review.rating }).map((_: any, i: number) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                {review.title && <h4 className="mb-2 font-display text-sm font-semibold">{review.title}</h4>}
                <p className="mb-4 font-body text-sm text-muted-foreground">{review.body}</p>
                <div className="font-body text-xs">
                  <span className="font-medium">
                    {review.profiles?.full_name ?? review.user?.full_name ?? 'Customer'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Newsletter */}
      <section className="bg-primary py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Get 10% Off Your First Order
          </h2>
          <p className="mt-3 font-body text-sm text-primary-foreground/80">
            Subscribe to our newsletter for exclusive deals and new arrivals.
          </p>
          <div className="mx-auto mt-8 flex max-w-md gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewsletterSubmit()}
              className="rounded-full border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground"
            />
            <Button variant="secondary" size="lg" className="shrink-0 rounded-full font-body" onClick={handleNewsletterSubmit} disabled={newsletterLoading}>
              <Send className="mr-2 h-4 w-4" /> {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
