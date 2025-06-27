import { motion } from 'framer-motion';
import { FiShield, FiUser, FiDatabase, FiCookie, FiMail, FiAlertCircle } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import Link from 'next/link';

export default function PrivacyPage() {
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
              Datenschutzerklärung
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Wir nehmen den Schutz deiner persönlichen Daten sehr ernst. Hier erfährst du, 
              wie wir mit deinen Daten umgehen und welche Rechte du hast.
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
                    <FiShield className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Überblick</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Diese Datenschutzerklärung informiert dich über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten 
                  auf unserer Webseite Contact Tables. Personenbezogene Daten sind alle Daten, die auf dich persönlich beziehbar sind.
                </p>
                <p className="text-gray-700">
                  Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="bg-neutral-50 p-4 rounded-lg mt-4">
                  <p className="font-medium">Contact Tables GmbH</p>
                  <p>Musterstraße 123</p>
                  <p>10115 Berlin</p>
                  <p>E-Mail: datenschutz@contact-tables.de</p>
                  <p>Telefon: +49 30 123 456 789</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiUser className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Erhebung und Verarbeitung personenbezogener Daten</h2>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-secondary-700">Welche Daten wir erheben</h3>
                <p className="text-gray-700 mb-4">
                  Wir erheben und verarbeiten folgende personenbezogene Daten:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                  <li>Bestandsdaten (z.B. Namen, Adressen)</li>
                  <li>Kontaktdaten (z.B. E-Mail, Telefonnummern)</li>
                  <li>Inhaltsdaten (z.B. Texteingaben, Fotografien, Videos)</li>
                  <li>Nutzungsdaten (z.B. besuchte Webseiten, Interesse an Inhalten, Zugriffszeiten)</li>
                  <li>Meta-/Kommunikationsdaten (z.B. Geräte-Informationen, IP-Adressen)</li>
                  <li>Bei Anmeldung: Benutzername und Passwort (verschlüsselt)</li>
                  <li>Bei Teilnahme an Kontakttischen: Präferenzen und Interessen</li>
                </ul>
                
                <h3 className="text-xl font-semibold mb-3 text-secondary-700">Zwecke der Verarbeitung</h3>
                <p className="text-gray-700 mb-4">
                  Wir verarbeiten deine personenbezogenen Daten für folgende Zwecke:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Bereitstellung unserer Website und ihrer Funktionen</li>
                  <li>Beantwortung von Kontaktanfragen und Kommunikation mit Nutzern</li>
                  <li>Ermöglichung der Teilnahme an Kontakttischen</li>
                  <li>Sicherheitsmaßnahmen</li>
                  <li>Reichweitenmessung und Marketing</li>
                </ul>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiDatabase className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Rechtsgrundlagen</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Die Verarbeitung deiner Daten erfolgt auf Grundlage folgender Rechtsgrundlagen:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><span className="font-medium">Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</span> Du hast uns deine Einwilligung zur Verarbeitung für bestimmte Zwecke gegeben.</li>
                  <li><span className="font-medium">Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</span> Die Verarbeitung ist für die Erfüllung eines Vertrags mit dir erforderlich.</li>
                  <li><span className="font-medium">Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</span> Die Verarbeitung ist zur Erfüllung einer rechtlichen Verpflichtung erforderlich.</li>
                  <li><span className="font-medium">Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO):</span> Die Verarbeitung ist zur Wahrung berechtigter Interessen erforderlich.</li>
                </ul>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiCookie className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Cookies und Analysedienste</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf deinem Endgerät gespeichert werden. 
                  Sie richten keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, 
                  effektiver und sicherer zu machen.
                </p>
                <p className="text-gray-700 mb-4">
                  Wir setzen folgende Arten von Cookies ein:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                  <li><span className="font-medium">Notwendige Cookies:</span> Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden.</li>
                  <li><span className="font-medium">Funktionale Cookies:</span> Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung.</li>
                  <li><span className="font-medium">Analyse-Cookies:</span> Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.</li>
                  <li><span className="font-medium">Marketing-Cookies:</span> Diese Cookies werden verwendet, um Besuchern auf Websites zu folgen.</li>
                </ul>
                
                <p className="text-gray-700 mb-4">
                  Du kannst deinen Browser so einstellen, dass du über das Setzen von Cookies informiert wirst und Cookies nur im Einzelfall 
                  erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies 
                  beim Schließen des Browsers aktivieren.
                </p>
                
                <h3 className="text-xl font-semibold mb-3 text-secondary-700">Analysedienste</h3>
                <p className="text-gray-700">
                  Wir nutzen den Analysedienst Google Analytics, um die Nutzung unserer Website zu analysieren und regelmäßig zu verbessern. 
                  Über die gewonnenen Statistiken können wir unser Angebot verbessern und für dich als Nutzer interessanter gestalten.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiMail className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Weitergabe von Daten</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Eine Übermittlung deiner persönlichen Daten an Dritte zu anderen als den im Folgenden aufgeführten Zwecken findet nicht statt.
                </p>
                <p className="text-gray-700 mb-4">
                  Wir geben deine persönlichen Daten nur an Dritte weiter, wenn:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Du deine ausdrückliche Einwilligung dazu erteilt hast (Art. 6 Abs. 1 lit. a DSGVO)</li>
                  <li>Die Weitergabe zur Abwicklung von Vertragsverhältnissen mit dir erforderlich ist (Art. 6 Abs. 1 lit. b DSGVO)</li>
                  <li>Eine gesetzliche Verpflichtung zur Weitergabe besteht (Art. 6 Abs. 1 lit. c DSGVO)</li>
                  <li>Die Weitergabe zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich ist und kein Grund zur Annahme besteht, dass du ein überwiegendes schutzwürdiges Interesse an der Nichtweitergabe deiner Daten hast (Art. 6 Abs. 1 lit. f DSGVO)</li>
                </ul>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 p-3 rounded-full mr-4">
                    <FiAlertCircle className="text-primary-600 w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-800">Deine Rechte</h2>
                </div>
                <p className="text-gray-700 mb-4">
                  Du hast bezüglich deiner bei uns gespeicherten personenbezogenen Daten folgende Rechte:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                  <li><span className="font-medium">Recht auf Auskunft:</span> Du kannst jederzeit Auskunft darüber verlangen, welche Daten wir über dich gespeichert haben.</li>
                  <li><span className="font-medium">Recht auf Berichtigung:</span> Sollten die gespeicherten Daten fehlerhaft oder unvollständig sein, hast du das Recht auf Berichtigung.</li>
                  <li><span className="font-medium">Recht auf Löschung:</span> Du kannst die Löschung deiner personenbezogenen Daten verlangen.</li>
                  <li><span className="font-medium">Recht auf Einschränkung der Verarbeitung:</span> Du kannst unter bestimmten Voraussetzungen eine Einschränkung der Verarbeitung deiner Daten verlangen.</li>
                  <li><span className="font-medium">Recht auf Datenübertragbarkeit:</span> Du hast das Recht, deine Daten in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.</li>
                  <li><span className="font-medium">Widerspruchsrecht:</span> Du hast das Recht, jederzeit gegen die Verarbeitung deiner personenbezogenen Daten Widerspruch einzulegen.</li>
                  <li><span className="font-medium">Recht auf Widerruf der Einwilligung:</span> Du hast das Recht, eine erteilte Einwilligung jederzeit zu widerrufen.</li>
                </ul>
                
                <p className="text-gray-700 mb-4">
                  Wenn du glaubst, dass die Verarbeitung deiner Daten gegen das Datenschutzrecht verstößt oder deine datenschutzrechtlichen Ansprüche 
                  sonst in einer Weise verletzt worden sind, kannst du dich bei der zuständigen Aufsichtsbehörde beschweren.
                </p>
                
                <div className="bg-neutral-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-secondary-700">Kontakt</h3>
                  <p className="text-gray-700 mb-4">
                    Wenn du Fragen zum Datenschutz hast, schreibe uns bitte eine E-Mail oder wende dich direkt an die für den Datenschutz verantwortliche Person in unserer Organisation:
                  </p>
                  <p className="font-medium">Datenschutzbeauftragter</p>
                  <p>Contact Tables GmbH</p>
                  <p>Musterstraße 123</p>
                  <p>10115 Berlin</p>
                  <p>E-Mail: datenschutz@contact-tables.de</p>
                  <p>Telefon: +49 30 123 456 789</p>
                </div>
              </motion.div>
            </motion.div>
            
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                Letzte Aktualisierung dieser Datenschutzerklärung: Mai 2025
              </p>
              <Link href="/contact" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium">
                <FiMail className="mr-2" />
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
