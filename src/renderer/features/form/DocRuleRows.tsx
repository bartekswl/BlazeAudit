export function DocRuleRows({ count }: { count: number }) {
  const safeCount = Math.max(1, count);

  return (
    <div className="doc-ruled-lines" aria-hidden="true">
      {Array.from({ length: safeCount }, (_, index) => (
        <div key={index} className="doc-ruled-line" />
      ))}
    </div>
  );
}
