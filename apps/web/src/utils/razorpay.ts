export interface PayOptions {
  billId?: string;
  appointmentId?: string;
  amount: number;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  paymentMethod?: 'CASH' | 'RAZORPAY_ONLINE';
  onSuccess: (receipt: any) => void;
  onError?: (err: any) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayCheckout = async () => {
  if (typeof window === 'undefined') throw new Error('Razorpay checkout is only available in a browser');
  if (window.Razorpay) return window.Razorpay;

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay Checkout')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'));
    document.body.appendChild(script);
  });

  if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable');
  return window.Razorpay;
};

export const processHospitalPayment = async (options: PayOptions) => {
  // 1. Direct Cash Payment at Counter
  if (options.paymentMethod === 'CASH') {
    options.onSuccess({
      paymentId: `CASH-${Date.now().toString().slice(-6)}`,
      mode: 'Cash at Counter',
      amount: options.amount,
    });
    return;
  }

  // 2. Online Razorpay Flow
  try {
    const res = await fetch('https://drbloomedi-backend.onrender.com/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billId: options.billId,
        amount: options.amount,
      }),
    });

    if (!res.ok) throw new Error('Unable to create Razorpay order');

    const orderData = await res.json();
    if (!orderData.keyId?.startsWith('rzp_test_')) throw new Error('Razorpay is not configured with a test key');

    const RazorpayCheckout = await loadRazorpayCheckout();
    const checkout = new RazorpayCheckout({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'DrBlooMedi Healthcare',
      description: 'Hospital payment',
      order_id: orderData.orderId,
      prefill: { name: options.patientName, contact: options.patientPhone, email: options.patientEmail },
      theme: { color: '#2563eb' },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const verifyRes = await fetch('https://drbloomedi-backend.onrender.com/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, billId: options.billId, appointmentId: options.appointmentId, amount: options.amount }),
          });
          if (!verifyRes.ok) throw new Error('Payment verification failed');
          const verifyData = await verifyRes.json();
          options.onSuccess({ paymentId: verifyData.paymentId, mode: 'Razorpay UPI / Online (Verified)', amount: options.amount });
        } catch (error) {
          options.onError?.(error);
        }
      },
      modal: { ondismiss: () => options.onError?.(new Error('Payment was cancelled')) },
    });

    checkout.open();
  } catch (err: any) {
    options.onError?.(err);
  }
};