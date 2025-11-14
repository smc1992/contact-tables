import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { FiUsers, FiHeart, FiSmile, FiCoffee, FiMessageCircle, FiStar, FiMapPin, FiCalendar } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import Image from 'next/image';
import Link from 'next/link';

// Team-Mitglieder
const teamMembers = [
  {
    name: 'Anette Rapp',
    role: 'Gründerin & CEO',
    bio: 'Anette gründete contact-tables aus der Vision heraus, Menschen durch gemeinsames Essen zusammenzubringen – inspiriert von ihren Reisen durch Europa, auf denen sie die Bedeutung echter, zwischenmenschlicher Verbindungen entdeckte. Ihre Leidenschaft für das Schaffen von Gemeinschaften und das Fördern von authentischen Begegnungen bildet das Herzstück von contact-tables.',
    image: '/images/about/anette-rapp-portrait.jpg'
  },
  {
    name: 'Simon Müller',
    role: 'CTO',
    bio: 'Simon bringt über 10 Jahre Erfahrung in der Entwicklung sozialer Plattformen mit und leitet die technische Umsetzung unserer Vision.',
    image: '/images/about/simon mueller portrait.png'
  }
];

// Testimonials
const testimonials = [
  {
    quote: "Durch contact-tables habe ich nicht nur fantastische Restaurants entdeckt, sondern auch Freunde fürs Leben gefunden.",
    author: "Michael, 34, Berlin",
    image: "/images/testimonials/testimonial-1.jpg"
  },
  {
    quote: "Als ich in eine neue Stadt gezogen bin, waren die Kontakttische mein Weg, Menschen kennenzulernen. Heute treffe ich mich regelmäßig mit meiner Tischgruppe.",
    author: "Sophia, 29, München",
    image: "/images/testimonials/testimonial-2.jpg"
  },
  {
    quote: "Als Restaurant-Partner schätzen wir die zusätzlichen Gäste, aber noch mehr die besondere Atmosphäre, die contact-tables in unser Lokal bringt.",
    author: "Restaurant Olivia, Hamburg",
    image: "/images/testimonials/testimonial-3.jpg"
  }
];

// Meilensteine
const milestones = [
  {
    year: "2024",
    title: "Die Idee entsteht",
    description: "Aus dem Wunsch, Menschen in bereichernden Begegnungen an einen Tisch zu bringen, wird die Vision von contact-tables geboren."
  },
  {
    year: "Frühjahr/Sommer 2025",
    title: "Entwicklung & Planung",
    description: "Ein engagiertes Team entwickelt die Plattform und bereitet den Start vor, um den perfekten Rahmen für unsere Community zu schaffen."
  },
  {
    year: "Herbst 2025",
    title: "Offizieller Launch",
    description: "contact-tables geht online! Wir starten unsere Mission, echte Verbindungen in Restaurants zu schaffen."
  },
  {
    year: "Zukunft",
    title: "Unsere Vision",
    description: "Wir wachsen weiter, um in ganz Deutschland, schließlich auch europaweit und hoffentlich auch weltweit Menschen zusammenzubringen und die Vielfalt der lokalen Gastronomie zu fördern."
  }
];

// Glassmorphismus-Stil für Karten
const glassmorphismStyle = {
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  background: 'rgba(255, 255, 255, 0.25)',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.18)'
};

