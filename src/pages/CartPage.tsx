import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { STORE_SETTINGS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const deliveryFee = subtotal >= STORE_SETTINGS.free_delivery_above ? 0 : STORE_SETTINGS.standard_delivery_fee;
  const total = subtotal + deliveryFee;

  const whatsappPhone = STORE_SETTINGS.whatsapp_number.replace(/[^0-9]/g, '');
  const cartMsg = items.map((i) => `🛍️ ${i.product.name} x${i.quantity} — Rs. ${(i.product.price * i.quantity).toLocaleString()}`).join('\n');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hi Veloura Jewels! 👋\n\nI'd like to order:\n${cartMsg}\n\n💰 Total: Rs. ${total.toLocaleString()}\n\nMy details:\n📛 Name: \n📍 Address: \n📱 Phone: \n\nThank you! ✨`)}`;

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-20">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Your Cart is Empty</h1>
        <p className="mt-2 font-body text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Button asChild className="mt-6 rounded-full px-8 font-body">
          <Link to="/shop">Continue Shopping <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="container py-10">
        <h1 className="mb-8 font-display text-3xl font-bold">Shopping Cart</h1>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => {
                const img = item.product.images.find((i) => i.is_main) || item.product.images[0];
                return (
                  <div key={item.id} className="flex gap-4 rounded-xl bg-card p-4 shadow-sm">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                      <img src={img?.url} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link to={`/product/${item.product.slug}`} className="font-body text-sm font-medium hover:text-primary">
                          {item.product.name}
                        </Link>
                        <p className="mt-0.5 font-body text-xs text-muted-foreground">{item.product.category?.name}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-lg border">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1 font-body text-sm hover:bg-muted">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-body text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1 font-body text-sm hover:bg-muted">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-body text-sm font-semibold text-primary">
                          Rs. {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="self-start p-1 text-muted-foreground transition-colors hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-display text-lg font-semibold">Order Summary</h3>
              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{deliveryFee === 0 ? <span className="font-medium text-primary">Free</span> : `Rs. ${deliveryFee}`}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Input placeholder="Promo code" className="font-body text-sm" />
                  <Button variant="outline" size="sm" className="shrink-0 font-body text-xs">Apply</Button>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Button asChild size="lg" className="rounded-full font-body text-sm font-medium">
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button asChild size="lg" className="rounded-full bg-whatsapp font-body text-sm font-medium text-primary-foreground hover:bg-whatsapp/90">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Order via WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
