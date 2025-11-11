import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiMail, FiPhone, FiMessageSquare, FiClock, FiChevronDown, FiChevronUp, FiCalendar, FiFileText, FiUsers, FiHeart } from 'react-icons/fi';
import Link from 'next/link';
import PageLayout from '../../components/PageLayout';

interface RegistrationSuccessProps {
  restaurantId: string | null;
}

export default function RegistrationSuccess({ restaurantId }: RegistrationSuccessProps) {
  // State für FAQ-Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const YEARLY_URL = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_YEARLY_URL || 'https://www.checkout-ds24.com/product/640621';
  const MONTHLY_URL = process.env.NEXT_PUBLIC_DIGISTORE_PRODUCT_MONTHLY_URL || 'https://www.checkout-ds24.com/product/640542';
  const appendCustom = (url: string) => {
    if (!restaurantId) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}custom=${encodeURIComponent(restaurantId)}`;
  };
  const MONTHLY_URL_WITH_CUSTOM = appendCustom(MONTHLY_URL);
  const YEARLY_URL_WITH_CUSTOM = appendCustom(YEARLY_URL);
  
  // Funktion zum Umschalten des FAQ-Accordion
  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  
  // Animation-Varianten
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };
  
  // FAQ-Daten
  const faqs = [
    {
      question: "Wie lange dauert die Prüfung meiner Anfrage?",
      answer: "Die Prüfung Ihrer Anfrage dauert in der Regel 1-2 Werktage. Bei hohem Anfragevolumen kann es etwas länger dauern."
    },
    {
      question: "Welche Kriterien werden bei der Prüfung angewendet?",
      answer: "Wir prüfen die Vollständigkeit Ihrer Angaben, die Eignung Ihres Restaurants für Contact Tables und die Übereinstimmung mit unseren Qualitätsstandards."
    },
    {
      question: "Was passiert nach der Genehmigung meiner Anfrage?",
      answer: "Nach der Genehmigung erhalten Sie eine E-Mail mit einem Link zur Auswahl Ihres Abonnements und zur Annahme der Vertragsbedingungen."
    },
    {
      question: "Kann ich meine Daten nach der Registrierung noch ändern?",
      answer: "Ja, absolut! Sie können und sollten Ihr Restaurantprofil sofort nach dieser Registrierung in Ihrem Dashboard vervollständigen und alle Details hinzufügen. Dies hilft uns auch bei der schnelleren Prüfung Ihrer Anfrage."
    },
    {
      question: "Welche Kosten entstehen für mein Restaurant?",
      answer: "Die Kosten hängen vom gewählten Abonnementmodell ab. Wir bieten verschiedene Tarife an, die auf die Bedürfnisse unterschiedlicher Restaurantgrößen zugeschnitten sind."
    }
  ];

  return (
    <PageLayout>
      <div className="bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2
                }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
              >
                <FiCheckCircle className="w-14 h-14 text-green-600" />
              </motion.div>
            </div>
            
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-800 mb-4">
                Registrierung erfolgreich!
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Vielen Dank für Ihre Registrierung bei Contact Tables. Wir haben Ihre Anfrage erhalten und werden sie sorgfältig prüfen. Wir freuen uns darauf, Sie als Partner in unserem Netzwerk begrüßen zu dürfen.
              </motion.p>
              
              <motion.div variants={itemVariants} className="bg-blue-50 p-5 rounded-lg mb-8 max-w-2xl mx-auto">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiMail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3 text-left">
                    <h3 className="text-md font-medium text-blue-800">Bestätigungs-E-Mail gesendet</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Wir haben eine Bestätigungs-E-Mail an die von Ihnen angegebene E-Mail-Adresse gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht finden können.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Mitgliedschaft CTA (Monat/Jahr) */}
            <motion.div
              variants={itemVariants}
              className="mt-8 max-w-2xl mx-auto"
            >
              <div className="bg-green-50 p-5 rounded-lg border border-green-200 text-center">
                <h3 className="text-md font-medium text-green-800 mb-2">Schneller zur Aktivierung</h3>
                <p className="text-sm text-green-700 mb-4">
                  Wählen Sie zwischen monatlicher Zahlung oder dem Jahres-Abo und schalten Sie Ihr Restaurant nach Prüfung direkt frei.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={MONTHLY_URL_WITH_CUSTOM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium transition-colors"
                  >
                    Monatszahlung (12 Monate)
                  </a>
                  <a
                    href={YEARLY_URL_WITH_CUSTOM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md font-medium transition-colors"
                  >
                    Jahres-Abo abschließen
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Zeitplan */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-12 max-w-2xl mx-auto"
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Ihr Weg zum Contact Tables Partner
              </motion.h2>
              
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-primary-100"></div>
                
                <div className="space-y-8">
                  <div className="relative flex items-start">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center z-10 mr-4">
                      <FiCheckCircle className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-grow">
                      <div className="flex items-center mb-1">
                        <FiCalendar className="text-primary-500 mr-2" />
                        <span className="text-sm text-primary-600 font-medium">Tag 1</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Registrierung abgeschlossen</h3>
                      <p className="text-gray-600 text-sm">
                        Ihre Anfrage wurde erfolgreich übermittelt und befindet sich nun in der Prüfung.
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center z-10 mr-4">
                      <FiMail className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-grow">
                      <div className="flex items-center mb-1">
                        <FiCalendar className="text-primary-500 mr-2" />
                        <span className="text-sm text-primary-600 font-medium">Tag 2-3</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Prüfung & Genehmigung</h3>
                      <p className="text-gray-600 text-sm">
                        Unser Team prüft Ihre Anfrage und sendet Ihnen bei positiver Bewertung einen Vertragslink.
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center z-10 mr-4">
                      <FiFileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-grow">
                      <div className="flex items-center mb-1">
                        <FiCalendar className="text-primary-500 mr-2" />
                        <span className="text-sm text-primary-600 font-medium">Tag 3-5</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Vertragsabschluss</h3>
                      <p className="text-gray-600 text-sm">
                        Wählen Sie Ihr Abonnement aus und akzeptieren Sie die Vertragsbedingungen.
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative flex items-start">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center z-10 mr-4">
                      <FiUsers className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex-grow">
                      <div className="flex items-center mb-1">
                        <FiCalendar className="text-primary-500 mr-2" />
                        <span className="text-sm text-primary-600 font-medium">Ab Tag 5</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-1">Aktive Teilnahme</h3>
                      <p className="text-gray-600 text-sm">
                        Ihr Restaurant ist auf der Plattform sichtbar und Sie können Kontakttische anbieten.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* FAQ-Sektion */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-16 max-w-2xl mx-auto"
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Häufig gestellte Fragen
              </motion.h2>
              
              <motion.div variants={itemVariants} className="space-y-4">
                {faqs.map((faq, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex justify-between items-center p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-800">{faq.question}</span>
                      {openFaq === index ? (
                        <FiChevronUp className="text-primary-500 flex-shrink-0" />
                      ) : (
                        <FiChevronDown className="text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {openFaq === index && (
                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Kontakt-Sektion */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-16 max-w-2xl mx-auto"
            >
              <motion.h2 variants={itemVariants} className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Haben Sie Fragen?
              </motion.h2>
              
              <motion.div variants={itemVariants} className="bg-primary-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4 text-center">
                  Unser Partner-Support-Team steht Ihnen bei Fragen gerne zur Verfügung.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
                    <FiMail className="h-6 w-6 text-primary-600 mb-2" />
                    <h3 className="font-medium text-gray-800 mb-1">E-Mail</h3>
                    <p className="text-sm text-gray-600 text-center">info@contact-tables.org</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center">
                    <FiMessageSquare className="h-6 w-6 text-primary-600 mb-2" />
                    <h3 className="font-medium text-gray-800 mb-1">Live-Chat</h3>
                    <p className="text-sm text-gray-600">Mo-Fr, 9-17 Uhr</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="mt-12 text-center"
            >
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Zurück zur Startseite
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const supabase = createClient(context);
    const { data: { user } } = await supabase.auth.getUser();

    // Falls kein Login oder keine Restaurant-Rolle, liefern wir keine Restaurant-ID
    if (!user || (user.user_metadata?.role || '').toString().toUpperCase() !== 'RESTAURANT') {
      return { props: { restaurantId: null } };
    }

    const prisma = new PrismaClient();
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { userId: user.id },
        select: { id: true }
      });
      return { props: { restaurantId: restaurant?.id || null } };
    } finally {
      await prisma.$disconnect();
    }
  } catch (e) {
    // Bei jedem Fehler: sichere Fallbacks ohne Custom-Parameter
    return { props: { restaurantId: null } };
  }
};
