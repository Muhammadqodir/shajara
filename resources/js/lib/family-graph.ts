import dagre from 'dagre';

import type { Member, Relationship } from '@/types/family';

export const NODE_WIDTH = 208;
export const NODE_HEIGHT = 104;
// Wide enough to fit the little marriage card between a couple's two cards.
const SPOUSE_GAP = 112;
const RANK_SEP = 96;
const NODE_SEP = 54;

export interface ParentEdge {
    id: number;
    parentId: number;
    childId: number;
    /** Shared x-coordinate of the parent's household (couple's midpoint, or the
     *  parent's own center if single) — lets both parents' lines merge into one
     *  trunk before branching down to children. */
    trunkX: number;
}

export interface SpouseEdge {
    id: number;
    leftId: number;
    rightId: number;
    marriedAt: string | null;
}

export interface FamilyLayout {
    positions: Record<number, { x: number; y: number }>;
    parentEdges: ParentEdge[];
    spouseEdges: SpouseEdge[];
    width: number;
    height: number;
}

/**
 * Group members into "households" using spouse links (union-find), then run a
 * dagre hierarchy on the households so couples stay side-by-side on the same
 * generation and children hang below their parents.
 */
function buildHouseholds(memberIds: number[], spouseRels: Relationship[]): number[][] {
    const parent: Record<number, number> = {};
    memberIds.forEach((id) => (parent[id] = id));

    const find = (x: number): number => {
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };
    const union = (a: number, b: number) => {
        parent[find(a)] = find(b);
    };

    spouseRels.forEach((r) => {
        if (parent[r.from_member_id] !== undefined && parent[r.to_member_id] !== undefined) {
            union(r.from_member_id, r.to_member_id);
        }
    });

    const groups: Record<number, number[]> = {};
    memberIds.forEach((id) => {
        const root = find(id);
        (groups[root] ||= []).push(id);
    });

    return Object.values(groups).map((g) => g.sort((a, b) => a - b));
}

export function computeFamilyLayout(members: Member[], relationships: Relationship[]): FamilyLayout {
    const memberIds = members.map((m) => m.id);
    const spouseRels = relationships.filter((r) => r.type === 'spouse');
    const parentRels = relationships.filter((r) => r.type === 'parent');

    const households = buildHouseholds(memberIds, spouseRels);
    const householdOf: Record<number, number> = {};
    households.forEach((h, idx) => h.forEach((id) => (householdOf[id] = idx)));

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', ranksep: RANK_SEP, nodesep: NODE_SEP, marginx: 48, marginy: 48 });
    g.setDefaultEdgeLabel(() => ({}));

    households.forEach((h, idx) => {
        const width = h.length * NODE_WIDTH + (h.length - 1) * SPOUSE_GAP;
        g.setNode(String(idx), { width, height: NODE_HEIGHT });
    });

    const seenEdges = new Set<string>();
    parentRels.forEach((r) => {
        const parentHousehold = householdOf[r.from_member_id];
        const childHousehold = householdOf[r.to_member_id];
        if (parentHousehold === undefined || childHousehold === undefined || parentHousehold === childHousehold) {
            return;
        }
        const key = `${parentHousehold}->${childHousehold}`;
        if (seenEdges.has(key)) return;
        seenEdges.add(key);
        g.setEdge(String(parentHousehold), String(childHousehold));
    });

    dagre.layout(g);

    const positions: Record<number, { x: number; y: number }> = {};
    households.forEach((h, idx) => {
        const node = g.node(String(idx));
        if (!node) return;
        const left = node.x - node.width / 2;
        const top = node.y - node.height / 2;
        h.forEach((id, i) => {
            positions[id] = { x: left + i * (NODE_WIDTH + SPOUSE_GAP), y: top };
        });
    });

    // Shared center-x per household, so a couple's two parent-edges start from
    // the exact same point and visually merge into a single trunk line.
    const householdCenterX: Record<number, number> = {};
    households.forEach((h) => {
        const centers = h.map((id) => (positions[id]?.x ?? 0) + NODE_WIDTH / 2);
        const center = (Math.min(...centers) + Math.max(...centers)) / 2;
        h.forEach((id) => (householdCenterX[id] = center));
    });

    const parentEdges: ParentEdge[] = parentRels.map((r) => ({
        id: r.id,
        parentId: r.from_member_id,
        childId: r.to_member_id,
        trunkX: householdCenterX[r.from_member_id] ?? (positions[r.from_member_id]?.x ?? 0) + NODE_WIDTH / 2,
    }));

    // Order each spouse edge left-to-right by resolved x position.
    const spouseEdges: SpouseEdge[] = spouseRels.map((r) => {
        const a = r.from_member_id;
        const b = r.to_member_id;
        const ax = positions[a]?.x ?? 0;
        const bx = positions[b]?.x ?? 0;
        return ax <= bx
            ? { id: r.id, leftId: a, rightId: b, marriedAt: r.married_at }
            : { id: r.id, leftId: b, rightId: a, marriedAt: r.married_at };
    });

    const graphInfo = g.graph();

    return {
        positions,
        parentEdges,
        spouseEdges,
        width: graphInfo.width ?? 0,
        height: graphInfo.height ?? 0,
    };
}

/** Display helpers shared by nodes, panels and lists. */

export function fullName(member: Pick<Member, 'name' | 'surname'>): string {
    return [member.name, member.surname].filter(Boolean).join(' ');
}

export function initials(member: Pick<Member, 'name' | 'surname'>): string {
    return `${member.name?.[0] ?? ''}${member.surname?.[0] ?? ''}`.toUpperCase() || '?';
}

function year(date: string | null): number | null {
    if (!date) return null;
    const y = new Date(date).getFullYear();
    return Number.isNaN(y) ? null : y;
}

export function lifespan(member: Pick<Member, 'date_of_birth' | 'date_of_death'>): string | null {
    const birth = year(member.date_of_birth);
    const death = year(member.date_of_death);
    if (birth && death) return `${birth} – ${death}`;
    if (birth) return `tug. ${birth}`;
    if (death) return `vaf. ${death}`;
    return null;
}

export function isDeceased(member: Pick<Member, 'date_of_death'>): boolean {
    return Boolean(member.date_of_death);
}
