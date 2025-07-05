import {
  Clock,
  Facebook,
  Heart,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useStore();

  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: t('footer.quickLinks'),
      links: [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.products'), path: '/products' },
        { name: t('nav.reviews'), path: '/reviews' },
        { name: t('nav.chat'), path: '/chat' }
      ]
    },
    {
      title: t('footer.customerService'),
      links: [
        { name: t('footer.trackOrder'), path: '/track-order' },
        { name: t('footer.returnPolicy'), path: '/return-policy' },
        { name: t('footer.faq'), path: '/faq' },
        { name: t('footer.contact'), path: '/contact' }
      ]
    },
    {
      title: t('footer.legal'),
      links: [
        { name: t('footer.privacyPolicy'), path: '/privacy-policy' },
        { name: t('footer.termsOfService'), path: '/terms-of-service' },
        { name: t('footer.cookiePolicy'), path: '/cookie-policy' },
        { name: t('footer.refundPolicy'), path: '/refund-policy' }
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🥟</div>
              <span className={`font-bold text-xl text-white ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' ? 'চিকেন সমুচা' : 'Chicken Samosa'}
              </span>
            </div>
            <p className={`text-gray-300 text-sm leading-relaxed ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {language === 'bn' 
                ? 'রংপুরের সবচেয়ে সুস্বাদু চিকেন সমুচা। তাজা উপাদান এবং ঐতিহ্যবাহী রেসিপি দিয়ে তৈরি।'
                : 'Rangpur\'s most delicious chicken samosa. Made with fresh ingredients and traditional recipes.'
              }
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+880 1537134852</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>info@chickensamosa.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span className={language === 'bn' ? 'font-bengali' : ''}>
                  {language === 'bn' 
                    ? 'রংপুর, বাংলাদেশ'
                    : 'Rangpur, Bangladesh'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-primary-400" />
                <span className={language === 'bn' ? 'font-bengali' : ''}>
                  {language === 'bn' 
                    ? 'সকাল ৯টা - রাত ১১টা'
                    : '9:00 AM - 11:00 PM'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className={`font-semibold text-lg text-white ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.path}
                      className={`text-gray-300 hover:text-primary-400 transition-colors text-sm ${
                        language === 'bn' ? 'font-bengali' : ''
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className={`font-semibold text-lg text-white mb-4 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {language === 'bn' 
                ? 'বিশেষ অফার এবং আপডেট পেতে সাবস্ক্রাইব করুন'
                : 'Subscribe for special offers and updates'
              }
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={language === 'bn' ? 'আপনার ইমেইল ঠিকানা' : 'Your email address'}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              />
              <button className="btn-primary px-6 py-2 whitespace-nowrap">
                {language === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Social Media Links */}
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <span className={`text-gray-300 text-sm ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' ? 'আমাদের ফলো করুন:' : 'Follow us:'}
              </span>
              <div className="flex space-x-3">
                <Link to="https://www.facebook.com/profile.php?id=61560857046585" target="_blank" rel="noopener noreferrer">
                <button
                  type="button"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                </Link>
                
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className={`text-gray-400 text-sm flex items-center justify-center md:justify-end ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' 
                  ? `© ${currentYear} চিকেন সমুচা। সব অধিকার সংরক্ষিত।`
                  : `© ${currentYear} Chicken Samosa. All rights reserved.`
                }
                <Heart className="w-3 h-3 mx-1 text-red-400" />
                {language === 'bn' 
                  ? 'ভালোবাসা দিয়ে তৈরি'
                  : 'Made with love'
                }
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {language === 'bn' 
                  ? 'রেসপন্সিভ ডিজাইন এবং ডার্ক মোড সহ'
                  : 'With responsive design and dark mode'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 