import { motion } from 'framer-motion';
import { FiUsers, FiHeart, FiSmile, FiCoffee, FiMessageCircle, FiStar, FiMapPin, FiCalendar } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import Image from 'next/image';
import Link from 'next/link';

// Team-Mitglieder
const teamMembers = [
  {
    name: 'Anna Schmidt',
    role: 'Gründerin & CEO',
    bio: 'Anna hat Contact Tables aus ihrer eigenen Erfahrung mit Einsamkeit in der Großstadt gegründet. Mit Hintergrund in Gastronomie und Technologie verbindet sie beide Welten.',
    image: '/images/team/team-1.jpg'
  },
  {
    name: 'Markus Weber',
    role: 'CTO',
    bio: 'Markus bringt über 10 Jahre Erfahrung in der Entwicklung sozialer Plattformen mit und leitet die technische Umsetzung unserer Vision.',
    image: '/images/team/team-2.jpg'
  },
  {
    name: 'Laura Müller',
    role: 'Restaurant-Partnerschaften',
    bio: 'Mit ihrer Erfahrung als Restaurant-Managerin knüpft Laura wertvolle Partnerschaften mit Restaurants in ganz Deutschland.',
    image: '/images/team/team-3.jpg'
  },
  {
    name: 'Thomas Becker',
    role: 'Community Manager',
    bio: 'Thomas sorgt dafür, dass sich alle an unseren Tischen wohlfühlen und moderiert die wachsende Contact Tables-Community.',
    image: '/images/team/team-4.jpg'
  }
];

// Testimonials
const testimonials = [
  {
    quote: "Durch Contact Tables habe ich nicht nur fantastische Restaurants entdeckt, sondern auch Freunde fürs Leben gefunden.",
    author: "Michael, 34, Berlin",
    image: "/images/testimonials/testimonial-1.jpg"
  },
  {
    quote: "Als ich in eine neue Stadt gezogen bin, waren die Kontakttische mein Weg, Menschen kennenzulernen. Heute treffe ich mich regelmäßig mit meiner Tischgruppe.",
    author: "Sophia, 29, München",
    image: "/images/testimonials/testimonial-2.jpg"
  },
  {
    quote: "Als Restaurant-Partner schätzen wir die zusätzlichen Gäste, aber noch mehr die besondere Atmosphäre, die Contact Tables in unser Lokal bringt.",
    author: "Restaurant Olivia, Hamburg",
    image: "/images/testimonials/testimonial-3.jpg"
  }
];

// Meilensteine
const milestones = [
  {
    year: "2024",
    title: "Die Idee entsteht",
    description: "Aus dem Wunsch, Menschen wieder an einen Tisch zu bringen und Einsamkeit zu überwinden, wird die Vision von Contact Tables geboren."
  },
  {
    year: "2024",
    title: "Entwicklung & Planung",
    description: "Ein engagiertes Team entwickelt die Plattform und bereitet den Start vor, um die bestmögliche Erfahrung zu schaffen."
  },
  {
    year: "2025",
    title: "Offizieller Launch",
    description: "Contact Tables geht online! Wir starten unsere Mission, echte Verbindungen in Restaurants zu schaffen."
  },
  {
    year: "Zukunft",
    title: "Unsere Vision",
    description: "Wir wachsen weiter, um in ganz Deutschland Menschen zusammenzubringen und die lokale Gastronomie zu beleben."
  }
];

