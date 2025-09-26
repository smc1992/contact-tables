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
            Anette Rapp<br />
            Anette Rapp Contact-Tables<br />
            Am Wiesenhang 12<br />
            65207 Wiesbaden
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
