import { useEffect, useState } from 'react';
import { listVouchers } from '../lib/api';
import ErrorBanner from './ErrorBanner';

const ERROR_MESSAGE = 'Could not load flights. Please try again.';

export default function VoucherList() {
  const [status, setStatus] = useState('loading');
  const [vouchers, setVouchers] = useState([]);

  async function fetchVouchers() {
    setStatus('loading');
    try {
      const data = await listVouchers();
      setVouchers(data);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listVouchers();
        if (!cancelled) {
          setVouchers(data);
          setStatus('success');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card bg-base-100 shadow-md border border-base-300">
      <div className="card-body">
        <div className="flex items-center justify-between gap-4">
          <h2 className="card-title text-base-content/80 text-base">Flight list</h2>
          <button
            type="button"
            onClick={fetchVouchers}
            disabled={status === 'loading'}
            className="btn btn-sm btn-ghost"
          >
            {status === 'loading' ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-8">
            <span className="loading loading-spinner loading-md" aria-hidden="true" />
            <span>Loading flights…</span>
          </div>
        )}

        {status === 'error' && <ErrorBanner message={ERROR_MESSAGE} />}

        {status === 'success' && vouchers.length === 0 && (
          <p className="text-center py-8 text-base-content/60">
            No vouchers generated yet. Switch to the Generate tab to create one.
          </p>
        )}

        {status === 'success' && vouchers.length > 0 && (
          <div className="overflow-x-auto mt-2">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Crew</th>
                  <th>Flight</th>
                  <th>Date</th>
                  <th>Aircraft</th>
                  <th>Seats</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>{v.crew_name}</td>
                    <td className="font-mono">{v.flight_number}</td>
                    <td className="font-mono">{v.flight_date}</td>
                    <td>{v.aircraft_type}</td>
                    <td className="font-mono">{v.seats.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
