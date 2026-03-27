import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { STORE_SETTINGS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const whatsappUrl = `https://wa.me/${STORE_SETTINGS.whatsapp_number.replace(/[^0-9]/g, '')}`;

  return (
    <div className="pt-20">
      <div className="bg-cream-dark py-16">
        <div className="container text-center">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Get in Touch</h1>
          <p className="mt-2 font-body text-muted-foreground">We'd love to hear from you</p>
        </div>
      </div>

      <div className="container max-w-4xl py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="font-display text-xl font-semibold">Contact Information</h2>
            <div className="space-y-4 font-body text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>{STORE_SETTINGS.whatsapp_number}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>hello@velourajewels.pk</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Lahore, Pakistan</span>
              </div>
            </div>
            <Button asChild className="rounded-full bg-whatsapp font-body text-primary-foreground hover:bg-whatsapp/90">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
          </motion.div>

          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="Your Name" className="font-body" />
            <Input type="email" placeholder="Email Address" className="font-body" />
            <Textarea placeholder="Your Message" rows={5} className="font-body" />
            <Button type="submit" className="w-full rounded-full font-body">Send Message</Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
