export function LinedNoteRuleRows({ count }: { count: number }) {
  const safeCount = Math.max(1, count);

  return (
    <div className="ln-rows" aria-hidden="true">
      {Array.from({ length: safeCount }, (_, index) => (
        <div key={index} className="ln-row" />
      ))}
    </div>
  );
}
