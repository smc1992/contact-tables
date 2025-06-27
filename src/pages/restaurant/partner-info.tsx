import { motion } from 'framer-motion';
import { FiUsers, FiTrendingUp, FiCalendar, FiClock, FiCheck, FiHelpCircle, FiArrowRight } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Preismodelle
const pricingPlans = [
  {
    name: 'Basis',
    price: '49',
    features: [
      'Bis zu 5 Kontakttische pro Woche',
      'Grundlegende Restaurantprofilseite',
      'E-Mail-Support',
      'Monatliche Statistiken'
    ],
    recommended: false
  },
  {
    name: 'Premium',
    price: '99',
    features: [
      'Unbegrenzte Kontakttische',
      'Hervorgehobenes Restaurantprofil',
      'Prioritäts-Support',
      'Detaillierte Statistiken und Insights',
      'Exklusive Marketing-Aktionen',
      'Reservierungsmanagement'
    ],
    recommended: true
  },
  {
    name: 'Enterprise',
    price: '199',
    features: [
      'Alles aus Premium',
      'Mehrere Standorte möglich',
      'Dedizierter Account Manager',
      'Anpassbare Berichte',
      'API-Zugang für Integration',
      'Priorisierte Platzierung in Suchergebnissen'
    ],
    recommended: false
  }
];

// FAQ-Einträge
const faqs = [
  {
    question: 'Wie funktioniert Contact Tables für Restaurants?',
    answer: 'Als Restaurant-Partner stellen Sie Tische für Contact Tables zur Verfügung. Nutzer können diese über unsere Plattform finden und sich anmelden. Die eigentliche Reservierung erfolgt direkt bei Ihnen. Sie erhalten eine Benachrichtigung, wenn jemand an einem Kontakttisch teilnehmen möchte, und können die Reservierung bestätigen.'
  },
  {
    question: 'Welche Kosten entstehen für mein Restaurant?',
    answer: 'Wir bieten verschiedene Preismodelle an, die sich nach Ihren Bedürfnissen richten. Die Kosten beginnen bei 49€ pro Monat für das Basispaket. Alle Pakete werden monatlich abgerechnet, und Sie können jederzeit auf ein höheres Paket upgraden oder zum Ende der Vertragslaufzeit kündigen.'
  },
  {
    question: 'Wie viele Kontakttische sollte ich anbieten?',
    answer: 'Das hängt von der Größe Ihres Restaurants und Ihren Kapazitäten ab. Wir empfehlen, mit 1-2 Tischen pro Tag zu beginnen und das Angebot bei Bedarf zu erweitern. Sie haben volle Kontrolle darüber, wann und wie viele Kontakttische Sie anbieten möchten.'
  },
  {
    question: 'Wie werden die Kontakttische im Restaurant gekennzeichnet?',
    answer: 'Wir stellen Ihnen Tischaufsteller und andere Materialien zur Verfügung, um die Kontakttische zu kennzeichnen. Diese sind dezent gestaltet und fügen sich gut in Ihr Ambiente ein. Zusätzlich können Sie in unserem Partner-Dashboard eigene Materialien erstellen, die zu Ihrem Corporate Design passen.'
  },
  {
    question: 'Wie lange dauert der Anmeldeprozess?',
    answer: 'Nach Ihrer Anmeldung prüfen wir Ihre Angaben in der Regel innerhalb von 1-2 Werktagen. Nach erfolgreicher Prüfung erhalten Sie Zugang zu Ihrem Partner-Dashboard und können sofort mit der Einrichtung Ihres Profils und dem Angebot von Kontakttischen beginnen.'
  }
];

