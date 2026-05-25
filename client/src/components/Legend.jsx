export default function Legend({ empleados }) {
  return (
    <div className="legend">
      {empleados.map(e => (
        <div key={e.legajo} className="legend-item">
          <div className="legend-color" style={{ background: e.color }}></div>
          <span>{e.nombre} ({e.legajo})</span>
        </div>
      ))}
    </div>
  );
}