export default function AboutPage() {
  
  return (
    <PageLayout>
      
      {/* Hero Section mit verbessertem Inhalt */}
      <div className="text-white py-24 -mt-8 rounded-b-3xl relative overflow-hidden">
        {/* Hintergrundbild */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/about/ueber-uns-hero.webp" 
            alt="Menschen am Tisch von oben" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white opacity-70"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-lg border border-white/40"
            style={glassmorphismStyle}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6"
            >
              Gemeinsam am Tisch
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight text-gray-800">
              Unsere Vision:<br />
              <span className="text-gray-800">Echte Verbindungen</span><br />
              am Tisch
            </h1>
            
            <p className="text-xl text-gray-800 leading-relaxed mb-8 max-w-3xl mx-auto">
              Wir glauben daran, dass gemeinsames Essen Menschen auf natürliche Weise verbindet. contact-tables bietet eine Plattform für Begegnungen, die Menschen zusammenbringt – an Tischen, an denen man sich sonst vielleicht nie begegnet&nbsp;wäre.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 text-center w-64"
                style={glassmorphismStyle}
              >
                <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="text-3xl text-gray-800" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Menschen verbinden</h3>
                <p className="text-gray-800">Wir schaffen Räume für echte Begegnungen und neue Freundschaften.</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 text-center w-64"
                style={glassmorphismStyle}
              >
                <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCoffee className="text-3xl text-gray-800" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Lokale Gastronomie stärken</h3>
                <p className="text-gray-800">Wir unterstützen Restaurants und fördern eine lebendige lokale Esskultur.</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 text-center w-64"
                style={glassmorphismStyle}
              >
                <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="text-3xl text-gray-800" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Gespräche fördern</h3>
                <p className="text-gray-800">Wir bringen Menschen ins Gespräch und schaffen Raum für Austausch und Verständnis.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Team Section - Verbessert und zentriert */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6"
              >
                Unser Team
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold mb-6 text-gray-900"
              >
                Die Menschen hinter contact-tables
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                Wir sind ein motiviertes Team, das die Vision teilt, Menschen durch gemeinsames Essen in echten Begegnungen zusammenzubringen.
              </motion.p>
            </div>
            
            {/* Zentrierte Team-Mitglieder */}
            <div className="flex justify-center">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
                  >
                    <div className="relative w-full h-80">
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name} 
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                          <span className="text-neutral-600 font-medium">Bild folgt</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 text-center flex flex-col flex-grow">
                      <h3 className="text-2xl font-bold text-gray-900">{member.name}</h3>
                      <p className="text-primary-600 font-semibold mb-4">{member.role}</p>
                      <div className="text-gray-600 text-left text-sm space-y-3">
                        <p>{member.bio}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Unsere Geschichte */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-6 text-secondary-800">Unsere Geschichte</h2>
                <div className="prose prose-lg">
                  <p>
                  Contact-tables entstand 2024 aus einer persönlichen Erfahrung, die unsere Gründerin auf ihren Van-Reisen in Griechenland und Portugal machte. 
                  Inmitten der vielen Begegnungen und Eindrücke auf ihrer Reise, entdeckte sie immer wieder die Kraft echter Verbindungen und die Freude, neue Menschen in entspannter Atmosphäre 
                  kennenzulernen – besonders bei einem gemeinsamen Mahl.
                  </p>
                  <p>
                  Diese Erlebnisse führten zu einer Art Eingebung, aus der die Idee für contact-tables entstand: 
                  eine Plattform, die es Menschen ermöglicht, sich bei einer Mahlzeit zu verbinden und authentische Gespräche zu führen – 
                  abseits von Bildschirmen und digitalen Ablenkungen.
                  </p>
                  <p>
                  Mit dem Start im Jahr 2025 möchten wir Menschen in ganz Deutschland zusammenbringen, in Restaurants, die den Raum für echte Begegnungen bieten. 
                  Wir arbeiten eng mit unseren Partnerrestaurants zusammen, um nicht nur soziale Verbindungen zu schaffen, sondern auch neue kulinarische Erlebnisse zu teilen und zu genießen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="shadow-xl"
              >
                <div className="relative aspect-square w-full max-w-md max-h-96 mx-auto rounded-xl overflow-hidden">
                  <img 
                    src="/images/about/ueber-uns-geschichte.webp" 
                    alt="Menschen, die an einem Tisch sitzen und gemeinsam essen" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white font-medium">Gemeinsam am Tisch – unsere Vision für die Zukunft.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Meilensteine */}
      <div className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-secondary-800">Unsere Meilensteine</h2>
          
          <div className="max-w-4xl mx-auto relative">
            {/* Verbindungslinie */}
                        <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 md:-translate-x-1/2 z-0"></div>
            
            {/* Meilensteine */}
            {milestones.map((milestone, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                                className={`relative z-10 flex items-start mb-12 flex-row md:${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                                <div className={`w-full md:w-1/2 pl-12 md:${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                  <div className={`bg-white p-6 rounded-xl shadow-md md:${index % 2 === 0 ? 'ml-auto' : 'mr-auto'} max-w-xs`}>
                    <span className="text-primary-600 font-bold">{milestone.year}</span>
                    <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
                
                                <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary-500 border-4 border-white flex items-center justify-center">
                  <FiCalendar className="text-white" />
                </div>
                
                                <div className="hidden md:block w-1/2"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Values Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-secondary-800">Unsere Werte</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-md p-8 text-center transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6" data-component-name="AboutPage">
                  <FiUsers className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Wahrhaftigkeit</h3>
                <p className="text-gray-600">
                  Wir schaffen Räume für echte Begegnungen und inspirierende Gespräche.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-8 text-center transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiUsers className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Gemeinschaft</h3>
                <p className="text-gray-600" data-component-name="AboutPage">
                  Wir schaffen eine einladende Community, in der sich jeder willkommen und wertgeschätzt fühlt, unabhängig von Alter, Herkunft oder Lebensstil.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-md p-8 text-center transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiSmile className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Freude</h3>
                <p className="text-gray-600" data-component-name="AboutPage">
                  Wir glauben, dass gemeinsames Essen eine der schönsten Formen des sozialen Miteinanders ist. Contact-tables sollen vor allem eines sein: eine freudvolle Erfahrung für alle Beteiligten.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>




      
      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white" data-component-name="AboutPage">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Werde Teil unserer Mission</h2>
            <p className="text-xl mb-10 text-white/80" data-component-name="AboutPage">
              Ob als Gast am contact-table, als Restaurant-Partner oder als Teil unseres Teams – hilf uns
              dabei, Menschen zusammenzubringen und eine starke Gemeinschaft aufzubauen!
            </p>
            <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
              <Link href="/restaurants" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                <FiMapPin />
                <span>Restaurants entdecken</span>
              </Link>
              <Link href="/contact-tables" className="bg-white hover:bg-neutral-100 text-secondary-800 px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                <FiUsers />
                <span>Kontakttische finden</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
