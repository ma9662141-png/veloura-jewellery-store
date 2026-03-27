import { motion } from 'framer-motion';
import { VelouraLogo } from '@/components/shared/VelouraLogo';

export default function AboutPage() {
  return (
    <div className="pt-20">
      <div className="bg-cream-dark py-16">
        <div className="container text-center">
          <VelouraLogo size="lg" />
          <p className="mt-4 font-body text-lg text-muted-foreground">Luxury you can wear, grace you can feel.</p>
        </div>
      </div>
      <div className="container max-w-3xl py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 font-body text-base leading-relaxed text-muted-foreground">
          <h2 className="font-display text-2xl font-bold text-foreground">Our Story</h2>
          <p>
            Veloura Jewels was born from a simple belief: every woman deserves to feel like royalty without breaking the bank. 
            Based in Lahore, Pakistan, we curate and craft artificial jewellery that blends timeless elegance with modern trends.
          </p>
          <p>
            From delicate everyday rings to bold statement necklaces, each piece is designed to tell your unique story. 
            We believe jewellery isn't just an accessory — it's an expression of who you are.
          </p>
          <h2 className="font-display text-2xl font-bold text-foreground pt-4">What Sets Us Apart</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>Premium quality at accessible prices</li>
            <li>Handpicked designs inspired by global trends</li>
            <li>Anti-tarnish coating on all pieces</li>
            <li>Pakistan-wide delivery with Cash on Delivery</li>
            <li>7-day easy returns policy</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
