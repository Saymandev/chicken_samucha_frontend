export type EmailTemplateField = { key: string; label: string; placeholder?: string };

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  fields: EmailTemplateField[];
  defaults: Record<string, string>;
  render: (values: Record<string, string>) => string;
};

const baseWrapperStart = (headerBg: string, headerText: string) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111827">
    <div style="background:${headerBg};color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">
      <h2 style="margin:0">${headerText}</h2>
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:22px;border-radius:0 0 10px 10px">
`;
const baseWrapperEnd = `
    </div>
  </div>
`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'new-product',
    name: 'New Product Launch',
    subject: 'New arrivals just dropped! 🎉',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'ctaText', label: 'Button Text' },
      { key: 'ctaUrl', label: 'Button Link' }
    ],
    defaults: {
      brand: '🛒 Pickplace',
      title: 'Fresh on the menu',
      description: 'We just launched exciting new items. Be the first to try them and enjoy special discounts today.',
      ctaText: 'Shop Now',
      ctaUrl: '/products'
    },
    render: (v) =>
      `${baseWrapperStart('#ef4444', v.brand)}
        <h3 style="margin:0 0 8px 0">${v.title}</h3>
        <p style="margin:0 0 12px 0;line-height:1.6">${v.description}</p>
        <a href="${v.ctaUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">${v.ctaText}</a>
      ${baseWrapperEnd}`
  },
  {
    id: 'limited-offer',
    name: 'Limited Time Offer',
    subject: 'Limited time: up to 25% OFF ⏰',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'description', label: 'Offer Description' },
      { key: 'ctaText', label: 'Button Text' },
      { key: 'ctaUrl', label: 'Button Link' }
    ],
    defaults: {
      brand: '🔥 Limited Time Offer',
      description: 'Save big on your favorites before the deal ends. Use code SAVE25 at checkout.',
      ctaText: 'Grab the Deal',
      ctaUrl: '/products'
    },
    render: (v) =>
      `${baseWrapperStart('#f59e0b', v.brand)}
        <p style="margin:0 0 12px 0;line-height:1.6">${v.description}</p>
        <a href="${v.ctaUrl}" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">${v.ctaText}</a>
      ${baseWrapperEnd}`
  },
  {
    id: 'seasonal',
    name: 'Seasonal Greetings',
    subject: 'Warm wishes and a special treat 🎁',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'description', label: 'Message' },
      { key: 'ctaText', label: 'Button Text' },
      { key: 'ctaUrl', label: 'Button Link' }
    ],
    defaults: {
      brand: 'Seasonal Greetings',
      description: 'Wishing you and your family a wonderful season. Enjoy a little treat on us!',
      ctaText: 'View Treat',
      ctaUrl: '/products'
    },
    render: (v) =>
      `${baseWrapperStart('#10b981', v.brand)}
        <p style="margin:0 0 12px 0;line-height:1.6">${v.description}</p>
        <a href="${v.ctaUrl}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">${v.ctaText}</a>
      ${baseWrapperEnd}`
  }
];

export default EMAIL_TEMPLATES;


