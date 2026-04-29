export const calculateAdvancedStats = (logs, rangeType, anchorDate) => {
  const counts = { Jammat: 0, Individual: 0, Qaza: 0, Missed: 0 };
  const scoreMap = { Jammat: 3, Individual: 2, Qaza: 1, Missed: 0 };
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Get Range Start (Simplified IST)
  const rangeStart = new Date(); 
  if (rangeType === 'weekly') rangeStart.setDate(now.getDate() - now.getDay() + 1);
  else if (rangeType === 'monthly') rangeStart.setDate(1);
  else if (rangeType === 'yearly') rangeStart.setMonth(0, 1);

  // 2. Effective Start (Don't count days before user joined)
  const effectiveStart = new Date(anchorDate) > rangeStart ? new Date(anchorDate) : rangeStart;
  const daysPassed = Math.ceil(Math.abs(new Date(todayStr) - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;

  // 3. Totals
  let earnedScore = 0;
  let recordedCount = 0;
  logs.forEach(log => {
    Object.values(log.salah).forEach(status => {
      counts[status]++;
      earnedScore += (scoreMap[status] || 0);
      recordedCount++;
    });
  });

  // 4. Fill Gap as Missed
  const expectedByToday = daysPassed * 5;
  const missing = expectedByToday - recordedCount;
  if (missing > 0) counts.Missed += missing;

  return {
    counts,
    efficiency: ((earnedScore / (daysPassed * 15)) * 100).toFixed(1),
    volume: recordedCount,
    goal: rangeType === 'weekly' ? 35 : rangeType === 'monthly' ? 150 : 1825
  };
};