export default function RestaurantPartnerInfo() {
  const router = useRouter();

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-800 to-secondary-600 text-white py-24 -mt-8 rounded-b-3xl relative overflow-hidden">
        {/* Dekorative Elemente */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-primary-300"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-primary-400"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Werden Sie Restaurant-Partner bei <span className="text-primary-300">Contact Tables</span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed mb-10 max-w-3xl mx-auto">
              Steigern Sie Ihren Umsatz, gewinnen Sie neue Stammgäste und werden Sie Teil einer 
              wachsenden Bewegung gegen Einsamkeit in der Gastronomie.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/restaurant/partner-request')}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <span>Jetzt Partner werden</span>
                <FiArrowRight className="ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const faqSection = document.getElementById('faq-section');
                  if (faqSection) {
                    faqSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-white hover:bg-neutral-100 text-secondary-800 px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <FiHelpCircle className="mr-2" />
                <span>Mehr erfahren</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Vorteile Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Ihre Vorteile als Partner</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Contact Tables bietet Ihrem Restaurant zahlreiche Vorteile und erschließt neue Gästegruppen
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md p-8 text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiUsers className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Neue Gäste gewinnen</h3>
                <p className="text-gray-600">
                  Erreichen Sie eine neue Zielgruppe von Menschen, die gezielt nach sozialen Essenserlebnissen suchen und potenzielle Stammgäste werden können.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-8 text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiTrendingUp className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Umsatz steigern</h3>
                <p className="text-gray-600">
                  Füllen Sie leere Tische zu Nebenzeiten und erhöhen Sie Ihren Umsatz durch zusätzliche Gäste, die speziell für die Kontakttische kommen.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-md p-8 text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCalendar className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Flexibles Management</h3>
                <p className="text-gray-600">
                  Sie entscheiden selbst, wann und wie viele Kontakttische Sie anbieten möchten. Volle Kontrolle über Ihre Kapazitäten und Verfügbarkeiten.
                </p>
              </motion.div>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl shadow-md p-8 flex items-start"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-6 mt-1 flex-shrink-0">
                  <FiClock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Optimierte Auslastung</h3>
                  <p className="text-gray-600">
                    Nutzen Sie die Contact Tables-Plattform, um gezielt Gäste zu Zeiten mit geringerer Auslastung anzuziehen. 
                    Unsere Daten zeigen, dass Kontakttische besonders in den frühen Abendstunden und an Wochentagen beliebt sind – 
                    genau dann, wenn viele Restaurants freie Kapazitäten haben.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-xl shadow-md p-8 flex items-start"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-6 mt-1 flex-shrink-0">
                  <FiCheck className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Positives Image</h3>
                  <p className="text-gray-600">
                    Positionieren Sie Ihr Restaurant als sozial engagiert und gemeinschaftsfördernd. 
                    Contact Tables-Partner werden als Orte wahrgenommen, die aktiv gegen Einsamkeit vorgehen und 
                    echte menschliche Verbindungen fördern – ein wichtiger Wert für viele Gäste.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Wie es funktioniert */}
      <div className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">So funktioniert's für Restaurants</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                In wenigen einfachen Schritten werden Sie Teil des Contact Tables-Netzwerks
              </p>
            </div>
            
            <div className="relative">
              {/* Verbindungslinie */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 -translate-x-1/2 z-0 hidden md:block"></div>
              
              {/* Schritte */}
              <div className="space-y-24 relative z-10">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-16 mb-8 md:mb-0 text-center md:text-right">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-2xl font-bold mb-4 text-secondary-700">1. Registrierung</h3>
                      <p className="text-gray-600 text-lg">
                        Füllen Sie das Anmeldeformular aus und teilen Sie uns Informationen über Ihr Restaurant mit. 
                        Wir benötigen grundlegende Daten wie Kontaktinformationen, Öffnungszeiten und Kapazitäten.
                      </p>
                    </motion.div>
                  </div>
                  
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-white shadow-lg z-20">
                      1
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-16 hidden md:block"></div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-16 hidden md:block"></div>
                  
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-white shadow-lg z-20">
                      2
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-16 mb-8 md:mb-0 text-center md:text-left">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-2xl font-bold mb-4 text-secondary-700">2. Verifizierung</h3>
                      <p className="text-gray-600 text-lg">
                        Unser Team prüft Ihre Angaben und kontaktiert Sie für weitere Details. 
                        Nach erfolgreicher Prüfung erhalten Sie Zugang zu Ihrem Partner-Dashboard.
                      </p>
                    </motion.div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-16 mb-8 md:mb-0 text-center md:text-right">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-2xl font-bold mb-4 text-secondary-700">3. Einrichtung</h3>
                      <p className="text-gray-600 text-lg">
                        Richten Sie Ihr Restaurantprofil ein und definieren Sie, wann und wie viele Kontakttische 
                        Sie anbieten möchten. Laden Sie Fotos hoch und beschreiben Sie Ihr kulinarisches Angebot.
                      </p>
                    </motion.div>
                  </div>
                  
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-white shadow-lg z-20">
                      3
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-16 hidden md:block"></div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-16 hidden md:block"></div>
                  
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary-500 text-white text-2xl font-bold flex items-center justify-center border-4 border-white shadow-lg z-20">
                      4
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-16 mb-8 md:mb-0 text-center md:text-left">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-2xl font-bold mb-4 text-secondary-700">4. Aktivierung</h3>
                      <p className="text-gray-600 text-lg">
                        Nach Abschluss des Abonnements wird Ihr Restaurant auf der Contact Tables-Plattform 
                        sichtbar. Sie erhalten Materialien zur Kennzeichnung der Kontakttische und können 
                        sofort Reservierungen empfangen.
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preismodelle */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Unsere Preismodelle</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wählen Sie das passende Paket für Ihr Restaurant
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className={`rounded-xl overflow-hidden shadow-lg ${
                    plan.recommended 
                      ? 'ring-4 ring-primary-500 transform scale-105 z-10 bg-white' 
                      : 'bg-white'
                  }`}
                >
                  {plan.recommended && (
                    <div className="bg-primary-500 text-white py-2 px-4 text-center font-medium">
                      Empfohlen
                    </div>
                  )}
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-4 text-secondary-800">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-secondary-800">{plan.price}€</span>
                      <span className="text-gray-600 ml-1">/Monat</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <FiCheck className="text-primary-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/restaurant/partner-request')}
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        plan.recommended 
                          ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                          : 'bg-neutral-100 hover:bg-neutral-200 text-secondary-800'
                      }`}
                    >
                      Jetzt auswählen
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <p className="text-gray-600">
                Alle Preise zzgl. MwSt. Mindestvertragslaufzeit: 3 Monate. Danach monatlich kündbar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq-section" className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Häufig gestellte Fragen</h2>
              <p className="text-xl text-gray-600">
                Antworten auf die wichtigsten Fragen unserer Restaurant-Partner
              </p>
            </div>
            
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-secondary-800">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-700 mb-6">
                Haben Sie weitere Fragen? Kontaktieren Sie unser Partner-Team.
              </p>
              <Link href="/contact" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
                <FiHelpCircle className="mr-2" />
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Bereit, Partner zu werden?</h2>
            <p className="text-xl mb-10 text-white/90 max-w-3xl mx-auto">
              Werden Sie Teil des Contact Tables-Netzwerks und profitieren Sie von neuen Gästen, 
              erhöhter Sichtbarkeit und einem positiven Image für Ihr Restaurant.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/restaurant/partner-request')}
              className="bg-white hover:bg-neutral-100 text-primary-700 px-10 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Jetzt als Partner bewerben
            </motion.button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
