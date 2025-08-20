import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiHelpCircle, FiUsers, FiMapPin, FiCalendar, FiClock, FiCreditCard, FiShield } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import Link from 'next/link';

// FAQ-Kategorien mit verbesserten Beschreibungen
const faqCategories = [
  {
    id: 'general',
    name: 'Allgemein',
    icon: <FiHelpCircle />,
    description: 'Grundlegende Informationen über contact-tables und unser Konzept'
  },
  {
    id: 'users',
    name: 'Für Gäste',
    icon: <FiUsers />,
    description: 'Alles, was du als Teilnehmer an contact-tables wissen musst'
  },
  {
    id: 'restaurants',
    name: 'Für Restaurants',
    icon: <FiMapPin />,
    description: 'Informationen für Gastronomiebetriebe, die teilnehmen möchten'
  },
  {
    id: 'booking',
    name: 'Reservierung',
    icon: <FiCalendar />,
    description: 'Fragen zur Buchung und Teilnahme an contact-tables'
  },
  {
    id: 'privacy',
    name: 'Datenschutz',
    icon: <FiShield />,
    description: 'Wie wir deine Daten schützen und verwenden'
  },
  {
    id: 'community',
    name: 'Community',
    icon: <FiUsers />,
    description: 'Unsere Gemeinschaft und wie du dich einbringen kannst'
  },
];

