export default function SeatResults({ seats, crewName }) {
  return (
    <section className="card bg-success text-success-content shadow-lg">
      <div className="card-body">
        <div className="flex items-center justify-between gap-4">
          <h2 className="card-title">Seats assigned</h2>
          <span className="badge badge-success bg-success-content text-success">
            Confirmed
          </span>
        </div>
        {crewName && (
          <p className="text-sm opacity-90">
            <span className="opacity-70">Crew:</span> <span className="font-medium">{crewName}</span>
          </p>
        )}
        <div className="stats stats-vertical sm:stats-horizontal bg-success-content text-success shadow-sm mt-4 w-full">
          {seats.map((seat, i) => {
            const n = i + 1;
            return (
              <div key={n} className="stat place-items-center" aria-label={`Seat ${n}`}>
                <div className="stat-title">Seat {n}:</div>
                <div className="stat-value text-3xl">{seat}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
