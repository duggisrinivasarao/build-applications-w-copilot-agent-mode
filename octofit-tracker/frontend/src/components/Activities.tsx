import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      responseKey="activities"
      emptyText="No activities"
      load={() => getJson<Record<string, unknown>>('/api/activities')}
      renderItem={(activity) => (
        <span>{String(activity.type)} - {String(activity.minutes)} minutes, {String(activity.points)} points</span>
      )}
    />
  );
}
