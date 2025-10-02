import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiMail, FiPhone, FiMapPin, FiClock, FiUsers } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-neutral-300">
      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <div className="flex items-center space-x-3 group">
                <div className="h-12 bg-white p-2 rounded-lg overflow-hidden relative">
                  <Image 
                    src="/images/logo/logo/Contact Tables RGB transparent.webp" 
                    alt="Contact Tables Logo" 
                    width={120}
                    height={40}
                    className="transition-all group-hover:scale-105"
                    priority
                    style={{ objectFit: 'contain', width: 'auto', height: '100%' }}
                    quality={100}
                  />
                </div>
              </div>
            </Link>
            <p className="text-neutral-400 leading-relaxed">
              Wir verbinden Menschen am Restauranttisch – für echte Begegnungen und inspirierende Gespräche.
            </p>

          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-6 border-b border-neutral-700 pb-3">Entdecken</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/restaurants" className="flex items-center space-x-2 text-neutral-400 hover:text-primary-400 transition-colors group">
                  <FiMapPin className="group-hover:translate-x-1 transition-transform" />
                  <span>Restaurants finden</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="flex items-center space-x-2 text-neutral-400 hover:text-primary-400 transition-colors group">
                  <FiUsers className="group-hover:translate-x-1 transition-transform" />
                  <span>Über uns</span>
                </Link>
              </li>
              <li>
                <Link href="/restaurant/register" className="flex items-center space-x-2 text-neutral-400 hover:text-primary-400 transition-colors group">
                  <FiMapPin className="group-hover:translate-x-1 transition-transform" />
                  <span>Restaurant anmelden</span>
                </Link>
              </li>
              <li>
                <Link href="/events" className="flex items-center space-x-2 text-neutral-400 hover:text-primary-400 transition-colors group">
                  <FiClock className="group-hover:translate-x-1 transition-transform" />
                  <span>Events & Aktionen</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-6 border-b border-neutral-700 pb-3">Rechtliches</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/datenschutz" className="text-neutral-400 hover:text-primary-400 transition-colors">
                  Datenschutzerklärung
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-neutral-400 hover:text-primary-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-neutral-400 hover:text-primary-400 transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-neutral-400 hover:text-primary-400 transition-colors">
                  AGB
                </Link>
              </li>
              <li>
                <Link href="/barrierefreiheit" className="text-neutral-400 hover:text-primary-400 transition-colors">
                  Barrierefreiheit
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xl font-semibold text-white mb-6 border-b border-neutral-700 pb-3">Kontakt</h4>
            <ul className="space-y-4">
              <li className="group">
                <a href="tel:+4915679640069" className="flex items-center space-x-3 text-neutral-400 hover:text-primary-400 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-primary-700 flex items-center justify-center transition-all duration-300">
                    <FiPhone size={16} />
                  </div>
                  <span>+49 15679 640069</span>
                </a>
              </li>
              <li className="group">
                <Link href="/contact" className="flex items-center space-x-3 text-neutral-400 hover:text-primary-400 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-primary-700 flex items-center justify-center transition-all duration-300">
                    <FiMail size={16} />
                  </div>
                  <span>Nachricht absenden</span>
                </Link>
              </li>
              <li className="group">
                <a href="https://www.facebook.com/contacttables/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-neutral-400 hover:text-primary-400 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-primary-700 flex items-center justify-center transition-all duration-300">
                    <FaFacebookF size={16} />
                  </div>
                  <span>Facebook</span>
                </a>
              </li>
              <li className="group">
                <a href="https://www.instagram.com/contacttables/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 text-neutral-400 hover:text-primary-400 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-primary-700 flex items-center justify-center transition-all duration-300">
                    <FaInstagram size={16} />
                  </div>
                  <span>Instagram</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-16 pt-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-neutral-500">© {new Date().getFullYear()} contact-tables. Alle Rechte vorbehalten.</p>
            <p className="flex items-center text-neutral-500">
              <span>Made with</span> <FiHeart className="mx-2 text-primary-500" /> <span>in Germany</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}