/**
 * La dirección con la altura en rojo de numerador, que es el dato que uno busca
 * en la puerta. Sin número, la dirección va tal cual.
 */
export function Address({ address, className = "" }: { address: string; className?: string }) {
  const street = address.split(",")[0];
  const match = street.match(/^(.*?)(\d+)\s*$/);
  if (!match) return <span className={className}>{street}</span>;
  return (
    <span className={className}>
      {match[1]}
      <span className="font-bold tabular-nums text-numerador">{match[2]}</span>
    </span>
  );
}
