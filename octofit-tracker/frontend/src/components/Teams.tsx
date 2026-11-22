import { CapabilityCard } from './CapabilityCard.js';
export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      responseKey="teams"
      emptyText="No teams"
      renderItem={(team) => (
        <span>{String(team.name)}{Array.isArray(team.members) ? ` - ${team.members.length} members` : ''}</span>
      )}
    />
  );
}