// FAQ-Fragen und Antworten mit erweiterten Inhalten
const faqItems = [
  {
    category: 'general',
    question: 'Was ist contact-tables?',
    answer: 'contact-tables ist eine Plattform, die Menschen an Tischen zusammenbringt, um neue Verbindungen zu schaffen und echte Gespräche zu fördern. Wir sind eine Vermittlungsplattform, bei der Nutzer nach Restaurants suchen können, die spezielle contact-tables anbieten, an denen man sich mit anderen Menschen treffen und austauschen kann.'
  },
  {
    category: 'general',
    question: 'Was ist ein "contact-table"?',
    answer: 'Ein contact-table ist ein spezieller Tisch in einem Restaurant – für Menschen, die allein essen gehen, aber offen für Gesellschaft und Gespräche sind. Hier darf man sich dazusetzen, austauschen, gemeinsam lachen oder einfach einen netten Abend in angenehmer Runde verbringen. Die Tische sind in den teilnehmenden Restaurants speziell gekennzeichnet.'
  },
  {
    category: 'general',
    question: 'Wie funktioniert contact-tables?',
    answer: 'Ganz einfach: 1. Such dir ein Restaurant aus, das bei contact-tables mitmacht – alle teilnehmenden Orte findest du auf unserer Website. 2. Schau in den Kalender, ob schon jemand für deine gewünschte Zeit eingetragen ist – oder trag dich selbst ein, damit andere sehen, dass jemand da ist. 3. Ruf kurz im Restaurant an und reserviere den contact-table. 4. So kann der Tisch auch wirklich für dich freigehalten werden – gerade am Anfang ist das für die Planung wichtig. 5. Geh zur vereinbarten Zeit ins Restaurant – dieser ist vor Ort gut gekennzeichnet. Setz dich dazu und schau, was sich ergibt... Es darf geplaudert, ausgetauscht, gelacht oder einfach nur gemeinsam gegessen werden.'
  },
  {
    category: 'users',
    question: 'Für wen ist contact-tables gedacht?',
    answer: 'Für alle, die offen für neue Begegnungen sind – ob auf Reisen, neu in der Stadt oder beruflich – und Lust haben, beim Essen mit jemandem ins Gespräch zu kommen – ganz spontan und unkompliziert! contact-tables ist für Menschen jeden Alters und jeder Herkunft geeignet, die Wert auf echte Gespräche und menschliche Verbindungen legen.'
  },
  {
    category: 'general',
    question: 'Wie finde ich contact-tables?',
    answer: 'Damit die Chancen auf echte Begegnungen steigen, findest du auf unserer Website zu jedem Restaurant einen Kalender. Dort kannst du eintragen, wann du planst, zum contact-table zu gehen – ganz anonym, ohne Angabe von Namen, Alter oder Geschlecht. So können andere sehen, dass jemand da sein wird, und sich dazusetzen oder sich ebenfalls eintragen. Du kannst auch unsere Suchfunktion nutzen, um Restaurants in deiner Nähe zu finden, die contact-tables anbieten.'
  },
  {
    category: 'general',
    question: 'Kostet die Nutzung von contact-tables etwas?',
    answer: 'Die Nutzung der contact-tables-Plattform ist für Gäste kostenlos. Du bezahlst lediglich dein Essen und Getränke direkt im Restaurant zu den üblichen Preisen. Für Restaurants bieten wir verschiedene Mitgliedschaftsmodelle an, damit sie Teil unseres Netzwerks werden können.'
  },
  {
    category: 'users',
    question: 'Wie melde ich mich für einen contact-table an?',
    answer: 'Du kannst auf unserer Website nach verfügbaren contact-tables suchen und dich mit deinem Konto für einen Platz anmelden. Nach der Anmeldung erhältst du eine Bestätigung per E-Mail mit allen Details zum Treffen. Du kannst auch spontan teilnehmen, wenn du ein Restaurant mit contact-table besuchst und siehst, dass dort Platz ist.'
  },
  {
    category: 'users',
    question: 'Was passiert, wenn ich einen contact-table nicht wahrnehmen kann?',
    answer: 'Bitte sage deinen Platz so früh wie möglich ab, damit andere Interessenten nachrücken können. In deinem Profil findest du unter "Meine Buchungen" die Option zur Stornierung. Eine Absage sollte spätestens 24 Stunden vor dem Termin erfolgen. Das ist wichtig, damit andere Teilnehmer planen können und die Restaurants eine zuverlässige Belegung haben.'
  },
  {
    category: 'users',
    question: 'Kann ich einen eigenen contact-table erstellen?',
    answer: 'Ja, du kannst selbst einen contact-table initiieren. Wähle dazu ein teilnehmendes Restaurant, einen Termin und die maximale Teilnehmerzahl. Du wirst dann zum Host dieses Tisches und kannst eine kurze Beschreibung hinzufügen, um was für Menschen du dich am Tisch freuen würdest. Als Host hast du keine besonderen Verpflichtungen, sondern bist einfach derjenige, der den Tisch ins Leben gerufen hat.'
  },
  {
    category: 'users',
    question: 'Gibt es Regeln für das Verhalten am contact-table?',
    answer: `Beim contact-table sind alle willkommen, die offen und respektvoll miteinander umgehen.
Grundsätzlich gelten hier die üblichen Umgangsformen, die Du auch bei einem normalen Restaurantbesuch kennst:
•	Respektiere die persönliche Grenze und den Raum der anderen – kein übergriffiges Verhalten.
•	Höre zu und sei offen für Gespräche, aber fühle Dich nicht verpflichtet, mehr zu tun, als Du möchtest.
•	Achte auf eine angenehme Lautstärke, damit alle Gäste im Restaurant sich wohlfühlen.
•	Sei freundlich und wertschätzend – so entsteht ein positives Miteinander für alle.
Wenn sich jemand unwohl fühlt oder es Probleme gibt, ist es völlig in Ordnung, den contact-table zu verlassen oder das Servicepersonal anzusprechen.`
  },
  {
    category: 'users',
    question: 'Wie erkenne ich, ob ein Restaurant einen contact-table anbietet?',
    answer: 'Alle teilnehmenden Restaurants sind auf unserer Website gelistet – mit Infos, wann und wie der contact-table verfügbar ist. Vor Ort ist der Tisch meist gut sichtbar gekennzeichnet, z. B. mit einem kleinen Aufsteller oder einem Schild. Im Zweifel frag einfach das Servicepersonal.'
  },
  {
    category: 'users',
    question: 'Wie erkenne ich den contact-table vor Ort?',
    answer: 'Längerfristig ist geplant, dass die contact-tables in den teilnehmenden Restaurants besonders gekennzeichnet werden – z. B. mit einem kleinen Schild oder Aufsteller. Am besten aber einfach beim Servicepersonal nachfragen.'
  },

  {
    category: 'users',
    question: 'Wichtiger Hinweis zur Reservierung',
    answer: 'Bitte reserviere den contact-table zusätzlich telefonisch im Restaurant, damit der Tisch für dich freigehalten wird – gerade am Anfang hilft das allen Beteiligten sehr. Du kannst natürlich auch einfach spontan vorbeischauen – beide Wege sind möglich.'
  },
  {
    category: 'users',
    question: 'Muss ich bezahlen, um contact-tables zu nutzen?',
    answer: 'Für dich als Nutzer*in ist die Teilnahme an den contact-tables komplett kostenlos – das Angebot lebt von einer wachsenden Community, die sich gegenseitig unterstützt und verbindet. Die teilnehmenden Restaurants zahlen einen kleinen Beitrag, um mitzumachen, weil sie dadurch nicht nur Gäste gewinnen, sondern auch ihre Offenheit und Gastfreundschaft zeigen können. In Zukunft ist es möglich, dass wir zusätzliche Funktionen anbieten, die kostenpflichtig sind – aber die Basisnutzung bleibt für alle frei und zugänglich.'
  },
  {
    category: 'users',
    question: 'Was, wenn ich dort sitze und niemand kommt?',
    answer: 'Das kann passieren – gerade in der Startphase der Contact-tables, wenn die Idee noch dabei ist, richtig bekannt zu werden. Wir hoffen natürlich, dass immer jemand vorbeischaut. Vielleicht ergibt sich trotzdem ein schöner Austausch mit dem Personal oder Du genießt einfach den Moment mit Dir selbst. Je mehr Menschen von Contact-tables erfahren und mitmachen, desto lebendiger und schöner werden die Tische – also erzähl\'s gerne weiter!'
  },
  {
    category: 'users',
    question: 'Wie viele Menschen sitzen an einem contact-table?',
    answer: 'Das kann ganz unterschiedlich sein – gerade in der Startphase können wir das noch nicht genau vorhersagen. Manchmal sind es nur zwei Personen, manchmal können es auch sechs oder mehr werden. Der contact-table ist offen für alle, die gerne Kontakte knüpfen möchten – deshalb ist die Gruppengröße flexibel und richtet sich danach, wer gerade da ist und Lust auf Austausch hat. So bleibt es immer eine schöne Mischung aus kleinen und größeren Gesprächen.'
  },
  {
    category: 'users',
    question: 'Ich bin schüchtern – wie läuft das mit dem ersten Gespräch?',
    answer: 'Keine Sorge – vielen geht es so. Am contact-table ist jeder willkommen, so wie er ist. Du musst nichts leisten oder besonders unterhaltsam sein. Oft ergibt sich das Gespräch ganz von allein. Ein einfaches „Hi, darf ich mich dazusetzen?“ ist meistens der perfekte Anfang.'
  },
  {
    category: 'users',
    question: 'Was ist, wenn ich mich am Tisch unwohl fühle?',
    answer: 'Du darfst jederzeit gehen. Niemand ist verpflichtet zu bleiben. Wenn es ein größeres Problem gibt, sprich das Personal an oder melde es uns im Nachgang.'
  },
  {
    category: 'users',
    question: 'Übernimmt contact-tables eine Haftung für die Treffen am contact-table?',
    answer: 'contact-tables stellt die Plattform und die Möglichkeit für Begegnungen in Restaurants zur Verfügung, übernimmt jedoch keine Haftung für die Interaktionen zwischen den Teilnehmern. Wir empfehlen allen Nutzern, die üblichen Vorsichtsmaßnahmen zu treffen, wie sie auch bei anderen sozialen Aktivitäten angebracht sind.'
  },
  {
    category: 'restaurants',
    question: 'Wie kann mein Restaurant teilnehmen?',
    answer: 'Restaurants können sich über unser Partnerportal anmelden. Nach einer kurzen Prüfung kannst du festlegen, wann und wie viele contact-tables du anbieten möchtest. Wir unterstützen dich bei der Integration in dein Reservierungssystem und stellen dir Materialien zur Verfügung, um die contact-tables in deinem Restaurant zu kennzeichnen. Der Registrierungsprozess ist einfach und unkompliziert.'
  },
  {
    category: 'restaurants',
    question: 'Welche Vorteile hat mein Restaurant durch Contact Tables?',
    answer: 'Als teilnehmendes Restaurant profitierst du von zusätzlichen Gästen, besonders zu weniger ausgelasteten Zeiten, erhöhter Sichtbarkeit durch unsere Plattform und einem positiven Image als sozial engagiertes Unternehmen, das gegen Einsamkeit aktiv wird. Unsere ersten Partnerrestaurants berichten bereits von einer besonderen Atmosphäre, die durch die contact-tables entsteht, und von neuen Gästen, die durch diese Initiative gewonnen werden können.'
  },
  {
    category: 'restaurants',
    question: 'Gibt es besondere Anforderungen an contact-tables?',
    answer: 'contact-tables sollten idealerweise in einem ruhigeren Bereich des Restaurants platziert sein, um Gespräche zu erleichtern. Eine kleine Tischkarte oder ein anderes Erkennungszeichen hilft den Teilnehmern, den contact-table zu finden. Wir stellen dir entsprechende Materialien zur Verfügung. Ansonsten gibt es keine besonderen Anforderungen an die Ausstattung oder Größe des Tisches.'
  },
  {
    category: 'restaurants',
    question: 'Wie werden die Kosten für Restaurants berechnet?',
    answer: 'Wir bieten verschiedene Mitgliedschaftsmodelle an, die sich nach der Größe des Restaurants und der Anzahl der angebotenen contact-tables richten. Es gibt ein Basispaket mit monatlicher Zahlung sowie Premium-Pakete mit zusätzlichen Marketingvorteilen. Detaillierte Informationen findest du in unserem Partnerbereich oder bei einem persönlichen Gespräch mit unserem Team.'
  },
  {
    category: 'booking',
    question: 'Wie funktioniert die Reservierung genau?',
    answer: 'Du kannst auf unserer Website nach verfügbaren Kontakttischen suchen und dich mit deinem Konto anmelden, um einen Platz anzumelden. Nach der Anmeldung erhältst du eine Bestätigung per E-Mail mit allen Details zum Treffen. Wichtig: Bitte reserviere den contact-table zusätzlich telefonisch im Restaurant, damit der Tisch für dich freigehalten wird – gerade am Anfang hilft das allen Beteiligten sehr. Du kannst natürlich auch einfach spontan vorbeischauen – beide Wege sind möglich. Mit Reservierung ist\'s aber sicherer.'
  },
  {
    category: 'booking',
    question: 'Kann ich mehrere Plätze für Freunde reservieren?',
    answer: 'Contact Tables ist primär für Einzelpersonen gedacht, die neue Menschen kennenlernen möchten. Wenn du mit Freunden kommen möchtest, empfehlen wir, dass jeder einen eigenen Platz reserviert. So bleibt der Grundgedanke des Konzepts erhalten. In besonderen Fällen kannst du uns kontaktieren, wenn du eine größere Gruppe anmelden möchtest.'
  },
  {
    category: 'booking',
    question: 'Gibt es eine maximale Teilnehmerzahl pro Tisch?',
    answer: 'Die maximale Teilnehmerzahl variiert je nach Restaurant und Tischgröße, liegt aber in der Regel zwischen 4 und 8 Personen. Diese Größe hat sich als ideal erwiesen, um gute Gespräche zu ermöglichen, bei denen sich alle einbringen können. Die genaue Teilnehmerzahl wird bei jedem contact-table in der Beschreibung angegeben.'
  },
  {
    category: 'booking',
    question: 'Kann ich spezielle Wünsche äußern (z.B. Allergien)?',
    answer: 'Falls du spezifische Anfragen bzgl Allergien, vegetarisches Essen etc hast, empfehlen wir, das Restaurant direkt zu kontaktieren und es abzuklären.'
  },
  {
    category: 'booking',
    question: 'Wie weit im Voraus kann ich einen Kontakttisch buchen?',
    answer: 'Kontakttische können in der Regel bis zu 4 Wochen im Voraus gebucht werden. Einige Restaurants bieten auch kurzfristigere Optionen an, manchmal sogar für den gleichen Tag.'
  },
  {
    category: 'privacy',
    question: 'Welche Daten werden von mir gespeichert?',
    answer: 'Wir speichern nur die Daten, die für die Nutzung der Plattform notwendig sind: deine Kontaktdaten (E-Mail, optional Telefonnummer), dein Profil (falls du eines anlegst) und deine Buchungshistorie. Deine Daten werden nicht an Dritte weitergegeben. Wenn du im Restaurant reservierst, gibst du dort deinen Namen und Telefonnummer an, wie bei Reservierungen üblich. Weitere Informationen findest du in unserer Datenschutzerklärung.'
  },
  {
    category: 'privacy',
    question: 'Sind meine Daten sicher?',
    answer: 'Ja, der Schutz deiner Daten hat für uns höchste Priorität. Wir verwenden moderne Verschlüsselungstechnologien und halten uns strikt an die DSGVO. Deine persönlichen Daten werden nur für den vorgesehenen Zweck verwendet und nicht an unbeteiligte Dritte weitergegeben. Unsere Server stehen in Deutschland und unterliegen den strengen europäischen Datenschutzbestimmungen.'
  },
  {
    category: 'privacy',
    question: 'Welche Daten werden über mich gespeichert?',
    answer: 'Wir speichern die für die Nutzung notwendigen Daten wie Name, E-Mail, Profilbild (optional) und deine Buchungshistorie. Detaillierte Informationen findest du in unserer Datenschutzerklärung.'
  },
  {
    category: 'privacy',
    question: 'Wer kann meine Kontaktdaten sehen?',
    answer: 'Deine Kontaktdaten sind für andere Nutzer nicht sichtbar. Bei dem Kalendereintrag für das ausgewählte Restaurant wird lediglich dein Vorname sichtbar sein.'
  },
  {
    category: 'community',
    question: 'Gibt es regelmäßige Community-Events?',
    answer: 'Ja, wir organisieren regelmäßig spezielle Events in verschiedenen Städten, wie thematische contact-tables, Kochabende oder kulturelle Veranstaltungen. Diese werden auf unserer Website und über unseren Newsletter angekündigt, der für die Zukunft geplant ist. Sie bieten eine gute Gelegenheit, die contact-tables-Community kennenzulernen und sich mit Gleichgesinnten zu vernetzen.'
  },
  {
    category: 'community',
    question: 'Wie kann ich mich in die Community einbringen?',
    answer: 'Es gibt verschiedene Möglichkeiten, sich zu engagieren: Du kannst regelmäßig contact-tables hosten, an unseren Community-Events teilnehmen, in unserem Forum aktiv sein oder als Botschafter für contact-tables in deiner Stadt fungieren. Wir freuen uns immer über engagierte Mitglieder, die unsere Vision teilen. Kontaktiere uns einfach, wenn du Ideen oder Vorschläge hast.'
  },
  {
    category: 'general',
    question: 'In welchen Städten ist contact-tables verfügbar?',
    answer: 'contact-tables ist derzeit in mehreren deutschen Großstädten aktiv, darunter Berlin, München, Hamburg, Köln und Frankfurt. Wir erweitern unser Netzwerk kontinuierlich und planen, bald auch in weiteren Städten präsent zu sein. Auf unserer Website findest du immer eine aktuelle Übersicht aller teilnehmenden Städte und Restaurants.'
  },
  {
    category: 'general',
    question: 'Wie kann ich contact-tables unterstützen?',
    answer: 'Die beste Unterstützung ist, aktiv an contact-tables teilzunehmen und anderen von der Idee zu erzählen. Du kannst uns auch auf sozialen Medien folgen und unsere Beiträge teilen. Wenn du ein Restaurant kennst, das gut zu unserem Konzept passen würde, kannst du es uns gerne empfehlen oder direkt mit den Verantwortlichen über contact-tables sprechen.'
  },
  {
    category: 'users',
    question: 'Muss ich mich anmelden, um teilzunehmen?',
    answer: 'Für eine optimale Nutzung der Plattform empfehlen wir die Erstellung eines Kontos, da du so Tische reservieren, deine Buchungen verwalten und Benachrichtigungen erhalten kannst. Es ist jedoch auch möglich, ohne Anmeldung nach contact-tables zu suchen und spontan teilzunehmen, wenn im Restaurant Platz ist.'
  },
  {
    category: 'booking',
    question: 'Kann ich spezielle Wünsche äußern (z.B. Allergien)?',
    answer: 'Ja, bei der Anmeldung zu einem contact-table kannst du Notizen hinterlassen, die an das Restaurant weitergeleitet werden. Für spezifische Anfragen empfehlen wir, das Restaurant direkt zu kontaktieren.'
  },
  {
    category: 'booking',
    question: 'Wie weit im Voraus kann ich einen contact-table buchen?',
    answer: 'contact-tablee können in der Regel bis zu 4 Wochen im Voraus gebucht werden. Einige Restaurants bieten auch kurzfristigere Optionen an, manchmal sogar für den gleichen Tag.'
  },
  {
    category: 'privacy',
    question: 'Welche Daten werden über mich gespeichert?',
    answer: 'Wir speichern die für die Nutzung notwendigen Daten wie Name, E-Mail, Profilbild (optional) und deine Buchungshistorie. Detaillierte Informationen findest du in unserer Datenschutzerklärung.'
  },
  {
    category: 'privacy',
    question: 'Wer kann meine Kontaktdaten sehen?',
    answer: 'Deine Kontaktdaten sind für andere Nutzer nicht sichtbar. Nur das Restaurant erhält die notwendigen Informationen für die Reservierung. Bei contact-tables ist lediglich dein Name und optional dein Profilbild für andere Teilnehmer sichtbar.'
  },
  {
    category: 'privacy',
    question: 'Wie kann ich mein Konto löschen?',
    answer: 'Du kannst dein Konto jederzeit in deinen Profileinstellungen löschen. Beachte, dass dadurch alle deine Daten unwiderruflich gelöscht werden, mit Ausnahme der Informationen, die wir aus rechtlichen Gründen aufbewahren müssen.'
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (question: string) => {
    setOpenItems(prev => 
      prev.includes(question) 
        ? prev.filter(item => item !== question) 
        : [...prev, question]
    );
  };

  const filteredFAQs = faqItems.filter(item => item.category === activeCategory);

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-primary-800 text-white py-24 -mt-8 rounded-b-3xl">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Häufig gestellte Fragen
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Hier findest du Antworten auf die häufigsten Fragen rund um contact-tables.
              Falls deine Frage nicht beantwortet wird, kontaktiere uns gerne direkt.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Kategorien */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {faqCategories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-6 py-3 rounded-full font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </motion.button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-neutral-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(faq.question)}
                    className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-neutral-50 transition-colors"
                  >
                    <span className="font-semibold text-lg">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: openItems.includes(faq.question) ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiChevronDown className="text-primary-600" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openItems.includes(faq.question) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 border-t border-neutral-100 bg-white">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
            
            {/* Kontakt CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 bg-primary-50 rounded-xl p-8 text-center"
            >
              <h3 className="text-2xl font-bold mb-4">Noch Fragen?</h3>
              <p className="text-gray-700 mb-6">
                Wir sind für dich da! Wenn du weitere Fragen hast oder Unterstützung benötigst,
                zögere nicht, uns zu kontaktieren.
              </p>
              <Link href="/contact" className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                Kontakt aufnehmen
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
