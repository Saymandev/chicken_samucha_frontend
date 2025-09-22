export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  html: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'new-product',
    name: 'New Product Launch',
    subject: 'New arrivals just dropped! 🎉',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111827">
        <div style="background:#ef4444;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
          <h2 style="margin:0">🍗 Chicken Samucha</h2>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:22px;border-radius:0 0 10px 10px">
          <h3 style="margin:0 0 8px 0">Fresh on the menu</h3>
          <p style="margin:0 0 12px 0;line-height:1.6">We just launched exciting new items. Be the first to try them and enjoy special discounts today.</p>
          <a href="/products" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Shop Now</a>
        </div>
      </div>
    `
  },
  {
    id: 'limited-offer',
    name: 'Limited Time Offer',
    subject: 'Limited time: up to 25% OFF ⏰',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111827">
        <div style="background:#f59e0b;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
          <h2 style="margin:0">🔥 Limited Time Offer</h2>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:22px;border-radius:0 0 10px 10px">
          <p style="margin:0 0 12px 0;line-height:1.6">Save big on your favorites before the deal ends. Use code <b>SAVE25</b> at checkout.</p>
          <a href="/products" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">Grab the Deal</a>
        </div>
      </div>
    `
  },
  {
    id: 'seasonal',
    name: 'Seasonal Greetings',
    subject: 'Warm wishes and a special treat 🎁',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111827">
        <div style="background:#10b981;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
          <h2 style="margin:0">Seasonal Greetings</h2>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:22px;border-radius:0 0 10px 10px">
          <p style="margin:0 0 12px 0;line-height:1.6">Wishing you and your family a wonderful season. Enjoy a little treat on us!</p>
          <a href="/products" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">View Treat</a>
        </div>
      </div>
    `
  }
];

export default EMAIL_TEMPLATES;


