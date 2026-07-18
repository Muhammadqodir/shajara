import { router } from '@inertiajs/react';
import { Briefcase, MapPin, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react';

import type { RelateAs } from '@/components/family/member-form-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { fullName, initials, isDeceased, lifespan } from '@/lib/family-graph';
import type { Member, Relationship } from '@/types/family';

interface Props {
    member: Member | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: Member[];
    relationships: Relationship[];
    onEdit: (member: Member) => void;
    onAddRelative: (member: Member, relateAs: RelateAs) => void;
    onSelectMember: (id: number) => void;
}

interface RelationEntry {
    relationshipId: number;
    person: Member;
}

function RelationList({
    label,
    entries,
    emptyHint,
    onSelect,
    onRemove,
}: {
    label: string;
    entries: RelationEntry[];
    emptyHint: string;
    onSelect: (id: number) => void;
    onRemove: (relationshipId: number) => void;
}) {
    return (
        <div className="space-y-2">
            <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</h4>
            {entries.length === 0 ? (
                <p className="text-muted-foreground/70 text-sm">{emptyHint}</p>
            ) : (
                <ul className="space-y-1">
                    {entries.map(({ relationshipId, person }) => (
                        <li key={relationshipId} className="group hover:bg-secondary/60 flex items-center gap-2 rounded-md px-2 py-1.5">
                            <button type="button" onClick={() => onSelect(person.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                                <Avatar className="size-7 rounded-md">
                                    {person.photo_url ? <AvatarImage src={person.photo_url} alt={fullName(person)} className="object-cover" /> : null}
                                    <AvatarFallback className="bg-secondary rounded-md text-[10px]">{initials(person)}</AvatarFallback>
                                </Avatar>
                                <span className="truncate text-sm">{fullName(person)}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(relationshipId)}
                                title="Bog'lanishni o'chirish"
                                className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <X className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function MemberDetailSheet({ member, open, onOpenChange, members, relationships, onEdit, onAddRelative, onSelectMember }: Props) {
    if (!member) return null;

    const byId = new Map(members.map((m) => [m.id, m]));
    const resolve = (id: number) => byId.get(id);

    const parents: RelationEntry[] = relationships
        .filter((r) => r.type === 'parent' && r.to_member_id === member.id)
        .map((r) => ({ relationshipId: r.id, person: resolve(r.from_member_id) }))
        .filter((e): e is RelationEntry => Boolean(e.person));

    const children: RelationEntry[] = relationships
        .filter((r) => r.type === 'parent' && r.from_member_id === member.id)
        .map((r) => ({ relationshipId: r.id, person: resolve(r.to_member_id) }))
        .filter((e): e is RelationEntry => Boolean(e.person));

    const spouses: RelationEntry[] = relationships
        .filter((r) => r.type === 'spouse' && (r.from_member_id === member.id || r.to_member_id === member.id))
        .map((r) => ({
            relationshipId: r.id,
            person: resolve(r.from_member_id === member.id ? r.to_member_id : r.from_member_id),
        }))
        .filter((e): e is RelationEntry => Boolean(e.person));

    const span = lifespan(member);
    const deceased = isDeceased(member);

    const removeRelationship = (id: number) => router.delete(`/relationships/${id}`, { preserveScroll: true });

    const deleteMember = () => {
        if (!window.confirm(`${fullName(member)}ni o'chirasizmi? Bu uning barcha bog'lanishlarini ham o'chiradi.`)) return;
        router.delete(`/members/${member.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
                <SheetHeader className="space-y-0 p-6 pb-4">
                    <div className="flex items-start gap-4">
                        <Avatar className={`size-16 rounded-xl ${deceased ? 'grayscale' : ''}`}>
                            {member.photo_url ? <AvatarImage src={member.photo_url} alt={fullName(member)} className="object-cover" /> : null}
                            <AvatarFallback className="bg-secondary rounded-xl text-lg font-medium">{initials(member)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 pt-1">
                            <SheetTitle className="truncate text-xl">{fullName(member)}</SheetTitle>
                            <SheetDescription className="mt-0.5">
                                {span ?? "Sanalar noma'lum"}
                                {deceased ? ' · Vafot etgan' : ''}
                            </SheetDescription>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {member.profession ? (
                                    <Badge variant="secondary" className="gap-1 font-normal">
                                        <Briefcase className="size-3" />
                                        {member.profession}
                                    </Badge>
                                ) : null}
                                {member.gender ? (
                                    <Badge variant="outline" className="font-normal">
                                        {member.gender === 'male' ? 'Erkak' : 'Ayol'}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(member)}>
                            <Pencil className="mr-1.5 size-3.5" /> Tahrirlash
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={deleteMember}>
                            <Trash2 className="mr-1.5 size-3.5" /> O'chirish
                        </Button>
                    </div>
                </SheetHeader>

                <Separator />

                <div className="space-y-5 p-6">
                    {member.description ? <p className="text-sm leading-relaxed">{member.description}</p> : null}

                    {member.birth_place || member.death_place ? (
                        <div className="text-muted-foreground space-y-1.5 text-sm">
                            {member.birth_place ? (
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 shrink-0" /> {member.birth_place}da tug'ilgan
                                </div>
                            ) : null}
                            {member.death_place ? (
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 shrink-0" /> {member.death_place}da vafot etgan
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <Separator />

                    <RelationList label="Ota-onalar" entries={parents} emptyHint="Ota-onalar bog'lanmagan." onSelect={onSelectMember} onRemove={removeRelationship} />
                    <RelationList label="Turmush o'rtoqlari" entries={spouses} emptyHint="Turmush o'rtog'i bog'lanmagan." onSelect={onSelectMember} onRemove={removeRelationship} />
                    <RelationList label="Farzandlar" entries={children} emptyHint="Farzandlar bog'lanmagan." onSelect={onSelectMember} onRemove={removeRelationship} />
                </div>

                <div className="bg-background/80 sticky bottom-0 mt-auto border-t p-4 backdrop-blur">
                    <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Qarindosh qo'shish</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Button size="sm" variant="outline" onClick={() => onAddRelative(member, 'parent')}>
                            <Plus className="mr-1 size-3.5" /> Ota-ona
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onAddRelative(member, 'spouse')}>
                            <UserPlus className="mr-1 size-3.5" /> Turmush o'rtoq
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onAddRelative(member, 'child')}>
                            <Plus className="mr-1 size-3.5" /> Farzand
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
