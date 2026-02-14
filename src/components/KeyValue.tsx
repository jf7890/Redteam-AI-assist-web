export function KeyValue({ label, value }: { label: string; value: any }) {
  return (
    <div className="kv">
      <div className="kvLabel">{label}</div>
      <div className="kvValue">{value === undefined || value === null || value === "" ? <span className="muted">—</span> : String(value)}</div>
    </div>
  );
}
