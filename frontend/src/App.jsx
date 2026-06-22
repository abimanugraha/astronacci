import { useState } from 'react';
import VoucherForm from './components/VoucherForm';
import SeatResults from './components/SeatResults';
import SeatMap from './components/SeatMap';
import ErrorBanner from './components/ErrorBanner';
import VoucherList from './components/VoucherList';
import { checkVoucher, generateVoucher } from './lib/api';

const DUPLICATE_MESSAGE = 'Vouchers have already been generated for this flight and date.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export default function App() {
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState('generate');

  async function handleSubmit(values) {
    setStatus('loading');
    setErrorMessage('');
    setVoucher(null);

    try {
      const result = await checkVoucher({
        flight_number: values.flight_number,
        flight_date: values.flight_date,
      });
      if (result.exists) {
        setStatus('error');
        setErrorMessage(DUPLICATE_MESSAGE);
        return;
      }
    } catch {
      setStatus('error');
      setErrorMessage(DUPLICATE_MESSAGE);
      return;
    }

    try {
      const created = await generateVoucher(values);
      setVoucher(created);
      setStatus('success');
    } catch (err) {
      const statusFromServer = err?.response?.status;
      setStatus('error');
      setErrorMessage(statusFromServer === 409 ? DUPLICATE_MESSAGE : GENERIC_MESSAGE);
    }
  }

  return (
    <main className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-base-content">Voucher Seat Assignment</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Enter the flight details to generate 3 random promotional seats.
          </p>
        </header>

        <div role="tablist" className="tabs tabs-boxed mb-6">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'generate'}
            onClick={() => setActiveTab('generate')}
            className={`tab ${activeTab === 'generate' ? 'tab-active' : ''}`}
          >
            Generate Voucher
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'list'}
            onClick={() => setActiveTab('list')}
            className={`tab ${activeTab === 'list' ? 'tab-active' : ''}`}
          >
            Flight List
          </button>
        </div>

        {activeTab === 'generate' && (
          <>
            <section className="card bg-base-100 shadow-md border border-base-300/50">
              <div className="card-body">
                <h2 className="card-title text-base-content/80 text-base mb-2">Flight details</h2>
                <VoucherForm onSubmit={handleSubmit} loading={status === 'loading'} />
              </div>
            </section>

            {status === 'error' && (
              <div className="mt-6">
                <ErrorBanner message={errorMessage} />
              </div>
            )}

            {status === 'success' && voucher && (
              <>
                <div className="mt-6">
                  <SeatResults
                    seats={voucher.seats}
                    crewName={voucher.crew_name}
                  />
                </div>
                <div className="mt-6">
                  <SeatMap
                    aircraftType={voucher.aircraft_type}
                    wonSeats={voucher.seats}
                  />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'list' && <VoucherList />}
      </div>
    </main>
  );
}
