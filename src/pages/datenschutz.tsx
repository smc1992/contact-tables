import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-grow">
        {/* Hero-Bereich */}
        <section className="bg-gradient-to-b from-primary-500 to-primary-700 text-white py-12">
          <div className="container mx-auto px-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-center"
            >
              Datenschutzerklärung
            </motion.h1>
          </div>
        </section>
        
        {/* Datenschutz-Inhalt */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Allgemeine Hinweise</h3>
              <p className="mb-4 text-secondary-600">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
                wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert 
                werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text 
                aufgeführten Datenschutzerklärung.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Datenerfassung auf unserer Website</h3>
              <p className="mb-4 text-secondary-600">
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem 
                Impressum dieser Website entnehmen.
              </p>
              
              <p className="mb-4 text-secondary-600">
                <strong>Wie erfassen wir Ihre Daten?</strong><br />
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, 
                die Sie in ein Kontaktformular eingeben.
              </p>
              
              <p className="mb-4 text-secondary-600">
                Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische 
                Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt 
                automatisch, sobald Sie unsere Website betreten.
              </p>
              
              <p className="mb-4 text-secondary-600">
                <strong>Wofür nutzen wir Ihre Daten?</strong><br />
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können 
                zur Analyse Ihres Nutzerverhaltens verwendet werden.
              </p>
              
              <p className="mb-6 text-secondary-600">
                <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />
                Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten 
                personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser 
                Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit unter der im 
                Impressum angegebenen Adresse an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen 
                Aufsichtsbehörde zu.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">2. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Datenschutz</h3>
              <p className="mb-4 text-secondary-600">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser 
                Datenschutzerklärung.
              </p>
              
              <p className="mb-6 text-secondary-600">
                Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind 
                Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche 
                Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Hinweis zur verantwortlichen Stelle</h3>
              <p className="mb-6 text-secondary-600">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
                
                Contact Tables GmbH<br />
                Musterstraße 123<br />
                12345 Musterstadt<br />
                Deutschland<br /><br />
                
                                Telefon: <a href="tel:+4917672495360" className="text-primary-600 hover:underline">+49 176 72495360</a><br />
                                E-Mail: <a href="mailto:info@contact-tables.org" className="text-primary-600 hover:underline">info@contact-tables.org</a><br /><br />
                
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die 
                Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p className="mb-6 text-secondary-600">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits 
                erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die 
                Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
              <p className="mb-6 text-secondary-600">
                Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei der zuständigen 
                Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde in datenschutzrechtlichen Fragen ist der 
                Landesdatenschutzbeauftragte des Bundeslandes, in dem unser Unternehmen seinen Sitz hat.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Recht auf Datenübertragbarkeit</h3>
              <p className="mb-6 text-secondary-600">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert 
                verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern 
                Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es 
                technisch machbar ist.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">3. Datenerfassung auf unserer Website</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Cookies</h3>
              <p className="mb-4 text-secondary-600">
                Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an und 
                enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. 
                Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
              </p>
              
              <p className="mb-4 text-secondary-600">
                Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie werden nach Ende Ihres Besuchs 
                automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert bis Sie diese löschen. Diese Cookies 
                ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.
              </p>
              
              <p className="mb-6 text-secondary-600">
                Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im 
                Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische 
                Löschen der Cookies beim Schließen des Browser aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität 
                dieser Website eingeschränkt sein.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Server-Log-Dateien</h3>
              <p className="mb-6 text-secondary-600">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr 
                Browser automatisch an uns übermittelt. Dies sind:<br /><br />
                
                - Browsertyp und Browserversion<br />
                - verwendetes Betriebssystem<br />
                - Referrer URL<br />
                - Hostname des zugreifenden Rechners<br />
                - Uhrzeit der Serveranfrage<br />
                - IP-Adresse<br /><br />
                
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Kontaktformular</h3>
              <p className="mb-6 text-secondary-600">
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der 
                von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns 
                gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Registrierung auf dieser Website</h3>
              <p className="mb-6 text-secondary-600">
                Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen auf der Seite zu nutzen. Die dazu 
                eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich 
                registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. 
                Anderenfalls werden wir die Registrierung ablehnen.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">4. Soziale Medien</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Social-Media-Plugins</h3>
              <p className="mb-6 text-secondary-600">
                Auf unseren Seiten sind Plugins der sozialen Netzwerke integriert. Die entsprechenden Anbieter der Seiten können 
                möglicherweise Ihre IP-Adresse erfassen, sobald Sie mit einem dieser Plugins interagieren. Nähere Informationen 
                hierzu entnehmen Sie den Datenschutzerklärungen der jeweiligen Anbieter.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">5. Analyse-Tools und Werbung</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Google Analytics</h3>
              <p className="mb-6 text-secondary-600">
                Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Inc., 1600 
                Amphitheatre Parkway, Mountain View, CA 94043, USA.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">6. Newsletter</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Newsletterdaten</h3>
              <p className="mb-6 text-secondary-600">
                Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine E-Mail-Adresse 
                sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind 
                und mit dem Empfang des Newsletters einverstanden sind. Weitere Daten werden nicht bzw. nur auf freiwilliger Basis 
                erhoben. Diese Daten verwenden wir ausschließlich für den Versand der angeforderten Informationen und geben diese 
                nicht an Dritte weiter.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">7. Plugins und Tools</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Google Web Fonts</h3>
              <p className="mb-6 text-secondary-600">
                Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Web Fonts, die von Google bereitgestellt 
                werden. Beim Aufruf einer Seite lädt Ihr Browser die benötigten Web Fonts in ihren Browsercache, um Texte und 
                Schriftarten korrekt anzuzeigen.
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Google Maps</h3>
              <p className="mb-6 text-secondary-600">
                Diese Seite nutzt über eine API den Kartendienst Google Maps. Anbieter ist die Google Inc., 1600 Amphitheatre 
                Parkway, Mountain View, CA 94043, USA.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">8. Zahlungsanbieter</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">PayPal</h3>
              <p className="mb-6 text-secondary-600">
                Auf unserer Website bieten wir u.a. die Bezahlung via PayPal an. Anbieter dieses Zahlungsdienstes ist die PayPal 
                (Europe) S.à.r.l. et Cie, S.C.A., 22-24 Boulevard Royal, L-2449 Luxembourg (im Folgenden "PayPal").
              </p>
              
              <p className="mb-6 text-secondary-600">
                Stand: Mai 2025
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
