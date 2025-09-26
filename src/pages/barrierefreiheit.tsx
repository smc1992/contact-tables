import LegalPageLayout from '@/components/legal/LegalPageLayout';

const barrierefreiheitHtml = `
<h1>Erklärung zur Barrierefreiheit für Dienstleistungen</h1> <p>Im Rahmen unserer Barrierefreiheitserklärung möchten wir Ihnen einen Überblick über den Stand der Vereinbarkeit der unten beschriebenen Dienstleistung(en) mit den Anforderungen der Barrierefreiheit nach gesetzlichen Vorschriften (insbesondere mit dem Barrierefreiheitsstärkungsgesetz – BFSG) geben.</p>
<h2>Angaben zum Dienstleistungserbringer</h2><p>Anette Rapp Contact Tables<br />
Am Wiesenhang 12<br />
65207 Wiesbaden<br />
Hessen</p>

<h2>Allgemeine Beschreibung der Dienstleistung</h2><p>Onlineportal mit Registrierung über die Webseite: www.contact-tables.org. Kunden sind Restaurantinhaber und B2C Kunden die Zugriff erhalten auf die Funktionen der Plattform.</p>

<h2>Erläuterungen zur Durchführung der Dienstleistung</h2><p>Über unsere Website www.contact-tables.org bieten wir Dienste über unser Portal an, wo Menschen und Restaurantinhaber sich registrieren können. Wenn Sie sich auf der Website registrieren, können Sie contact-tables reservieren und sich dort eintragen. Teilnehmende Restaurants können Tische für die contact-tables zur Verfügung stellen. Die Nutzer sind anonym und teilen nicht Ihre Benutzerdaten mit anderen Kunden.</p>

<h2>Stand der Vereinbarkeit mit den Anforderungen</h2>
<p>Die oben genannte Dienstleistung ist vollständig mit dem Barrierefreiheitsstärkungsgesetz (BFSG) vereinbar.</p>
<h2>Erstellung der Barrierefreiheitserklärung</h2> <p>Datum der Erstellung der Barrierefreiheitserklärung: 05.08.2025<br /> Datum der letzten Überprüfung der o. g. Leistungen hinsichtlich der Anforderungen zur Barrierefreiheit: 05.08.2025</p>
<h2>Einschätzung zum Stand der Barrierefreiheit</h2> <p>Die Einschätzung zum Stand der Barrierefreiheit beruht auf unserer Selbsteinschätzung.</p>
<h2>Feedbackmöglichkeit und Kontaktangaben</h2><p>Adresse:<br />Am Wiesenhang 12<br />
65207 Wiesbaden</p>
<p>E-Mail: datenschutz@contact-tables.org</p>
<p>Telefon: +4915679640069</p>
<p>Link zur Website: <a href="https://contact-tables.org">https://contact-tables.org</a></p>

<h2>Zuständige Marktüberwachungsbehörde</h2> <p>Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und Dienstleistungen (MLBF)</p> <p>Telefon: + 49 (0) 391 567 6970<br />E-Mail: mlbf@ms.sachsen-anhalt.de</p> <p>Informationen zur aktuellen Adresse des MLBF finden Sie hier: <a href="https://ms.sachsen-anhalt.de/themen/menschen-mit-behinderungen/aktuelles/marktueberwachungsstelle-der-laender-fuer-die-barrierefreiheit-von-produkten-und-dienstleistungen" target="_blank" rel="noopener noreferrer">https://ms.sachsen-anhalt.de/themen/menschen-mit-behinderungen/aktuelles/marktueberwachungsstelle-der-laender-fuer-die-barrierefreiheit-von-produkten-und-dienstleistungen</a>.</p>
`;

export default function Barrierefreiheit() {
  return (
    <LegalPageLayout
      title="Barrierefreiheit"
      description="Erklärung zur Barrierefreiheit der Dienstleistungen von contact-tables."
      metaTitle="Barrierefreiheit | contact-tables"
      contentClassName="space-y-0"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div
          className="prose prose-neutral lg:prose-lg max-w-none text-neutral-700"
          dangerouslySetInnerHTML={{ __html: barrierefreiheitHtml }}
        />
      </div>
    </LegalPageLayout>
  );
}
