import React, { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

function formatValue(value: string | string[] | undefined) {
  if (!value) return '';
  return Array.isArray(value) ? value.join(', ') : value;
}

function isTruthy(v: string | undefined) {
  if (!v) return '';
  const s = v.toString().trim().toLowerCase();
  if (['1', 'true', 'yes', 'ja'].includes(s)) return 'Ja';
  if (['0', 'false', 'no', 'nein'].includes(s)) return 'Nein';
  return v;
}

export default function DankePage() {
  const router = useRouter();

  const hasParams = useMemo(() => {
    return Object.keys(router.query || {}).length > 0;
  }, [router.query]);

  const sections = useMemo(() => {
    const q = router.query || {};

    const valueOf = (keys: string[]) => {
      for (const k of keys) {
        const val = formatValue(q[k]);
        if (val && val.trim().length > 0) return val;
      }
      return '';
    };

    // Kontaktdaten (für Bestellbestätigung relevant)
    const contacts = [
      { label: 'E-Mail', keys: ['email', 'buyer_email'] },
      { label: 'Vorname', keys: ['first_name', 'firstname'] },
      { label: 'Nachname', keys: ['last_name', 'lastname'] },
    ].map(({ label, keys }) => ({ label, value: valueOf(keys) })).filter(i => i.value);

    // Bestellung (nur relevante Felder)
    const order = [
      { label: 'Bestell-ID', keys: ['order_id'] },
      { label: 'Transaktions-ID', keys: ['transaction_id', 'transaction'] },
      { label: 'Produktname', keys: ['product_name', 'item_name'] },
      { label: 'Produkt-ID', keys: ['product_id'] },
      { label: 'Produkt-Anzahl', keys: ['product_qty', 'quantity'] },
      { label: 'Bruttobetrag', keys: ['gross_amount', 'amount_gross', 'price'] },
      { label: 'Währung', keys: ['currency'] },
    ].map(({ label, keys }) => ({ label, value: valueOf(keys) })).filter(i => i.value);

    // URLs (für Bestellbestätigung, Rechnung, Ticket)
    const urls = [
      { label: 'Bestellbestätigung', keys: ['confirmation_url', 'order_confirmation_url'] },
      { label: 'Rechnung', keys: ['invoice_url'] },
      { label: 'E-Ticket', keys: ['eticket_url', 'ticket_url'] },
    ].map(({ label, keys }) => ({ label, value: valueOf(keys) })).filter(i => i.value);

    // Keine Verschiedenes- oder Extra-Parameter anzeigen
    const misc: { label: string; value: string }[] = [];
    const knownKeys = new Set([
      'email','buyer_email','first_name','firstname','last_name','lastname',
      'order_id','transaction_id','transaction','product_name','item_name','product_id','product_qty','quantity','gross_amount','amount_gross','price','currency',
      'confirmation_url','order_confirmation_url','invoice_url','eticket_url','ticket_url',
      'sha_sign'
    ]);
    const extraItems: { label: string; value: string }[] = [];

    return { contacts, order, urls, misc, extraItems };
  }, [router.query]);

  const contractNotice = 'Die Abbuchung erfolgt durch Digistore24.com mit Bestellbestätigung';

  return (
    <>
      <Head>
        <title>Vielen Dank | Contact Tables</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="description" content="Vielen Dank für Ihre Bestellung. Die Abbuchung erfolgt durch Digistore24.com mit Bestellbestätigung." />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-semibold text-gray-900 text-center">Vielen Dank!</h1>
          <p className="mt-4 text-gray-700 text-center">Ihre Bestellung wurde erfolgreich verarbeitet.</p>

          <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-800">
              <strong>Hinweis:</strong> {contractNotice}
            </p>
          </div>

          <div className="mt-6 rounded-md border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-medium text-gray-900">Bestellinformationen</h2>
            {!hasParams && (
              <p className="mt-3 text-sm text-gray-600">
                Wir konnten keine Bestellparameter erkennen. Wenn Sie direkt von Digistore24 weitergeleitet wurden, prüfen Sie bitte die Bestätigungs-E-Mail.
              </p>
            )}
            {hasParams && (
              <div className="mt-4 space-y-6">
                {/* Kontaktdaten */}
                {sections.contacts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Kontaktdaten</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                      {sections.contacts.map((item) => (
                        <div key={item.label} className="sm:col-span-1">
                          <dt className="text-sm text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900 break-words">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Bestellung */}
                {sections.order.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Bestellung</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                      {sections.order.map((item) => (
                        <div key={item.label} className="sm:col-span-1">
                          <dt className="text-sm text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900 break-words">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* URLs */}
                {sections.urls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">URL</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                      {sections.urls.map((item) => (
                        <div key={item.label} className="sm:col-span-1">
                          <dt className="text-sm text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm font-medium text-blue-700 break-words">
                            <a href={item.value} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {item.value}
                            </a>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Verschiedenes */}
                {sections.misc.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Verschiedenes</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                      {sections.misc.map((item) => (
                        <div key={item.label} className="sm:col-span-1">
                          <dt className="text-sm text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900 break-words">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Weitere Parameter */}
                {sections.extraItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Weitere Parameter</h3>
                    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                      {sections.extraItems.map((item) => (
                        <div key={item.label} className="sm:col-span-1">
                          <dt className="text-sm text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm font-medium text-gray-900 break-words">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-600 text-center">Sie erhalten in Kürze eine Bestellbestätigung per E-Mail.</p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/" className="inline-flex items-center rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-900">
              Zur Startseite
            </Link>
            <Link href="/restaurant/dashboard" className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
              Zum Dashboard
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}