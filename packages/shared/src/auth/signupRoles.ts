import { ROLES } from './constants';

type PublicRoleId = 'renter' | 'buyer' | 'landlord' | 'owner' | 'realtor' | 'agent' | 'estate';
type Requirement = 'identity' | 'property' | 'license';

export interface SignupRoleGroup {
  id: 'find' | 'own' | 'work';
  title: string;
  /** What the group's roles need before this, read as "Before you {before}: …". */
  before: string;
  roles: readonly PublicRoleId[];
}

export const SIGNUP_ROLE_GROUPS: readonly SignupRoleGroup[] = [
  { id: 'find', title: 'Find a place', before: 'pay or sign', roles: ['renter', 'buyer'] },
  {
    id: 'own',
    title: 'Own or let property',
    before: 'list or collect rent',
    roles: ['landlord', 'owner'],
  },
  {
    id: 'work',
    title: 'Work in property',
    before: 'take on work',
    roles: ['realtor', 'agent', 'estate'],
  },
];

export const REALTOR_VS_AGENT =
  'Realtors find clients and close deals. Agents act for one landlord or owner, with the permissions they give.';

export const REQUIREMENT_PLAIN: Record<Requirement, string> = {
  identity: 'ID check',
  property: 'property documents',
  license: 'practising licence',
};

const REQUIREMENT_ORDER: readonly Requirement[] = ['identity', 'property', 'license'];

export interface SignupRequirementLine {
  groupId: SignupRoleGroup['id'];
  text: string;
}

/** One line per group the picks touch, each requirement named once within it. */
export function signupRequirementLines(roleIds: readonly string[]): SignupRequirementLine[] {
  const roles = Object.values(ROLES);
  return SIGNUP_ROLE_GROUPS.flatMap((group) => {
    const needs = new Set<Requirement>();
    for (const id of group.roles) {
      if (!roleIds.includes(id)) continue;
      const role = roles.find((r) => r.id === id);
      role?.requiresVerification.forEach((req) => needs.add(req as Requirement));
    }
    if (needs.size === 0) return [];
    const list = REQUIREMENT_ORDER.filter((req) => needs.has(req)).map(
      (req) => REQUIREMENT_PLAIN[req]
    );
    return [{ groupId: group.id, text: `Before you ${group.before}: ${list.join(', ')}` }];
  });
}

/** Said once when several lines ask for ID, so it does not read as several checks. */
export const ONE_ID_CHECK = 'One ID check covers all of them.';

export function needsSharedIdNote(lines: readonly SignupRequirementLine[]): boolean {
  return lines.filter((line) => line.text.includes(REQUIREMENT_PLAIN.identity)).length > 1;
}