export default function AboutPage() {
  return (
    <PageLayout>
      
      {/* Hero Section mit verbessertem Inhalt */}
      <div className="bg-primary-900 text-white py-24 -mt-8 rounded-b-3xl relative overflow-hidden">
        {/* Hintergrund-Elemente für mehr visuelle Tiefe */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-400"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-primary-600"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6"
            >
              Gemeinsam statt einsam
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Unsere Mission: <span className="text-primary-300">Echte Verbindungen</span> am Restauranttisch schaffen
            </h1>
            
            <p className="text-xl text-white/90 leading-relaxed mb-8 max-w-3xl mx-auto">
              Wir glauben daran, dass gemeinsames Essen Menschen verbindet und Einsamkeit überwindet.
              Contact Tables schafft authentische Begegnungen am Restauranttisch und baut Brücken zwischen Menschen,
              die sonst vielleicht nie zusammengekommen wären.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-center w-64"
              >
                <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiHeart className="text-3xl text-primary-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Einsamkeit bekämpfen</h3>
                <p className="text-white/80">Wir schaffen Räume für echte Begegnungen in einer zunehmend isolierten Welt.</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-center w-64"
              >
                <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCoffee className="text-3xl text-primary-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Lokale Gastronomie stärken</h3>
                <p className="text-white/80">Wir unterstützen Restaurants und fördern eine lebendige lokale Esskultur.</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-center w-64"
              >
                <div className="bg-primary-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="text-3xl text-primary-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gespräche fördern</h3>
                <p className="text-white/80">Wir bringen Menschen ins Gespräch und schaffen Raum für Austausch und Verständnis.</p>
              </motion.div>
            </div>
          </motion.div>
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
                    Contact Tables entstand 2024 aus einer einfachen Beobachtung: In einer Zeit, in der wir digital 
                    so vernetzt sind wie nie zuvor, fühlen sich viele Menschen im echten Leben einsam. 
                    Besonders beim Essen – einer Aktivität, die traditionell Menschen zusammenbringt.
                  </p>
                  <p>
                    Unsere Gründerin Anna Schmidt erlebte selbst, wie schwierig es sein kann, in einer neuen Stadt 
                    Anschluss zu finden. Aus dieser persönlichen Erfahrung entwickelte sie die Idee für eine Plattform, 
                    die Menschen am Restauranttisch zusammenbringt – für echte Gespräche statt Smartphone-Scrollen.
                  </p>
                  <p>
                    Mit unserem Launch 2025 wollen wir Menschen in Restaurants in ganz Deutschland verbinden und 
                    eng mit unseren Partnerrestaurants zusammenarbeiten, um nicht nur soziale Verbindungen zu schaffen, 
                    sondern auch kulinarische Entdeckungen zu ermöglichen.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative rounded-xl overflow-hidden shadow-xl"
              >
                <div className="aspect-w-4 aspect-h-3 bg-neutral-200">
                  <img 
                    src="/images/about/story.jpg" 
                    alt="Menschen am Restauranttisch" 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white font-medium">Gemeinsam am Tisch – unsere Vision für die Zukunft.</p>
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
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 -translate-x-1/2 z-0"></div>
            
            {/* Meilensteine */}
            {milestones.map((milestone, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative z-10 flex items-start mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12'}`}>
                  <div className={`bg-white p-6 rounded-xl shadow-md ${index % 2 === 0 ? 'ml-auto' : 'mr-auto'} max-w-xs`}>
                    <span className="text-primary-600 font-bold">{milestone.year}</span>
                    <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </div>
                </div>
                
                <div className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary-500 border-4 border-white flex items-center justify-center">
                  <FiCalendar className="text-white" />
                </div>
                
                <div className="w-1/2"></div>
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
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiHeart className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Authentizität</h3>
                <p className="text-gray-600">
                  Wir fördern echte Verbindungen zwischen Menschen, die ihre Leidenschaft fürs Essen teilen. Bei uns gibt es keine Algorithmen, sondern echte Begegnungen am Tisch.
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
                <p className="text-gray-600">
                  Wir schaffen eine inklusive Community, in der sich jeder willkommen und wertgeschätzt fühlt, unabhängig von Alter, Herkunft oder Lebensstil. Vielfalt bereichert unsere Tische.
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
                <p className="text-gray-600">
                  Wir glauben, dass gemeinsames Essen eine der schönsten Formen des sozialen Miteinanders ist. Unsere Kontakttische sollen vor allem eines sein: eine freudvolle Erfahrung für alle Beteiligten.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-primary-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-secondary-800">Was unsere Community sagt</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="h-48 bg-neutral-200 relative">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="text-primary-500 w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="italic text-gray-700 mb-4">"{testimonial.quote}"</p>
                  <p className="font-semibold text-secondary-800">{testimonial.author}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-6 text-secondary-800">Unser Team</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wir sind ein engagiertes Team aus Foodies und Tech-Enthusiasten, vereint durch die Vision,
                Menschen durch gemeinsames Essen zusammenzubringen.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="h-64 bg-neutral-200 relative">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                onClick={() => window.location.href = '/careers'}
              >
                Karriere bei Contact Tables
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-20 bg-secondary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Werde Teil unserer Mission</h2>
            <p className="text-xl mb-10 text-white/80">
              Ob als Gast an einem Kontakttisch, als Restaurant-Partner oder als Teil unseres Teams – 
              hilf uns dabei, Menschen zusammenzubringen und Einsamkeit zu bekämpfen.
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