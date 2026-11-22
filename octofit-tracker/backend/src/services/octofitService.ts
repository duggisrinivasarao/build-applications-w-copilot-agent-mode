import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity data is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || !mongoose.isObjectIdOrHexString(userId)
    || typeof teamId !== 'string'
    || !mongoose.isObjectIdOrHexString(teamId)
  ) {
    throw Object.assign(new Error('A valid userId and teamId are required'), { status: 400 });
  }

  if (typeof type !== 'string' || type.trim().length === 0) {
    throw Object.assign(new Error('Activity type is required'), { status: 400 });
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team data is required'), { status: 400 });
  }

  const { name, mascot, members } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = members === undefined ? [] : members;
  if (!Array.isArray(memberIds)) {
    throw Object.assign(new Error('Team members must be an array'), { status: 400 });
  }
  if (memberIds.some((id) => typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id))) {
    throw Object.assign(new Error('Team members must contain valid user IDs'), { status: 400 });
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  const existingMembers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id').lean();
  if (existingMembers.length !== uniqueMemberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: uniqueMemberIds,
  });
}

export async function getLeaderboard() {
  const [teams, activityTotals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);

  const totalsByTeam = new Map(
    activityTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]),
  );

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) =>
      right.totalPoints - left.totalPoints
      || left.teamName.localeCompare(right.teamName),
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();

  let focus = user.fitnessGoal;
  let reason = `Matches your ${user.fitnessGoal} fitness goal`;

  if (recentActivity) {
    const activityType = recentActivity.type.toLowerCase();
    if (activityType === 'run' || activityType === 'cycle' || activityType === 'walk') {
      focus = 'endurance';
      reason = `Based on your recent ${recentActivity.type} activity`;
    } else if (activityType === 'strength') {
      focus = 'strength';
      reason = 'Based on your recent strength activity';
    }
  }

  const matchingWorkout = await Workout.findOne({ focus }).lean();
  if (!matchingWorkout) {
    return [];
  }

  return [{
    ...matchingWorkout,
    reason,
  }];
}

export { User };
