import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ImpressumPage() {
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
              Impressum
            </motion.h1>
          </div>
        </section>
        
        {/* Impressum-Inhalt */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Angaben gemäß § 5 TMG</h2>
              
              <p className="mb-6 text-secondary-600">
                Contact Tables GmbH<br />
                Musterstraße 123<br />
                12345 Musterstadt<br />
                Deutschland
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Handelsregister</h3>
              <p className="mb-6 text-secondary-600">
                HRB 123456<br />
                Amtsgericht Musterstadt
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Vertreten durch</h3>
              <p className="mb-6 text-secondary-600">
                Max Mustermann, Geschäftsführer
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Kontakt</h2>
              
              <p className="mb-6 text-secondary-600">
                                Telefon: <a href="tel:+4917672495360" className="text-primary-600 hover:underline">+49 176 72495360</a><br />
                                E-Mail: <a href="mailto:info@contact-tables.org" className="text-primary-600 hover:underline">info@contact-tables.org</a>
              </p>
              
              <h3 className="text-xl font-semibold mb-3 text-secondary-700">Umsatzsteuer-ID</h3>
              <p className="mb-6 text-secondary-600">
                Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                DE 123456789
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              
              <p className="mb-6 text-secondary-600">
                Max Mustermann<br />
                Musterstraße 123<br />
                12345 Musterstadt<br />
                Deutschland
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Streitschlichtung</h2>
              
              <p className="mb-4 text-secondary-600">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                <a href="https://ec.europa.eu/consumers/odr/" className="text-primary-600 hover:underline">https://ec.europa.eu/consumers/odr/</a>.
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
              
              <p className="mb-6 text-secondary-600">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Haftung für Inhalte</h2>
              
              <p className="mb-4 text-secondary-600">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
                Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu 
                überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              
              <p className="mb-6 text-secondary-600">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. 
                Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden 
                von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Haftung für Links</h2>
              
              <p className="mb-4 text-secondary-600">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese 
                fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
                der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. 
                Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              
              <p className="mb-6 text-secondary-600">
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht 
                zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
              
              <h2 className="text-2xl font-bold mb-6 text-secondary-800">Urheberrecht</h2>
              
              <p className="mb-4 text-secondary-600">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die 
                Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der 
                schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, 
                nicht kommerziellen Gebrauch gestattet.
              </p>
              
              <p className="mb-6 text-secondary-600">
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere 
                werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten 
                wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
              </p>
              
              <p className="text-secondary-600">
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
