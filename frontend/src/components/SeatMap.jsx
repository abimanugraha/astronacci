import { SEAT_LAYOUTS } from '../lib/seatLayout';

export default function SeatMap({ aircraftType, wonSeats }) {
  const layout = SEAT_LAYOUTS[aircraftType];
  if (!layout) return null;
  const won = new Set(wonSeats);

  return (
    <section aria-label={`Seat map for ${aircraftType}`}>
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base-content/80 text-base">Seat map ({aircraftType})</h2>
          <div className="flex flex-col items-center gap-1 font-mono text-xs">
            {Array.from({ length: layout.rows }, (_, i) => i + 1).map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-6 text-right text-base-content/40" aria-hidden="true">{row}</span>
                <ul className="flex gap-1">
                  {layout.left.map((letter) => (
                    <Seat
                      key={`${row}${letter}`}
                      label={`${row}${letter}`}
                      won={won.has(`${row}${letter}`)}
                    />
                  ))}
                </ul>
                <span className="w-4" aria-hidden="true" />
                <ul className="flex gap-1">
                  {layout.right.map((letter) => (
                    <Seat
                      key={`${row}${letter}`}
                      label={`${row}${letter}`}
                      won={won.has(`${row}${letter}`)}
                    />
                  ))}
                </ul>
                <span className="w-6 text-right text-base-content/40" aria-hidden="true">{row}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-base-content/60">
            <span className="inline-block w-2 h-2 rounded-full bg-success align-middle mr-1" aria-hidden="true" />
            voucher won
          </p>
        </div>
      </div>
    </section>
  );
}

function Seat({ label, won }) {
  return (
    <li
      aria-label={won ? `${label} (voucher)` : label}
      className={
        'inline-flex items-center justify-center w-7 h-7 rounded text-[11px] border ' +
        (won
          ? 'bg-success text-success-content border-success'
          : 'bg-base-200 text-base-content/70 border-base-300')
      }
    >
      {label}
    </li>
  );
}
