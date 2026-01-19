import PageLayout from '@/components/PageLayout';
import Link from 'next/link';

const navigationLinks = [
  {
    href: '#verbraucher',
    title: 'AGB für Verbraucher (B2C)',
    description:
      'Regelungen für Gäste und Endverbraucher, die contact-tables.org nutzen, um neue Kontakte beim Essen zu knüpfen.'
  },
  {
    href: '#restaurants',
    title: 'AGB für Restaurants (B2B)',
    description:
      'Vertragsgrundlagen für gastronomische Betriebe, die als Partner-Restaurant bei contact-tables teilnehmen.'
  }
];

export default function AgbPage() {
  return (
    <PageLayout
      title="AGB | contact-tables"
      description="Allgemeine Geschäftsbedingungen für Verbraucher und Restaurants bei contact-tables"
      className="bg-white"
    >
      {/* Hinweis: Die AGB-Akzeptanz erfolgt ausschließlich im Restaurant-Dashboard. */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700">
          <div className="container mx-auto px-4 py-16 text-white">
            <div className="max-w-3xl">
              <p className="uppercase tracking-wider text-primary-200 text-sm font-semibold mb-4">Rechtliches</p>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Allgemeine Geschäftsbedingungen</h1>
              <p className="text-lg text-primary-100 leading-relaxed">
                Hier finden Sie die aktuellen Allgemeinen Geschäftsbedingungen (AGB) für die Nutzung von contact-tables.org.
                Wählen Sie die passende Version für Endverbraucher oder Restaurants, um alle Konditionen im Detail zu lesen.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {navigationLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-neutral-100 p-6 flex flex-col space-y-3"
              >
                <span className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Direkt zu</span>
                <span className="text-2xl font-semibold text-neutral-900">{link.title}</span>
                <span className="text-neutral-600 leading-relaxed">{link.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 space-y-24">
        {/* Verbraucher (B2C) */}
        <section id="verbraucher" className="scroll-mt-24">
          <div className="max-w-4xl">
            <p className="text-primary-600 uppercase tracking-wide text-sm font-semibold mb-4">AGB für Endverbraucher</p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">AGB für Verbraucher (B2C)</h2>
            <p className="text-neutral-600 leading-relaxed mb-8">
              Allgemeine Geschäftsbedingungen (AGB) der Contact-tables LLC für die Nutzung der Plattform contact-tables.org durch Verbraucher.
            </p>

            <div className="prose prose-neutral max-w-none">
              <h3>1. Einleitung / Geltungsbereich</h3>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform contact-tables.org durch Verbraucher im Sinne des § 13 BGB (im Folgenden
                „Nutzer“). Betreiber der Plattform ist die Contact-tables LLC, registriert im US-Bundesstaat New Mexico unter der Nummer 8048467, mit Sitz in 1209 Mountain Rd Pl NE,
                Albuquerque, NM 87110, USA (im Folgenden „Betreiber“).
              </p>
              <p>
                Die Nutzung der Plattform ist für Nutzer derzeit kostenlos. Der Betreiber behält sich jedoch vor, künftig zusätzliche, freiwillig buchbare Funktionen oder Upgrades
                kostenpflichtig anzubieten. Hierauf wird der Nutzer im Fall einer Einführung ausdrücklich hingewiesen. Mit der Registrierung oder Nutzung der Plattform erkennt der
                Nutzer diese AGB an.
              </p>

              <h3>2. Vertragsgegenstand</h3>
              <p>
                Der Betreiber stellt mit contact-tables.org eine Plattform zur Verfügung, über die Nutzer Restaurants mit sogenannten Contact-tables finden können, um dort gemeinsam
                mit anderen Menschen zu essen und Kontakte zu knüpfen. Der Betreiber selbst erbringt keine gastronomischen Leistungen und wird nicht Vertragspartner zwischen den
                Nutzern und den Restaurants. Ein Anspruch auf die Vermittlung bestimmter Kontakte, Tischreservierungen oder erfolgreicher Begegnungen besteht nicht. Die Nutzung der
                Plattform dient ausschließlich als Vermittlungs- und Informationsangebot.
              </p>

              <h3>3. Registrierung &amp; Vertragsschluss</h3>
              <p>
                Für die Nutzung bestimmter Funktionen der Plattform ist eine Registrierung mit einem persönlichen Nutzerkonto erforderlich. Hierzu sind der vollständige Name, eine gültige
                E-Mail-Adresse und ein Passwort anzugeben. Mit Abschluss der Registrierung erklärt sich der Nutzer mit der Geltung dieser AGB einverstanden. Ein Anspruch auf Registrierung
                oder Nutzung der Plattform besteht nicht. Der Betreiber kann Registrierungen ohne Angabe von Gründen ablehnen.
              </p>
              <p>
                Der Betreiber ist berechtigt, Nutzerkonten jederzeit zu sperren oder zu löschen, insbesondere bei Verstößen gegen diese AGB, bei rechtswidrigem Verhalten oder Missbrauch der
                Plattform. Die Nutzung der Plattform ist nur Personen gestattet, die das 18. Lebensjahr vollendet haben.
              </p>

              <h3>4. Leistungen des Betreibers</h3>
              <p>
                Der Betreiber stellt den Nutzern die Plattform contact-tables.org zur Verfügung, auf der Restaurants mit Contact-tables dargestellt werden, um Nutzern die Möglichkeit zu geben,
                Gesellschaft beim Essen zu finden. Die Nutzung der Plattform ist für Nutzer kostenlos. Der Betreiber entwickelt die Plattform fortlaufend weiter. Perspektivisch können zusätzliche
                Funktionen wie ein Reservierungssystem, besondere Aktionen oder Newsletter angeboten werden. Ein Anspruch hierauf besteht jedoch nicht. Der Betreiber übernimmt keine
                Garantie dafür, dass ein Nutzer tatsächlich Gesellschaft findet, dass ein Restaurant Plätze bereithält oder dass Kontakte zustande kommen.
              </p>

              <h3>5. Pflichten der Nutzer</h3>
              <p>Der Nutzer verpflichtet sich:</p>
              <ul>
                <li>bei der Registrierung wahrheitsgemäße Angaben zu machen und keine Daten Dritter ohne deren Einwilligung zu verwenden,</li>
                <li>die Plattform ausschließlich für private Zwecke zu nutzen und nicht für kommerzielle Werbung oder Spam,</li>
                <li>sich gegenüber anderen Nutzern und Restaurants respektvoll und angemessen zu verhalten,</li>
                <li>keine rechtswidrigen, beleidigenden, diskriminierenden oder sonst unangemessenen Inhalte einzustellen oder zu verbreiten,</li>
                <li>die Plattform nicht in einer Weise zu nutzen, die deren Funktionsfähigkeit beeinträchtigt oder missbräuchlich verändert.</li>
              </ul>
              <p>
                Jegliche Form von Belästigung, sexuellen Anspielungen, unerwünschten Annäherungen oder diskriminierendem Verhalten gegenüber anderen Nutzern oder
                Restaurantmitarbeitern ist strengstens untersagt. Der Nutzer ist für sein Verhalten im Rahmen der Nutzung der Plattform und bei Besuchen in Restaurants selbst verantwortlich.
              </p>

              <h3>6. Kosten &amp; Zahlungsbedingungen</h3>
              <p>
                Die Nutzung der Plattform contact-tables.org ist für Nutzer kostenlos. Es entstehen keinerlei versteckte Kosten oder Abonnements. Der Betreiber behält sich vor, künftig zusätzliche,
                freiwillig buchbare Zusatzfunktionen oder Upgrades anzubieten, die kostenpflichtig sein können. In einem solchen Fall wird der Nutzer vorab ausdrücklich informiert und muss einer
                solchen Buchung aktiv zustimmen. Für solche künftig angebotenen kostenpflichtigen Leistungen steht dem Nutzer als Verbraucher ein gesetzliches Widerrufsrecht von 14 Tagen zu;
                der Betreiber wird ihn hierüber vorab informieren.
              </p>

              <h3>7. Laufzeit &amp; Kündigung</h3>
              <p>
                Der Nutzungsvertrag wird auf unbestimmte Zeit geschlossen. Der Nutzer kann seinen Account jederzeit und ohne Einhaltung einer Frist selbst löschen oder durch eine Mitteilung an den
                Betreiber in Textform kündigen. Der Betreiber ist berechtigt, Nutzerkonten jederzeit zu sperren oder zu löschen, insbesondere bei Verstößen gegen diese AGB, bei rechtswidrigem Verhalten
                oder Missbrauch der Plattform. Ein Anspruch auf Wiederherstellung gelöschter oder gesperrter Accounts besteht nicht.
              </p>

              <h3>8. Nutzungsrechte / Inhalte</h3>
              <p>
                Derzeit können Nutzer keine eigenen Inhalte (z. B. Texte oder Bilder) auf der Plattform einstellen. Sollte der Betreiber künftig entsprechende Funktionen anbieten, dürfen nur solche Inhalte
                eingestellt werden, an denen der Nutzer die erforderlichen Rechte besitzt und die keine Rechte Dritter verletzen. Mit dem Einstellen solcher Inhalte räumt der Nutzer dem Betreiber ein
                einfaches, räumlich und zeitlich unbeschränktes Nutzungsrecht hieran ein, soweit dies für die Bereitstellung der Plattform erforderlich ist. Das Einstellen oder Verbreiten von rechtswidrigen,
                beleidigenden, diskriminierenden oder sonst unangemessenen Inhalten ist untersagt. Der Betreiber ist berechtigt, derartige Inhalte jederzeit zu löschen oder Nutzerkonten zu sperren.
              </p>

              <h3>9. Haftung &amp; Gewährleistung</h3>
              <p>
                Der Betreiber stellt ausschließlich die technische Plattform zur Verfügung und ist nicht Vertragspartei zwischen Nutzern oder zwischen Nutzern und Restaurants. Eine Haftung für die Erfüllung
                oder Qualität der gastronomischen Leistungen der Restaurants oder für das Verhalten anderer Nutzer ist ausgeschlossen. Der Betreiber übernimmt keine Garantie dafür, dass Nutzer
                Gesellschaft finden, dass ein Tisch frei ist oder dass Kontakte zustande kommen.
              </p>
              <p>
                Der Betreiber bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform, übernimmt jedoch keine Gewähr für die jederzeitige, fehlerfreie und ununterbrochene Nutzung.
                Der Betreiber haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung von Leben, Körper oder Gesundheit und nach dem Produkthaftungsgesetz. Bei
                leicht fahrlässiger Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) haftet der Betreiber nur in Höhe des bei Vertragsschluss vorhersehbaren, vertragstypischen Schadens. Eine
                weitergehende Haftung für leicht fahrlässig verursachte Schäden ist ausgeschlossen.
              </p>

              <h3>10. Technische Verfügbarkeit / Änderungen</h3>
              <p>
                Der Betreiber bemüht sich, die Plattform mit hoher Verfügbarkeit bereitzustellen. Eine jederzeitige und unterbrechungsfreie Nutzung kann jedoch nicht garantiert werden. Wartungsarbeiten,
                Sicherheitsupdates oder technische Störungen können zu zeitweiligen Einschränkungen oder Ausfällen führen. Der Betreiber ist berechtigt, die Plattform oder einzelne Funktionen jederzeit zu
                ändern, weiterzuentwickeln oder einzustellen, soweit dadurch die wesentlichen vertraglichen Verpflichtungen nicht beeinträchtigt werden. Über wesentliche Änderungen wird der Nutzer
                rechtzeitig informiert.
              </p>

              <h3>11. Datenschutz</h3>
              <p>
                Der Betreiber verarbeitet personenbezogene Daten der Nutzer ausschließlich zur Bereitstellung der Plattform und im Einklang mit den geltenden Datenschutzgesetzen. Einzelheiten zur
                Verarbeitung der Daten sind in der jeweils gültigen Datenschutzerklärung auf www.contact-tables.org geregelt. Ohne ausdrückliche Einwilligung des Nutzers werden dessen personenbezogene
                Daten nicht an Dritte weitergegeben, es sei denn, der Betreiber ist hierzu gesetzlich verpflichtet.
              </p>

              <h3>12. Schlussbestimmungen</h3>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Für Verbraucher gilt: Zwingende gesetzliche Bestimmungen des Staates, in dem der Nutzer seinen
                gewöhnlichen Aufenthalt hat, bleiben unberührt.
              </p>
            </div>
          </div>
        </section>

        {/* Restaurants (B2B) */}
        <section id="restaurants" className="scroll-mt-24">
          <div className="max-w-4xl">
            <p className="text-primary-600 uppercase tracking-wide text-sm font-semibold mb-4">AGB für Partner-Restaurants</p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">AGB für Restaurants (B2B)</h2>
            <p className="text-neutral-600 leading-relaxed mb-8">
              Allgemeine Geschäftsbedingungen (AGB) der Contact-tables LLC für die Teilnahme von Restaurants an der Plattform contact-tables.org.
            </p>

            <div className="prose prose-neutral max-w-none">
              <h3>1. Präambel / Einleitung</h3>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für sämtliche Verträge
                zwischen der Contact-tables LLC, registriert im US-Bundesstaat New Mexico unter der
                Registrierungsnummer 8048467, mit Sitz in 1209 Mountain Rd Pl NE, Albuquerque, NM
                87110, USA, vertreten durch Anette Rapp (im Folgenden „Betreiber“), und
                gastronomischen Betrieben (im Folgenden „Restaurant“), die ihre Betriebe auf der
                Plattform des Betreibers listen.
              </p>
              <p>
                Diese AGB gelten ausschließlich für Unternehmer im Sinne des § 14 BGB. Durch die
                Registrierung und Freischaltung als Partner-Restaurant erklärt sich das Restaurant mit
                der Geltung dieser AGB einverstanden. Die jeweils gültige Version der AGB ist auf
                www.contact-tables.org einsehbar und wird bei der Registrierung aktiv bestätigt.
              </p>

              <h3>2. Vertragsgegenstand</h3>
              <p>
                Der Betreiber stellt mit contact-tables.org eine Internetplattform zur Verfügung, die
                Menschen, die allein unterwegs sind oder Gesellschaft beim Essen suchen, mit anderen
                an sogenannten Contact-tables in Restaurants zusammenbringt.
              </p>
              <p>
                Die Nutzung der Plattform ist für Endnutzer kostenlos. Für Restaurants ist die Teilnahme
                kostenpflichtig gemäß Ziffer 6 dieser AGB.
              </p>

              <h3>3. Vertragsschluss</h3>
              <p>
                Der Vertrag zwischen dem Restaurant und dem Betreiber kommt zustande, sobald das
                Restaurant den Registrierungsprozess auf der Plattform abgeschlossen hat und durch
                den Betreiber freigeschaltet wurde.
              </p>
              <p>
                Eine automatische Aufnahme findet nicht statt. Der Betreiber wählt Restaurants gezielt
                aus, um pro Stadt eine ausgewogene und sinnvolle Anzahl an Contact-tables
                sicherzustellen.
              </p>
              <p>
                Nicht berücksichtigte Restaurants werden automatisch auf eine Nachrückliste gesetzt
                und bei frei werdenden Kapazitäten bevorzugt kontaktiert.
              </p>
              <p>
                Ein Anspruch auf Vertragsschluss besteht nicht. Der Betreiber behält sich vor,
                Anmeldungen ohne Angabe von Gründen abzulehnen.
              </p>

              <h3>4. Leistungen des Betreibers</h3>
              <p>
                Das Restaurant wird auf der Plattform sichtbar gemacht und als Gastgeber eines oder
                mehrerer Contact-tables dargestellt.
              </p>
              <p>
                Die Leistungen umfassen insbesondere:
              </p>
              <ul>
                <li>die Darstellung des Restaurants auf der Plattform inkl. Beschreibung, Adresse,
                Öffnungszeiten und Bildern,</li>
                <li>die Bereitstellung eines Tischaufstellers, um die Contact-tables im Restaurant
                sichtbar zu kennzeichnen,</li>
                <li>die Einbindung in allgemeine Marketingmaßnahmen, z. B. Social Media oder
                Newsletter,</li>
                <li>die perspektivische Anbindung an ein Reservierungssystem (derzeit in Entwicklung).</li>
              </ul>
              <p>
                Darüber hinaus können in Zukunft gemeinsame Aktionen oder Veranstaltungen (z. B.
                Brunches, Themenabende) angeboten werden. Hierauf besteht jedoch kein Anspruch.
                Eine bestimmte Anzahl an Kontakten, Gästen oder Buchungen wird nicht garantiert.
              </p>

              <h3>5. Pflichten des Restaurants</h3>
              <p>Das Restaurant verpflichtet sich,</p>
              <ul>
                <li>einen oder mehrere Tische für Contact-tables ausschließlich bei vorheriger
                Reservierung oder Anmeldung durch einen Gast bereitzustellen,</li>
                <li>im Falle einer Reservierung den Tisch bereitzuhalten und mit dem vom Betreiber zur
                Verfügung gestellten Tischaufsteller sichtbar zu kennzeichnen,</li>
                <li>die im Profil hinterlegten Angaben stets aktuell und korrekt zu halten
                (z. B. Öffnungszeiten, Adresse, Kontakt),</li>
                <li>alle gesetzlichen Vorgaben im Rahmen des Betriebs einzuhalten (z. B. Hygiene,
                Kennzeichnungspflichten),</li>
                <li>Gäste, die über Contact-tables vermittelt werden, freundlich und respektvoll zu
                behandeln,</li>
                <li>keine rechtswidrigen, beleidigenden, diskriminierenden oder irreführenden Inhalte
                bereitzustellen.</li>
              </ul>
              <p>
                Die dauerhafte Einrichtung eines festen Contact-tables kann – bei wachsender Nutzung
                – zu einem späteren Zeitpunkt gemeinsam neu bewertet werden.
              </p>

              <h3>6. Kosten &amp; Zahlungsbedingungen</h3>
              <p>
                Die Registrierung und Nutzung der Plattform ist im Rahmen der Einführungsphase bis
                einschließlich 28.02.2026 kostenlos.
              </p>
              <ul>
                <li>Ab dem 01.03.2026 gelten folgende Teilnahmegebühren:
                39 € netto pro Monat, zzgl. gesetzlicher Umsatzsteuer,
                399 € netto pro Jahr, zzgl. gesetzlicher Umsatzsteuer.</li>
                <li>Ab dem 01.07.2026 gelten für neu abgeschlossene Verträge bzw. Verlängerungen
                folgende Preise:
                49 € netto pro Monat, zzgl. gesetzlicher Umsatzsteuer,
                499 € netto pro Jahr, zzgl. gesetzlicher Umsatzsteuer.</li>
              </ul>
              <p>
                Die Abrechnung und Zahlungsabwicklung erfolgen über den Dienstleister Digistore24.
                Restaurants müssen bei Registrierung ihre Zahlungsdaten hinterlegen.
              </p>
              <p>
                Die Zahlung ist jeweils zu Beginn der gewählten Laufzeit im Voraus fällig:
              </p>
              <ul>
                <li>bei monatlicher Zahlweise: zu Beginn eines jeden Monats,</li>
                <li>bei jährlicher Zahlweise: zu Beginn des Vertragsjahres.</li>
              </ul>
              <p>
                Bei Zahlungsverzug oder Rücklastschrift kann das Restaurantprofil gesperrt werden.
                In diesem Fall können Verzugszinsen nach den gesetzlichen Bestimmungen sowie
                pauschale Mahngebühren (5,00 € pro Mahnschreiben) berechnet werden.
              </p>

              <h3>7. Laufzeit &amp; Kündigung</h3>
              <p>
                Die Vertragslaufzeit beträgt ein Jahr ab Freischaltung des Profils. Der Vertrag verlängert
                sich automatisch um jeweils ein weiteres Jahr, wenn er nicht spätestens einen Monat
                vor Ablauf der Laufzeit in Textform gekündigt wird.
              </p>
              <p>
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein
                wichtiger Grund liegt insbesondere vor, wenn:
              </p>
              <ul>
                <li>das Restaurant wiederholt gegen diese AGB verstößt,</li>
                <li>gesetzliche Vorschriften verletzt werden,</li>
                <li>fällige Zahlungen trotz Mahnung nicht geleistet werden.</li>
              </ul>

              <h3>8. Nutzungsrechte / Inhalte</h3>
              <p>
                Das Restaurant stellt dem Betreiber für die Darstellung auf der Plattform und für
                Marketing geeignete Inhalte (Texte, Bilder, Logos) zur Verfügung. Das Restaurant sichert
                zu, dass es über alle erforderlichen Rechte verfügt und keine Rechte Dritter verletzt.
              </p>
              <p>
                Das Restaurant räumt dem Betreiber ein einfaches, nicht ausschließliches, räumlich
                und zeitlich unbegrenztes Nutzungsrecht an diesen Inhalten ein, ausschließlich für die
                Darstellung auf der Plattform und begleitende Marketingmaßnahmen.
              </p>
              <p>
                Das Hochladen oder Bereitstellen von rechtswidrigen, diskriminierenden,
                beleidigenden oder irreführenden Inhalten ist untersagt. Der Betreiber ist berechtigt,
                unzulässige Inhalte zu entfernen oder anzupassen.
              </p>

              <h3>9. Haftung &amp; Gewährleistung</h3>
              <p>
                Der Betreiber ist ausschließlich Vermittler und nicht Vertragspartei zwischen Restaurant
                und Gast. Eine Haftung für die Erfüllung oder Qualität der gastronomischen Leistungen,
                für das Verhalten oder Nichterscheinen von Gästen sowie für Unfälle auf dem Weg zum
                Restaurant oder während des Aufenthalts ist ausgeschlossen.
              </p>
              <p>
                Der Betreiber übernimmt keine Garantie für eine bestimmte Anzahl von Kontakten,
                Reservierungen oder Umsätzen. Ebenso besteht keine Haftung für kurzfristige Ausfälle
                der Plattform durch Wartung oder technische Störungen.
              </p>
              <p>
                Der Betreiber haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Schäden aus
                der Verletzung von Leben, Körper oder Gesundheit sowie nach dem
                Produkthaftungsgesetz. Bei leicht fahrlässiger Verletzung wesentlicher
                Vertragspflichten haftet der Betreiber nur in Höhe des bei Vertragsschluss
                vorhersehbaren, vertragstypischen Schadens. Eine weitergehende Haftung für leicht
                fahrlässig verursachte Schäden ist ausgeschlossen.
              </p>
              <p>
                Das Restaurant haftet für die Richtigkeit seiner Angaben und stellt den Betreiber von
                sämtlichen Ansprüchen Dritter frei, die durch rechtswidrige oder fehlerhafte Inhalte
                entstehen.
              </p>

              <h3>10. Technische Verfügbarkeit / Änderungen</h3>
              <p>
                Der Betreiber bemüht sich, die Plattform mit hoher Verfügbarkeit bereitzustellen. Eine
                ununterbrochene Nutzung kann jedoch nicht garantiert werden.
              </p>
              <p>
                Der Betreiber ist berechtigt, die Plattform oder einzelne Funktionen jederzeit zu ändern,
                weiterzuentwickeln oder einzustellen, soweit dadurch die wesentlichen Verpflichtungen
                nicht beeinträchtigt werden. Über wesentliche Änderungen wird das Restaurant
                rechtzeitig informiert. Ansprüche auf Schadensersatz wegen Einschränkungen oder
                Änderungen der Plattform bestehen nicht.
              </p>

              <h3>11. Datenschutz / Vertraulichkeit</h3>
              <p>
                Der Betreiber verarbeitet personenbezogene Daten des Restaurants ausschließlich zur
                Vertragserfüllung und gemäß den geltenden Datenschutzgesetzen. Einzelheiten
                ergeben sich aus der jeweils gültigen Datenschutzerklärung auf www.contact-tables.org.
              </p>
              <p>
                Das Restaurant verpflichtet sich, über die Plattform erhaltene Daten von Nutzern
                ausschließlich zweckgebunden zu verwenden und diese vertraulich sowie
                datenschutzkonform zu behandeln.
              </p>
              <p>
                Beide Parteien verpflichten sich, vertrauliche Informationen geheim zu halten und nicht
                ohne Zustimmung weiterzugeben, soweit keine gesetzliche Pflicht zur Offenlegung
                besteht.
              </p>

              <h3>12. Schlussbestimmungen</h3>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                Ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist, soweit
                gesetzlich zulässig, Wiesbaden.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
