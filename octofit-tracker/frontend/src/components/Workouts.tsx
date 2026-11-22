import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Workouts() {
  const email = 'mona@example.com';
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      responseKey="suggestions"
      emptyText="No workout suggestions"
      load={() => getJson<Record<string, unknown>>(`/api/workouts/suggestions/${encodeURIComponent(email)}`)}
      renderItem={(suggestion) => (
        <span>{String(suggestion.title)}{typeof suggestion.reason === 'string' ? ` - ${suggestion.reason}` : ''}</span>
      )}
    />
  );
}
