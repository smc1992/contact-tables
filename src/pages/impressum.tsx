import LegalPageLayout from '@/components/legal/LegalPageLayout';

export default function Impressum() {
  return (
    <LegalPageLayout
      title="Impressum"
      description="Pflichtangaben nach § 5 TMG für contact-tables."
      metaTitle="Impressum | contact-tables"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="prose prose-neutral max-w-none text-neutral-700">
          <h2>Kontakt</h2>
          <p>
            Contact-tables LLC, registriert im US-Bundesstaat New Mexico unter der Registrierungsnummer 8048467, mit Sitz in 1209 Mountain Rd Pl NE, Albuquerque, NM87110, USA, vertreten durch Anette Rapp
          </p>

          <p>
            Telefon: +49 1567 9640069<br />
            E-Mail: <a href="mailto:datenschutz@contact-tables.org">datenschutz@contact-tables.org</a>
          </p>

          <h2>Verbraucher&shy;streit&shy;beilegung / Universal&shy;schlichtungs&shy;stelle</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
