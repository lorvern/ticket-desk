import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, Minus, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatGHS, computeHandlingFee } from "@/lib/format";
import { createOrder, verifyPayment, validateCoupon } from "@/lib/tickets.functions";

type Cat = {
  id: string;
  name: string;
  description: string | null;
  price_pesewas: number;
  quantity: number;
  sold_count: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string };
  categories: Cat[];
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency: string;
        callback: (resp: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export function CheckoutModal({ open, onOpenChange, event, categories }: Props) {
  const navigate = useNavigate();
  const createOrderFn = useServerFn(createOrder);
  const verifyFn = useServerFn(verifyPayment);
  const validateFn = useServerFn(validateCoupon);

  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState<{ discountPesewas: number; code: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedId(null);
      setQty(1);
      setBuyer({ name: "", email: "", phone: "" });
      setCoupon("");
      setCouponInfo(null);
    }
  }, [open]);

  const selected = useMemo(() => categories.find((c) => c.id === selectedId) || null, [categories, selectedId]);
  const remaining = selected ? selected.quantity - selected.sold_count : 0;
  const subtotal = selected ? selected.price_pesewas * qty : 0;
  const discount = couponInfo?.discountPesewas ?? 0;
  const fee = computeHandlingFee(Math.max(0, subtotal - discount));
  const total = Math.max(0, subtotal - discount + fee);

  async function applyCoupon() {
    if (!coupon.trim() || !selected) return;
    setLoading(true);
    try {
      const r = await validateFn({
        data: { code: coupon.trim().toUpperCase(), eventId: event.id, subtotalPesewas: subtotal },
      });
      if (r.ok) {
        setCouponInfo({ discountPesewas: r.discountPesewas, code: r.code });
        toast.success(`Coupon applied: -${formatGHS(r.discountPesewas)}`);
      } else {
        setCouponInfo(null);
        toast.error(r.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!selected) return;
    setLoading(true);
    try {
      const init = await createOrderFn({
        data: {
          eventId: event.id,
          items: [{ ticketCategoryId: selected.id, quantity: qty }],
          buyer,
          couponCode: couponInfo?.code ?? null,
        },
      });

      if (init.mode === "paystack" && init.publicKey && window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: init.publicKey,
          email: buyer.email,
          amount: init.totalPesewas,
          ref: init.reference,
          currency: "GHS",
          callback: (resp) => {
            void (async () => {
              const v = await verifyFn({ data: { reference: resp.reference } });
              if (v.ok) {
                toast.success("Payment confirmed!");
                onOpenChange(false);
                navigate({ to: "/ticket/$id", params: { id: v.ticketIds[0] } });
              } else {
                toast.error(v.error || "Verification failed");
              }
            })();
          },
          onClose: () => setLoading(false),
        });
        handler.openIframe();
        return;
      }

      // Demo mode (no Paystack keys configured yet)
      toast.message("Demo checkout — Paystack keys not configured", {
        description: "Proceeding with simulated payment.",
      });
      const v = await verifyFn({ data: { reference: init.reference } });
      if (v.ok) {
        toast.success("Tickets issued!");
        onOpenChange(false);
        navigate({ to: "/ticket/$id", params: { id: v.ticketIds[0] } });
      } else {
        toast.error(v.error || "Could not complete checkout");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const canNext =
    (step === 1 && !!selected && remaining > 0) ||
    (step === 2 && qty >= 1 && qty <= remaining) ||
    step === 3 ||
    (step === 4 &&
      buyer.name.trim().length >= 2 &&
      /.+@.+\..+/.test(buyer.email) &&
      buyer.phone.trim().length >= 7);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Checkout — {event.name}</DialogTitle>
        <div className="ink-panel px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">{`Step ${step} of 5`}</p>
              <h2 className="mt-1 font-display text-xl text-ink-foreground">{event.name}</h2>
            </div>
          </div>
          <div className="mt-4 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-gold" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto bg-card px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <div className="space-y-3">
                  <h3 className="font-display text-lg">Choose a ticket</h3>
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tickets available.</p>
                  )}
                  {categories.map((c) => {
                    const left = c.quantity - c.sold_count;
                    const soldOut = left <= 0;
                    const active = selectedId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setSelectedId(c.id)}
                        className={`flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
                          active
                            ? "border-gold bg-gold/5 shadow-gold"
                            : "border-border hover:border-gold/50"
                        } ${soldOut ? "opacity-50" : ""}`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{c.name}</p>
                          {c.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">{c.description}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {soldOut ? "Sold out" : `${left} left`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg">{formatGHS(c.price_pesewas)}</p>
                          {active && <Check className="ml-auto mt-1 h-4 w-4 text-gold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && selected && (
                <div className="space-y-6">
                  <h3 className="font-display text-lg">How many?</h3>
                  <div className="rounded-xl border border-border p-4">
                    <p className="font-semibold">{selected.name}</p>
                    <p className="text-sm text-muted-foreground">{formatGHS(selected.price_pesewas)} each</p>
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-center font-display text-4xl">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                      disabled={qty >= remaining}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Subtotal: <span className="font-semibold text-foreground">{formatGHS(subtotal)}</span>
                  </p>
                </div>
              )}

              {step === 3 && selected && (
                <div className="space-y-5">
                  <h3 className="font-display text-lg">Order summary</h3>
                  <div className="ticket-stub space-y-3 p-5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {selected.name} × {qty}
                      </span>
                      <span>{formatGHS(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount ({couponInfo?.code})</span>
                        <span>-{formatGHS(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Handling fee</span>
                      <span>{formatGHS(fee)}</span>
                    </div>
                    <div className="border-t border-border pt-3" />
                    <div className="flex items-end justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-2xl">{formatGHS(total)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coupon">Coupon code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                      />
                      <Button variant="outline" onClick={applyCoupon} disabled={loading || !coupon.trim()}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg">Your details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={buyer.name}
                      onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                      placeholder="Ama Mensah"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={buyer.email}
                      onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={buyer.phone}
                      onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                      placeholder="024 000 0000"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send your QR ticket to this email. No account needed.
                  </p>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4 text-center">
                  <h3 className="font-display text-2xl">Pay {formatGHS(total)}</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to Paystack to complete your payment securely with
                    Mobile Money, card or bank transfer.
                  </p>
                  <Button
                    variant="gold"
                    size="xl"
                    className="w-full"
                    onClick={handlePay}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${formatGHS(total)}`}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Secured by Paystack · MoMo, Visa, Mastercard, Bank
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 5 && (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button
              variant="ink"
              size="lg"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
            >
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
