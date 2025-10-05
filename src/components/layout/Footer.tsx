import {
  Clock,
  Facebook,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';
import React from 'react';
// import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import PickplaceLogo from '../common/PickplaceLogo';
// import { subscriptionsAPI } from '../../utils/api';

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
        { name: t('footer.contact'), path: '/contact' }
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

  // Newsletter disabled (state removed)

  // Newsletter disabled (no-op)

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
            <Link to="/" className="hidden lg:flex flex-col items-start">
              <PickplaceLogo size="lg" />
              <span className="mt-1 text-white text-sm">www.rongdhunu.com</span>
            </Link>
              
            </div>
            <p className={`text-gray-300 text-sm leading-relaxed ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {language === 'bn' 
                ? 'বাংলাদেশের বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম। মানসম্পন্ন পণ্য, দ্রুত ডেলিভারি এবং চমৎকার সেবা।'
                : 'Your trusted e-commerce platform in Bangladesh. Quality products, fast delivery, and excellent service.'
              }
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+880 1676726778</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>rongdhunu503@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span className={language === 'bn' ? 'font-bengali' : ''}>
                  {language === 'bn' 
                    ? 'ঢাকা, বাংলাদেশ'
                    : 'Dhaka, Bangladesh'
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

        {/* Newsletter Signup - hidden as per configuration */}

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
                <Link to="https://www.facebook.com/share/19fy3wkqHZ/" target="_blank" rel="noopener noreferrer">
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
                  ? `© ${currentYear} রঙ্গধুনু। সব অধিকার সংরক্ষিত।`
                  : `© ${currentYear} Rongdhunu. All rights reserved.`
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