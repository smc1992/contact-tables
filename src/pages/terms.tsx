import { motion } from 'framer-motion';
import { FiFileText, FiUsers, FiShield, FiAlertTriangle, FiCreditCard, FiLock } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import Link from 'next/link';

export default function TermsPage() {
  // Animation-Varianten
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-secondary-800 text-white py-20 -mt-8 rounded-b-3xl">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nutzungsbedingungen
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Bitte lies dir diese Nutzungsbedingungen sorgfältig durch, bevor du unsere Dienste nutzt.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Hauptinhalt */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-xl shadow-md p-8 mb-8"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiFileText className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Allgemeine Bestimmungen</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Die Contact Tables GmbH (nachfolgend "wir", "uns" oder "Contact Tables") betreibt die Website contact-tables.de 
                  sowie die zugehörige Plattform (nachfolgend gemeinsam als "Dienst" bezeichnet). Diese Nutzungsbedingungen regeln 
                  die Nutzung unseres Dienstes.
                </p>
                <p className="text-gray-700 mb-4">
                  Durch die Nutzung unseres Dienstes akzeptierst du diese Bedingungen. Bitte lies sie sorgfältig durch. 
                  Wenn du mit diesen Bedingungen nicht einverstanden bist, darfst du unseren Dienst nicht nutzen.
                </p>
                <div className="bg-neutral-50 p-4 rounded-lg mt-4">
                  <p className="font-medium">Contact Tables GmbH</p>
                  <p>Musterstraße 123</p>
                  <p>10115 Berlin</p>
                                    <p>E-Mail: <a href="mailto:info@contact-tables.org" className="text-primary-600 hover:underline">info@contact-tables.org</a></p>
                  <p>Telefon: +49 30 123 456 789</p>
                  <p>Handelsregister: Amtsgericht Berlin-Charlottenburg, HRB 123456</p>
                  <p>Umsatzsteuer-ID: DE123456789</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiUsers className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Nutzerkonto</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Für die Nutzung bestimmter Funktionen unseres Dienstes ist die Erstellung eines Nutzerkontos erforderlich. 
                  Du bist dafür verantwortlich, die Vertraulichkeit deines Kontos und Passworts zu wahren und den Zugriff auf 
                  dein Gerät zu beschränken.
                </p>
                <p className="text-gray-700 mb-4">
                  Du stimmst zu, dass du für alle Aktivitäten verantwortlich bist, die unter deinem Konto stattfinden. 
                  Wenn du Kenntnis von einer unbefugten Nutzung deines Kontos erlangst, musst du uns unverzüglich benachrichtigen.
                </p>
                <p className="text-gray-700 mb-4">
                  Bei der Registrierung musst du vollständige und korrekte Informationen angeben. Du darfst kein Konto unter 
                  der Identität einer anderen Person erstellen oder ein Konto ohne Erlaubnis im Namen einer anderen Person nutzen.
                </p>
                <p className="text-gray-700">
                  Wir behalten uns das Recht vor, Konten zu löschen oder zu sperren, wenn gegen diese Nutzungsbedingungen verstoßen wird.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiShield className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Nutzungsregeln</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Bei der Nutzung unseres Dienstes verpflichtest du dich, folgende Regeln einzuhalten:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Du wirst keine Inhalte veröffentlichen, die rechtswidrig, beleidigend, bedrohend, missbräuchlich, belästigend, diffamierend, vulgär, obszön, hasserfüllt oder anderweitig anstößig sind.</li>
                  <li>Du wirst keine Inhalte veröffentlichen, die die Rechte Dritter verletzen, einschließlich Urheberrechte, Markenrechte oder andere Eigentumsrechte.</li>
                  <li>Du wirst unseren Dienst nicht für illegale Zwecke oder zur Förderung illegaler Aktivitäten nutzen.</li>
                  <li>Du wirst keine Viren, Malware oder andere schädliche Codes verbreiten.</li>
                  <li>Du wirst keine Massenmails, Spam oder andere unerwünschte Werbung versenden.</li>
                  <li>Du wirst keine Daten anderer Nutzer ohne deren ausdrückliche Zustimmung sammeln oder speichern.</li>
                  <li>Du wirst dich nicht als eine andere Person ausgeben oder falsche Angaben zu deiner Identität machen.</li>
                  <li>Du wirst keine Handlungen vornehmen, die die Infrastruktur unseres Dienstes übermäßig belasten könnten.</li>
                </ul>
                
                <p className="text-gray-700">
                  Bei Verstößen gegen diese Regeln behalten wir uns das Recht vor, dein Konto zu sperren oder zu löschen und 
                  dir den Zugang zu unserem Dienst zu verweigern.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiCreditCard className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Zahlungen und Abonnements</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Einige Teile unseres Dienstes sind kostenpflichtig. Wenn du ein kostenpflichtiges Abonnement abschließt, 
                  stimmst du zu, uns die angegebenen Gebühren zu zahlen.
                </p>
                <p className="text-gray-700 mb-4">
                  Für Restaurants gelten besondere Preismodelle, die auf unserer Website unter dem Bereich "Restaurant-Partner" 
                  eingesehen werden können. Die Zahlungsbedingungen für Restaurants werden im Rahmen des Partnervertrags festgelegt.
                </p>
                <p className="text-gray-700 mb-4">
                  Alle Zahlungen sind im Voraus zu leisten und nicht erstattungsfähig, es sei denn, dies ist gesetzlich vorgeschrieben 
                  oder in diesen Nutzungsbedingungen anders angegeben.
                </p>
                <p className="text-gray-700">
                  Wir behalten uns das Recht vor, unsere Preise jederzeit zu ändern. Preisänderungen werden mindestens 30 Tage 
                  vor ihrem Inkrafttreten angekündigt.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiAlertTriangle className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Haftungsausschluss</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Contact Tables ist eine Vermittlungsplattform, die Menschen an Restauranttischen zusammenbringt. Wir sind nicht 
                  verantwortlich für:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                  <li>Die Qualität, Sicherheit oder Rechtmäßigkeit der angebotenen Dienstleistungen der Restaurants</li>
                  <li>Die Richtigkeit der von Restaurants oder Nutzern bereitgestellten Informationen</li>
                  <li>Das Verhalten der Teilnehmer an Kontakttischen</li>
                  <li>Störungen oder Unterbrechungen des Dienstes</li>
                  <li>Verluste oder Schäden, die durch die Nutzung unseres Dienstes entstehen</li>
                </ul>
                
                <p className="text-gray-700 mb-4">
                  Unser Dienst wird "wie besehen" und "wie verfügbar" ohne jegliche ausdrückliche oder stillschweigende Garantie 
                  bereitgestellt, einschließlich, aber nicht beschränkt auf die stillschweigenden Garantien der Marktgängigkeit, 
                  Eignung für einen bestimmten Zweck und Nichtverletzung.
                </p>
                
                <p className="text-gray-700">
                  In keinem Fall haften wir für indirekte, zufällige, besondere, Folge- oder Strafschäden, einschließlich 
                  entgangener Gewinne, die aus deiner Nutzung oder Unfähigkeit zur Nutzung des Dienstes entstehen.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiLock className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Geistiges Eigentum</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Der Dienst und seine ursprünglichen Inhalte, Funktionen und Funktionalität sind und bleiben das ausschließliche 
                  Eigentum von Contact Tables und seinen Lizenzgebern. Der Dienst ist durch Urheberrecht, Markenrecht und andere 
                  Gesetze in Deutschland und anderen Ländern geschützt.
                </p>
                <p className="text-gray-700 mb-4">
                  Unsere Marken und Handelsaufmachung dürfen nicht in Verbindung mit einem Produkt oder einer Dienstleistung 
                  ohne vorherige schriftliche Zustimmung von Contact Tables verwendet werden.
                </p>
                <p className="text-gray-700">
                  Inhalte, die du über unseren Dienst veröffentlichst, bleiben dein Eigentum. Durch das Veröffentlichen von 
                  Inhalten gewährst du uns jedoch eine weltweite, nicht-exklusive, gebührenfreie Lizenz (mit dem Recht zur 
                  Unterlizenzierung), diese Inhalte zu nutzen, zu reproduzieren, zu verarbeiten, anzupassen, zu veröffentlichen, 
                  zu übertragen, anzuzeigen und zu verbreiten.
                </p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiFileText className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Schlussbestimmungen</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Wir behalten uns das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern oder zu ersetzen. Die aktualisierte 
                  Version wird auf dieser Seite veröffentlicht. Es liegt in deiner Verantwortung, diese Nutzungsbedingungen regelmäßig 
                  auf Änderungen zu überprüfen.
                </p>
                <p className="text-gray-700 mb-4">
                  Deine fortgesetzte Nutzung des Dienstes nach der Veröffentlichung von geänderten Bedingungen bedeutet, dass du 
                  die Änderungen akzeptierst und an sie gebunden bist.
                </p>
                <p className="text-gray-700 mb-4">
                  Sollte eine Bestimmung dieser Nutzungsbedingungen für ungültig oder nicht durchsetzbar erklärt werden, wird 
                  diese Bestimmung nur im erforderlichen Mindestmaß eingeschränkt oder aufgehoben, und die übrigen Bestimmungen 
                  dieser Nutzungsbedingungen bleiben vollständig in Kraft.
                </p>
                <p className="text-gray-700 mb-4">
                  Diese Nutzungsbedingungen stellen die gesamte Vereinbarung zwischen dir und Contact Tables in Bezug auf unseren 
                  Dienst dar und ersetzen alle früheren Vereinbarungen, die wir in Bezug auf den Dienst hatten.
                </p>
                <p className="text-gray-700">
                  Diese Nutzungsbedingungen unterliegen den Gesetzen der Bundesrepublik Deutschland. Für alle Streitigkeiten aus 
                  oder im Zusammenhang mit diesen Nutzungsbedingungen sind die Gerichte in Berlin zuständig, soweit keine 
                  zwingenden gesetzlichen Bestimmungen entgegenstehen.
                </p>
              </motion.div>
            </motion.div>
            
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                Letzte Aktualisierung dieser Nutzungsbedingungen: Mai 2025
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/privacy" className="inline-flex items-center justify-center px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-secondary-800 rounded-lg font-medium transition-colors">
                  <FiShield className="mr-2" />
                  Datenschutzerklärung
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                  <FiUsers className="mr-2" />
                  Kontakt aufnehmen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
