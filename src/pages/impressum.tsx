import PageLayout from '../components/PageLayout';

export default function Impressum() {
  return (
    <PageLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <div className="prose prose-lg max-w-none text-gray-700">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Impressum</h1>

            <p className="mb-4">
              Anette Rapp<br />
              Anette Rapp Contact-Tables<br />
              Am Wiesenhang 12<br />
              65207 Wiesbaden
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Kontakt</h2>
            <p className="mb-4">
              Telefon: +4915679640069<br />
              E-Mail: datenschutz@contact-tables.org
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">Verbraucher&shy;streit&shy;beilegung/Universal&shy;schlichtungs&shy;stelle</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
