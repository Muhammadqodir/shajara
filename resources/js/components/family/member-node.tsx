import { Handle, Position, type NodeProps } from '@xyflow/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fullName, initials, isDeceased, lifespan } from '@/lib/family-graph';
import { cn } from '@/lib/utils';
import type { Member } from '@/types/family';

export interface MemberNodeData {
    member: Member;
    isSelected?: boolean;
    [key: string]: unknown;
}

const handleClass =
    '!h-2.5 !w-2.5 !rounded-full !border !border-background !bg-muted-foreground/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100';

export function MemberNode({ data }: NodeProps) {
    const { member, isSelected } = data as MemberNodeData;
    const span = lifespan(member);
    const deceased = isDeceased(member);

    return (
        <div
            className={cn(
                'group relative flex w-52 items-center gap-3 rounded-xl border bg-card px-3 py-3 shadow-sm transition-all duration-150',
                isSelected ? 'border-primary ring-primary/50 ring-2' : 'border-border hover:border-foreground/40 hover:shadow-md',
            )}
        >
            <Handle id="top" type="target" position={Position.Top} className={handleClass} />
            <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} />
            <Handle id="left" type="target" position={Position.Left} className={handleClass} />
            <Handle id="right" type="source" position={Position.Right} className={handleClass} />

            <Avatar className={cn('size-12 shrink-0 rounded-lg', deceased && 'grayscale')}>
                {member.photo_url ? <AvatarImage src={member.photo_url} alt={fullName(member)} className="object-cover" /> : null}
                <AvatarFallback className="bg-secondary rounded-lg text-sm font-medium">{initials(member)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0">
                <div className="truncate text-sm leading-tight font-semibold">{member.name}</div>
                {member.surname ? <div className="text-muted-foreground truncate text-xs">{member.surname}</div> : null}
                <div className="mt-1 flex items-center gap-1.5">
                    {span ? <span className="text-muted-foreground text-[11px]">{span}</span> : null}
                    {deceased ? (
                        <span title="Deceased" className="text-muted-foreground text-[11px] leading-none">
                            †
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
