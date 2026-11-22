import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      responseKey="teams"
      emptyText="No teams"
      load={() => getJson<Record<string, unknown>>('/api/teams')}
      renderItem={(team) => (
        <span>{String(team.name)}{Array.isArray(team.members) ? ` - ${team.members.length} members` : ''}</span>
      )}
    />
  );
}
