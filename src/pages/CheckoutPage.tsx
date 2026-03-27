import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  MapPin, CreditCard, ClipboardCheck, ChevronRight, ChevronLeft,
  Truck, Tag, Check, Loader2, ShoppingBag, ArrowLeft, Copy
} from 'lucide-react';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code?: string;
  label?: string;
  is_default: boolean;
}

interface DiscountResult {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  discount_amount: number;
}

const STEPS = [
  { id: 1, label: 'Delivery', icon: MapPin },
  { id: 2, label: 'Payment', icon: CreditCard },
  { id: 3, label: 'Review', icon: ClipboardCheck },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);

  // Delivery
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNew, setUseNew] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');
  const [notes, setNotes] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'jazzcash' | 'easypaisa' | 'whatsapp_order'>('cod');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

  // Discount
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Fees
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [freeAbove, setFreeAbove] = useState(1500);

  // Store settings
  const [storeWhatsApp, setStoreWhatsApp] = useState<string | null>(null);
  const [storeJazzcashNumber, setStoreJazzcashNumber] = useState<string | null>(null);
  const [storeEasypaisaNumber, setStoreEasypaisaNumber] = useState<string | null>(null);

  // Load store settings + saved addresses
  useEffect(() => {
    supabase.from('store_settings').select('standard_delivery_fee, free_delivery_above, whatsapp_number, jazzcash_number, easypaisa_number').single()
      .then(({ data }) => {
        if (data) {
          setDeliveryFee(data.standard_delivery_fee);
          setFreeAbove(data.free_delivery_above);
          setStoreWhatsApp(data.whatsapp_number);
          setStoreJazzcashNumber(data.jazzcash_number);
          setStoreEasypaisaNumber(data.easypaisa_number);
        }
      });

    if (user) {
      supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            const def = data.find((a) => a.is_default) || data[0];
            setSelectedAddressId(def.id);
          } else {
            setUseNew(true);
          }
        });
    } else {
      setUseNew(true);
    }
  }, [user]);

  // Build WhatsApp order notification message
  const buildWhatsAppMessage = (orderNumber: string, deliveryInfo: ReturnType<typeof getDeliveryInfo>, orderTotal: number) => {
    const itemsList = items.map((item) => {
      const price = item.product.price + (item.variant?.price_delta || 0);
      return `• ${item.product.name}${item.variant ? ` (${item.variant.name})` : ''} × ${item.quantity} = Rs. ${(price * item.quantity).toLocaleString()}`;
    }).join('\n');

    return `🛍️ *NEW ORDER - ${orderNumber}*

📦 *Items:*
${itemsList}

💰 *Order Summary:*
Subtotal: Rs. ${subtotal.toLocaleString()}
Delivery: ${actualDeliveryFee === 0 ? 'FREE' : `Rs. ${actualDeliveryFee}`}
${discountAmount > 0 ? `Discount: -Rs. ${discountAmount.toLocaleString()}\n` : ''}*Total: Rs. ${orderTotal.toLocaleString()}*

📍 *Delivery Address:*
${deliveryInfo.name}
${deliveryInfo.address}, ${deliveryInfo.city}${deliveryInfo.postal ? ` - ${deliveryInfo.postal}` : ''}
📞 ${deliveryInfo.phone}
${notes ? `📝 Notes: ${notes}` : ''}

💳 *Payment:* ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'jazzcash' ? 'JazzCash' : paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'To be confirmed via WhatsApp'}

Thank you! 🙏`;
  };

  const sendWhatsAppNotification = (orderNumber: string, deliveryInfo: ReturnType<typeof getDeliveryInfo>, orderTotal: number) => {
    if (!storeWhatsApp) return;
    const phone = storeWhatsApp.replace(/[^0-9]/g, '');
    const message = buildWhatsAppMessage(orderNumber, deliveryInfo, orderTotal);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-20 font-body">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Nothing to checkout</h1>
        <p className="mt-2 text-muted-foreground">Add items to your cart first.</p>
        <Button asChild className="mt-6 rounded-full px-8">
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const actualDeliveryFee = subtotal >= freeAbove ? 0 : deliveryFee;
  const discountAmount = discount?.discount_amount ?? 0;
  const total = subtotal + actualDeliveryFee - discountAmount;

  const getDeliveryInfo = () => {
    if (!useNew && selectedAddressId) {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (addr) return { name: addr.full_name, phone: addr.phone, address: addr.address_line, city: addr.city, postal: addr.postal_code || '' };
    }
    return { name, phone, address: addressLine, city, postal };
  };

  const validateDelivery = () => {
    const d = getDeliveryInfo();
    if (!d.name.trim() || !d.phone.trim() || !d.address.trim() || !d.city.trim()) {
      toast.error('Please fill in all required delivery fields');
      return false;
    }
    if (!user && !guestEmail.trim()) {
      toast.error('Please enter your email address');
      return false;
    }
    return true;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    const { data, error } = await supabase.rpc('validate_discount', { p_code: promoCode, p_order_total: subtotal });
    setApplyingPromo(false);
    if (error || !data || data.length === 0) {
      toast.error('Invalid or expired promo code');
      setDiscount(null);
      return;
    }
    setDiscount(data[0] as DiscountResult);
    toast.success(`Discount applied! -Rs. ${data[0].discount_amount.toLocaleString()}`);
  };

  const handleRemovePromo = () => {
    setDiscount(null);
    setPromoCode('');
  };

  const handlePlaceOrder = async () => {
    const d = getDeliveryInfo();
    setPlacing(true);

    const orderNumber = 'VJ-' + Date.now().toString().slice(-6);

    const { data: order, error } = await supabase.from('orders').insert({
      order_number: orderNumber,
      user_id: user?.id || null,
      delivery_name: d.name,
      delivery_phone: d.phone,
      delivery_address: d.address,
      delivery_city: d.city,
      delivery_postal: d.postal,
      delivery_notes: notes || null,
      delivery_email: user?.email || guestEmail || null,
      payment_method: (paymentMethod === 'whatsapp_order' ? 'whatsapp' : paymentMethod) as any,
      payment_ref: paymentRef.trim() || null,
      subtotal,
      delivery_fee: actualDeliveryFee,
      discount_amount: discountAmount,
      discount_code_id: discount?.id || null,
      total,
      status: 'pending',
      payment_status: 'pending',
    }).select('id, order_number').single();

    if (error || !order) {
      toast.error('Failed to place order. Please try again.');
      setPlacing(false);
      return;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      variant_id: item.variant?.id || null,
      variant_name: item.variant?.name || null,
      unit_price: item.product.price + (item.variant?.price_delta || 0),
      quantity: item.quantity,
      line_total: (item.product.price + (item.variant?.price_delta || 0)) * item.quantity,
      image_url: item.product.images.find((img) => img.is_main)?.url || item.product.images[0]?.url || null,
    }));

    await supabase.from('order_items').insert(orderItems);

    // Upload payment screenshot if provided
    if (paymentScreenshot && (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa')) {
      try {
        const ext = paymentScreenshot.name.split('.').pop();
        const path = `payment-proofs/${order.order_number}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(path, paymentScreenshot, { cacheControl: '3600', upsert: true });
        if (!uploadErr) {
          const screenshotUrl = `https://ftgaoadnxrodfgtsftoq.supabase.co/storage/v1/object/public/product-images/${path}`;
          await supabase.from('orders').update({
            payment_ref: `${paymentRef.trim()} | screenshot: ${screenshotUrl}`
          }).eq('id', order.id);
        }
      } catch (_) {
        // Screenshot upload failure is non-critical, don't block order
      }
    }

    // Send WhatsApp notification / open WhatsApp for order
    if (paymentMethod === 'whatsapp_order' && storeWhatsApp) {
      // For WhatsApp orders: open WhatsApp directly so customer sends the message themselves
      let digits = storeWhatsApp.replace(/[^0-9]/g, '');
      if (digits.startsWith('0')) digits = '92' + digits.slice(1);
      const msg = buildWhatsAppMessage(order.order_number, d, total);
      window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      sendWhatsAppNotification(order.order_number, d, total);
    }

    clearCart();
    setPlacing(false);
    toast.success('Order placed successfully! 🎉');
    navigate(`/order-confirmation?order=${order.order_number}`);
  };

  const validatePayment = () => {
    if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && !paymentRef.trim()) {
      toast.error('Please enter your payment transaction ID');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateDelivery()) return;
    if (step === 2 && !validatePayment()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="pt-20">
      <div className="container max-w-4xl py-10 font-body">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="mb-6 text-muted-foreground">
          <Link to="/cart"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart</Link>
        </Button>

        <h1 className="mb-8 font-display text-3xl font-bold">Checkout</h1>

        {/* Step Indicator */}
        <div className="mb-10 flex items-center justify-center">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                step === s.id ? 'bg-primary text-primary-foreground' :
                step > s.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 h-px w-8 sm:w-16 ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Step 1: Delivery */}
            {step === 1 && (
              <div className="space-y-6 rounded-xl bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <MapPin className="h-5 w-5 text-primary" /> Delivery Address
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <RadioGroup value={useNew ? '__new__' : (selectedAddressId || '')} onValueChange={(v) => {
                      if (v === '__new__') { setUseNew(true); } else { setUseNew(false); setSelectedAddressId(v); }
                    }}>
                      {savedAddresses.map((addr) => (
                        <label key={addr.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                          !useNew && selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}>
                          <RadioGroupItem value={addr.id} className="mt-1" />
                          <div>
                            <p className="text-sm font-medium">{addr.full_name} {addr.label && <span className="ml-1 text-xs text-muted-foreground">({addr.label})</span>}</p>
                            <p className="text-sm text-muted-foreground">{addr.address_line}, {addr.city}</p>
                            <p className="text-xs text-muted-foreground">{addr.phone}</p>
                          </div>
                        </label>
                      ))}
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-4 transition-colors ${
                        useNew ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}>
                        <RadioGroupItem value="__new__" />
                        <span className="text-sm font-medium">+ Add new address</span>
                      </label>
                    </RadioGroup>
                  </div>
                )}

                {useNew && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Full Name *</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Muhammad Ali" />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX XXXXXXX" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Address *</Label>
                      <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="House #, Street, Area" />
                    </div>
                    <div>
                      <Label>City *</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lahore" />
                    </div>
                    <div>
                      <Label>Postal Code</Label>
                      <Input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="54000" />
                    </div>
                    {!user && (
                      <div className="sm:col-span-2">
                        <Label>Email *</Label>
                        <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="your@email.com" />
                        <p className="mt-1 text-xs text-muted-foreground">For order confirmation & updates</p>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <Label>Delivery Notes (optional)</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ring the bell, leave at door, etc." rows={2} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="space-y-6 rounded-xl bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <CreditCard className="h-5 w-5 text-primary" /> Payment Method
                </h2>

                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  {[
                    { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order', emoji: '💵' },
                    { value: 'jazzcash', label: 'JazzCash', desc: 'Pay via JazzCash mobile wallet', emoji: '📱' },
                    { value: 'easypaisa', label: 'EasyPaisa', desc: 'Pay via EasyPaisa mobile wallet', emoji: '📱' },
                    { value: 'whatsapp_order', label: 'Order via WhatsApp', desc: 'Send your order details directly on WhatsApp', emoji: '💬' },
                  ].map((m) => (
                    <label key={m.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      paymentMethod === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}>
                      <RadioGroupItem value={m.value} className="mt-1" />
                      <div>
                        <p className="text-sm font-medium">{m.emoji} {m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                {/* Mobile Wallet Payment Instructions */}
                {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                    <p className="text-sm font-semibold text-foreground">
                      📲 How to complete your payment
                    </p>

                    {/* Step-by-step instructions */}
                    <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
                      {[
                        `Open your ${paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} app`,
                        `Send Rs. ${total.toLocaleString()} to the number below`,
                        'Copy the transaction ID from your confirmation SMS',
                        'Paste it below and place your order',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary mt-0.5">{i + 1}</span>
                          <span dangerouslySetInnerHTML={{ __html: step.replace(/Rs\. [\d,]+/, `<strong class="text-foreground">Rs. ${total.toLocaleString()}</strong>`) }} />
                        </li>
                      ))}
                    </ol>

                    {/* Account number — copyable */}
                    <div className="rounded-md bg-background p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        {paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Account Number
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const num = paymentMethod === 'jazzcash' ? storeJazzcashNumber : storeEasypaisaNumber;
                          if (num) { navigator.clipboard.writeText(num); toast.success('Number copied!'); }
                        }}
                        className="flex items-center gap-2 text-lg font-bold tracking-wider text-foreground font-mono hover:text-primary transition-colors group"
                      >
                        {paymentMethod === 'jazzcash'
                          ? (storeJazzcashNumber || 'Not configured')
                          : (storeEasypaisaNumber || 'Not configured')}
                        <Copy className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Account Title: <span className="font-medium text-foreground">Veloura Jewels</span>
                      </p>
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <Label className="text-sm">Transaction ID / Reference Number *</Label>
                      <Input
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="mt-1 font-mono text-sm"
                        maxLength={50}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        You'll find this in your {paymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} payment confirmation SMS
                      </p>
                    </div>

                    {/* Screenshot upload */}
                    <div>
                      <Label className="text-sm">Payment Screenshot <span className="text-muted-foreground font-normal">(optional but recommended)</span></Label>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                      />
                      {paymentScreenshot && (
                        <p className="mt-1 text-xs text-primary">✓ {paymentScreenshot.name} selected</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">Upload a screenshot of your payment confirmation for faster verification</p>
                    </div>
                  </div>
                )}

                {/* WhatsApp Order Instructions */}
                {paymentMethod === 'whatsapp_order' && storeWhatsApp && (
                  <div className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      How WhatsApp ordering works
                    </p>
                    <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
                      {[
                        'Place your order — we\'ll save your details',
                        'A WhatsApp message with your order summary opens automatically',
                        'Send it to us and we\'ll confirm your order',
                        'Agree on payment method directly with us on WhatsApp',
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-[10px] font-bold text-[#25D366] mt-0.5">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <p className="text-xs text-muted-foreground">
                      We'll reply within a few hours to confirm your order 🙂
                    </p>
                  </div>
                )}

                {/* Discount Code */}
                <div className="border-t pt-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Tag className="h-4 w-4 text-primary" /> Discount Code
                  </h3>
                  {discount ? (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div>
                        <span className="text-sm font-medium text-primary">{discount.code}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          (-Rs. {discount.discount_amount.toLocaleString()})
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemovePromo} className="text-xs text-destructive">
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code" className="text-sm" onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()} />
                      <Button onClick={handleApplyPromo} disabled={applyingPromo} variant="outline" size="sm" className="shrink-0">
                        {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 rounded-xl bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                  <ClipboardCheck className="h-5 w-5 text-primary" /> Order Review
                </h2>

                {/* Delivery summary */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deliver to</p>
                  {(() => {
                    const d = getDeliveryInfo();
                    return (
                      <>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-sm text-muted-foreground">{d.address}, {d.city} {d.postal && `— ${d.postal}`}</p>
                        <p className="text-sm text-muted-foreground">{d.phone}</p>
                      </>
                    );
                  })()}
                </div>

                {/* Payment summary */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
                  <p className="text-sm font-medium">
                    {paymentMethod === 'cod' && '💵 Cash on Delivery'}
                    {paymentMethod === 'jazzcash' && '📱 JazzCash'}
                    {paymentMethod === 'easypaisa' && '📱 EasyPaisa'}
                    {paymentMethod === 'whatsapp_order' && '💬 Order via WhatsApp'}
                  </p>
                  {paymentRef && (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ref: <span className="font-mono font-medium text-foreground">{paymentRef}</span>
                    </p>
                  )}
                </div>

                {/* Items */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({items.length})</p>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const img = item.product.images.find((i) => i.is_main) || item.product.images[0];
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                            <img src={img?.url} alt={item.product.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold">Rs. {(item.product.price * item.quantity).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* WhatsApp Message Preview */}
                {storeWhatsApp && (
                  <div className="rounded-lg border border-green-500/20 bg-green-50/50 dark:bg-green-950/20 p-4">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.352 0-4.556-.764-6.343-2.063a.5.5 0 00-.404-.082l-3.148 1.055 1.055-3.148a.5.5 0 00-.082-.404A9.946 9.946 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                      WhatsApp Notification Preview
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      This message will be sent to the store via WhatsApp after you place your order:
                    </p>
                    <pre className="whitespace-pre-wrap rounded-md bg-background/80 p-3 text-xs leading-relaxed text-foreground/80 font-mono border border-border/50 max-h-48 overflow-y-auto">
                      {(() => {
                        const d = getDeliveryInfo();
                        const itemsList = items.map((item) => {
                          const price = item.product.price + (item.variant?.price_delta || 0);
                          return `• ${item.product.name}${item.variant ? ` (${item.variant.name})` : ''} × ${item.quantity} = Rs. ${(price * item.quantity).toLocaleString()}`;
                        }).join('\n');
                        return `🛍️ NEW ORDER - VJ-XXXXXX

📦 Items:
${itemsList}

💰 Order Summary:
Subtotal: Rs. ${subtotal.toLocaleString()}
Delivery: ${actualDeliveryFee === 0 ? 'FREE' : `Rs. ${actualDeliveryFee}`}
${discountAmount > 0 ? `Discount: -Rs. ${discountAmount.toLocaleString()}\n` : ''}Total: Rs. ${total.toLocaleString()}

📍 Delivery Address:
${d.name}
${d.address}, ${d.city}${d.postal ? ` - ${d.postal}` : ''}
📞 ${d.phone}
${notes ? `📝 Notes: ${notes}` : ''}
💳 Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'jazzcash' ? 'JazzCash' : paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'To be confirmed via WhatsApp'}

Thank you! 🙏`;
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex justify-between">
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button onClick={nextStep}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handlePlaceOrder} disabled={placing} className="min-w-[160px]">
                  {placing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Place Order
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-xl bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-display text-lg font-semibold">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> Delivery
                  </span>
                  <span>{actualDeliveryFee === 0 ? <span className="font-medium text-primary">Free</span> : `Rs. ${actualDeliveryFee}`}</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-primary">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> Discount
                    </span>
                    <span>-Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="text-primary">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {subtotal < freeAbove && (
                <p className="mt-4 rounded-lg bg-primary/5 p-3 text-center text-xs text-muted-foreground">
                  Add Rs. {(freeAbove - subtotal).toLocaleString()} more for <span className="font-medium text-primary">free delivery!</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
