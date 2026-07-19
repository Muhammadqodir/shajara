import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react';
import { Heart, Plus } from 'lucide-react';

export interface MarriageEdgeData {
    relationshipId: number;
    marriedAt: string | null;
    leftId: number;
    rightId: number;
    onAddChild?: (leftId: number, rightId: number) => void;
    onEditDate?: (relationshipId: number, marriedAt: string | null) => void;
    [key: string]: unknown;
}

function marriageYear(date: string | null): number | null {
    if (!date) return null;
    const y = new Date(date).getFullYear();
    return Number.isNaN(y) ? null : y;
}

/**
 * A small interactive card overlaid at the midpoint of a spouse edge — shows
 * the marriage year (click to edit) and a quick "add child" action that links
 * the new member to both spouses at once.
 */
export function MarriageEdge({ sourceX, sourceY, targetX, targetY, style, data }: EdgeProps) {
    const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    const { relationshipId, marriedAt, leftId, rightId, onAddChild, onEditDate } = (data as MarriageEdgeData | undefined) ?? {};
    const y = marriageYear(marriedAt ?? null);

    return (
        <>
            <BaseEdge path={path} style={style} />
            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan bg-card absolute flex w-24 flex-col overflow-hidden rounded-lg border shadow-sm"
                    style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (relationshipId !== undefined) onEditDate?.(relationshipId, marriedAt ?? null);
                        }}
                        title="Turmush sanasini tahrirlash"
                        className="text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors"
                    >
                        <Heart className="size-3" />
                        {y ?? 'sana'}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (leftId !== undefined && rightId !== undefined) onAddChild?.(leftId, rightId);
                        }}
                        title="Farzand qo'shish"
                        className="text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center gap-1 border-t px-2 py-1 text-[11px] font-medium transition-colors"
                    >
                        <Plus className="size-3" />
                        Farzand
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
