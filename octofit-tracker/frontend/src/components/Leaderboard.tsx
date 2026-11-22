import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      responseKey="leaderboard"
      emptyText="No leaderboard rankings or scores"
      load={() => getJson<Record<string, unknown>>('/api/leaderboard')}
      renderItem={(entry) => (
        <span>{String(entry.teamName)} - {String(entry.totalPoints)} points</span>
      )}
    />
  );
}
