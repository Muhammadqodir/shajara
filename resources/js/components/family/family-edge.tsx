import { BaseEdge, type EdgeProps } from '@xyflow/react';

const CORNER_RADIUS = 14;

export interface FamilyEdgeData {
    /** Shared x-coordinate of the parent household — where both parents'
     *  lines merge into a single trunk before branching to children. */
    trunkX: number;
    [key: string]: unknown;
}

/**
 * Draws a rounded "trunk + bus" connector: a single vertical line drops from
 * the parent household's shared center, runs across at the midpoint between
 * generations, then drops into the child. When two parents share a household,
 * both of their edges to a child use the identical trunkX/bus geometry, so
 * their lines overlap perfectly and read as one merged connector.
 */
export function FamilyEdge({ sourceY, targetX, targetY, data, style, markerEnd }: EdgeProps) {
    const trunkX = (data as FamilyEdgeData | undefined)?.trunkX ?? targetX;
    const busY = sourceY + (targetY - sourceY) / 2;
    const dir = Math.sign(targetX - trunkX);

    let path: string;

    if (dir === 0) {
        path = `M ${trunkX},${sourceY} L ${targetX},${targetY}`;
    } else {
        const r = Math.max(0, Math.min(CORNER_RADIUS, Math.abs(targetX - trunkX) / 2, Math.abs(busY - sourceY), Math.abs(targetY - busY)));

        path = [
            `M ${trunkX},${sourceY}`,
            `L ${trunkX},${busY - r}`,
            `Q ${trunkX},${busY} ${trunkX + dir * r},${busY}`,
            `L ${targetX - dir * r},${busY}`,
            `Q ${targetX},${busY} ${targetX},${busY + r}`,
            `L ${targetX},${targetY}`,
        ].join(' ');
    }

    return <BaseEdge path={path} style={style} markerEnd={markerEnd} />;
}
