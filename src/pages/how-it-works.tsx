import { motion } from 'framer-motion';
import { FiUsers, FiCalendar, FiMapPin, FiMessageSquare, FiCoffee, FiSmile, FiHelpCircle, FiArrowRight } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function HowItWorksPage() {
  const router = useRouter();

  // Schritte zur Teilnahme
  const steps = [
    {
      icon: <FiUsers className="w-8 h-8 text-primary-600" />,
      title: "Registrieren",
      description: "Erstelle ein kostenloses Konto und vervollständige dein Profil mit deinen Interessen und Vorlieben."
    },
    {
      icon: <FiMapPin className="w-8 h-8 text-primary-600" />,
      title: "Restaurant finden",
      description: "Durchsuche unsere Partnerrestaurants und finde Kontakttische in deiner Nähe oder an deinem Wunschort."
    },
    {
      icon: <FiCalendar className="w-8 h-8 text-primary-600" />,
      title: "Teilnehmen",
      description: "Wähle einen Kontakttisch aus, der zu deinem Zeitplan und deinen Interessen passt, und melde dich an."
    },
    {
      icon: <FiCoffee className="w-8 h-8 text-primary-600" />,
      title: "Genießen",
      description: "Besuche das Restaurant, triff neue Menschen und genieße ein gemeinsames Essen in guter Gesellschaft."
    }
  ];

  // Häufig gestellte Fragen
  const faqs = [
    {
      question: "Muss ich etwas bezahlen, um an einem Kontakttisch teilzunehmen?",
      answer: "Die Teilnahme an Contact Tables ist kostenlos. Du bezahlst nur für dein Essen und Getränke im Restaurant, genau wie bei einem normalen Restaurantbesuch."
    },
    {
      question: "Wie erkenne ich den Kontakttisch im Restaurant?",
      answer: "Alle Kontakttische sind mit einem speziellen Tischaufsteller gekennzeichnet. Außerdem erhältst du nach deiner Anmeldung eine Bestätigung mit allen Details und kannst dich beim Eintreffen im Restaurant an das Personal wenden."
    },
    {
      question: "Was passiert, wenn ich mich angemeldet habe, aber nicht kommen kann?",
      answer: "Wir bitten dich, deine Teilnahme mindestens 24 Stunden vorher abzusagen, damit andere Interessenten deinen Platz einnehmen können. Eine Absage ist einfach über dein Profil möglich."
    },
    {
      question: "Gibt es eine Mindest- oder Höchstteilnehmerzahl?",
      answer: "Die meisten Kontakttische sind für 4-8 Personen ausgelegt. Die genaue Teilnehmerzahl wird bei jedem Tisch angegeben, sodass du im Voraus weißt, wie viele Menschen du treffen wirst."
    },
    {
      question: "Wie werden die Teilnehmer ausgewählt?",
      answer: "Die Teilnahme erfolgt nach dem Prinzip 'first come, first served'. Bei einigen Kontakttischen kann es thematische Schwerpunkte geben, die in der Beschreibung angegeben sind."
    }
  ];

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 text-white py-24 -mt-8 rounded-b-3xl relative overflow-hidden">
        {/* Dekorative Elemente */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-white"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              So funktionieren <span className="text-secondary-300">Contact Tables</span>
            </h1>
            <p className="text-xl text-white/90 leading-relaxed mb-10 max-w-3xl mx-auto">
              Entdecke, wie du mit Contact Tables neue Menschen kennenlernen und 
              gemeinsam essen kannst – einfach, unkompliziert und in angenehmer Atmosphäre.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/contact-tables')}
                className="bg-white hover:bg-neutral-100 text-primary-700 px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <span>Kontakttische entdecken</span>
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
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <FiHelpCircle className="mr-2" />
                <span>Häufige Fragen</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Was sind Contact Tables? */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6 text-secondary-800">Was sind Contact Tables?</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Contact Tables sind spezielle Tische in ausgewählten Restaurants, an denen sich Menschen treffen können, 
                  die sich vorher nicht kannten. Sie bieten eine Möglichkeit, in ungezwungener Atmosphäre neue Kontakte zu knüpfen, 
                  interessante Gespräche zu führen und gemeinsam zu essen.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Unsere Mission ist es, echte menschliche Verbindungen zu fördern und Einsamkeit zu bekämpfen. 
                  In einer zunehmend digitalen Welt schaffen wir Räume für authentische Begegnungen und gemeinsame Erlebnisse.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Contact Tables sind für jeden geeignet – ob du neu in der Stadt bist, dein soziales Netzwerk erweitern möchtest 
                  oder einfach offen für neue Bekanntschaften bist.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-video bg-neutral-200 rounded-xl overflow-hidden shadow-xl">
                  {/* Hier könnte ein Video oder Bild eingefügt werden */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-neutral-600 text-lg">
                      Video: Contact Tables Erklärung
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-100 rounded-lg -z-10"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-100 rounded-lg -z-10"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Vorteile */}
      <div className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Warum Contact Tables?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Contact Tables bieten zahlreiche Vorteile für Menschen, die neue Kontakte knüpfen möchten
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
                <h3 className="text-xl font-semibold mb-4">Neue Menschen kennenlernen</h3>
                <p className="text-gray-600">
                  Treffe Menschen mit ähnlichen Interessen oder ganz neuen Perspektiven in einer entspannten Umgebung.
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
                  <FiMessageSquare className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Interessante Gespräche</h3>
                <p className="text-gray-600">
                  Tausche dich über Themen aus, die dich bewegen, und entdecke neue Perspektiven und Ideen.
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
                  <FiSmile className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Gegen Einsamkeit</h3>
                <p className="text-gray-600">
                  Bekämpfe aktiv Einsamkeit und schaffe bedeutungsvolle Verbindungen in einer zunehmend isolierten Welt.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* So funktioniert's */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">So nimmst du teil</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                In nur wenigen einfachen Schritten kannst du an einem Kontakttisch teilnehmen
              </p>
            </div>
            
            <div className="relative">
              {/* Verbindungslinie */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 -translate-x-1/2 z-0 hidden md:block"></div>
              
              {/* Schritte */}
              <div className="space-y-24 relative z-10">
                {steps.map((step, index) => (
                  <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}>
                    <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'} mb-8 md:mb-0 text-center`}>
                      <motion.div
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                      >
                        <h3 className="text-2xl font-bold mb-4 text-secondary-700">{index + 1}. {step.title}</h3>
                        <p className="text-gray-600 text-lg">
                          {step.description}
                        </p>
                      </motion.div>
                    </div>
                    
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center border-4 border-white shadow-lg z-20">
                        {step.icon}
                      </div>
                    </div>
                    
                    <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pl-16' : 'md:pr-16'} hidden md:block`}></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-20 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/contact-tables')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-lg font-medium text-lg transition-colors inline-flex items-center"
              >
                <span>Jetzt Kontakttische entdecken</span>
                <FiArrowRight className="ml-2" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Das sagen unsere Teilnehmer</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Erfahrungen von Menschen, die bereits an Kontakttischen teilgenommen haben
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-semibold">Julia, 34</h3>
                    <p className="text-gray-500 text-sm">München</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Nach meinem Umzug nach München kannte ich kaum jemanden. Durch Contact Tables habe ich nicht nur 
                  tolle Restaurants entdeckt, sondern auch Freundschaften geschlossen, die bis heute halten."
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-semibold">Markus, 42</h3>
                    <p className="text-gray-500 text-sm">Berlin</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Als Selbstständiger verbringe ich viel Zeit allein. Die Kontakttische sind für mich eine 
                  willkommene Abwechslung und die perfekte Gelegenheit, um aus meiner Blase herauszukommen und 
                  neue Perspektiven kennenzulernen."
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-md p-8"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full mr-4"></div>
                  <div>
                    <h3 className="font-semibold">Sophie, 28</h3>
                    <p className="text-gray-500 text-sm">Hamburg</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "Ich war anfangs skeptisch, aber die Atmosphäre war so entspannt und die Gespräche so interessant, 
                  dass ich mittlerweile regelmäßig teilnehme. Es ist eine tolle Möglichkeit, Menschen kennenzulernen, 
                  die man sonst nie getroffen hätte."
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq-section" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Häufig gestellte Fragen</h2>
              <p className="text-xl text-gray-600">
                Antworten auf die wichtigsten Fragen rund um Contact Tables
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
                Hast du weitere Fragen? Schau in unseren FAQ-Bereich oder kontaktiere uns direkt.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/faq" className="inline-flex items-center justify-center px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-secondary-800 rounded-lg font-medium transition-colors">
                  <FiHelpCircle className="mr-2" />
                  Alle FAQs ansehen
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                  <FiMessageSquare className="mr-2" />
                  Kontakt aufnehmen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Bereit, neue Menschen kennenzulernen?</h2>
            <p className="text-xl mb-10 text-white/90 max-w-3xl mx-auto">
              Entdecke jetzt verfügbare Kontakttische in deiner Nähe und werde Teil einer wachsenden Gemeinschaft.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/contact-tables')}
              className="bg-white hover:bg-neutral-100 text-primary-700 px-10 py-4 rounded-lg font-medium text-lg transition-colors inline-flex items-center"
            >
              <span>Kontakttische entdecken</span>
              <FiArrowRight className="ml-2" />
            </motion.button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
