import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Member } from '@/types/family';

export type RelateAs = 'parent' | 'child' | 'spouse';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    member?: Member | null;
    relateTo?: number | null;
    relateAs?: RelateAs | null;
    relateToName?: string | null;
}

type FormShape = {
    name: string;
    surname: string;
    gender: string;
    date_of_birth: string;
    date_of_death: string;
    profession: string;
    birth_place: string;
    death_place: string;
    photo_url: string;
    description: string;
    relate_to: number | '';
    relate_as: string;
};

function MemberForm({ mode, member, relateTo, relateAs, onDone }: Omit<Props, 'open' | 'onOpenChange' | 'relateToName'> & { onDone: () => void }) {
    const { data, setData, post, put, processing, errors } = useForm<FormShape>({
        name: member?.name ?? '',
        surname: member?.surname ?? '',
        gender: member?.gender ?? '',
        date_of_birth: member?.date_of_birth ?? '',
        date_of_death: member?.date_of_death ?? '',
        profession: member?.profession ?? '',
        birth_place: member?.birth_place ?? '',
        death_place: member?.death_place ?? '',
        photo_url: member?.photo_url ?? '',
        description: member?.description ?? '',
        relate_to: relateTo ?? '',
        relate_as: relateAs ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onDone() };
        if (mode === 'edit' && member) {
            put(`/members/${member.id}`, options);
        } else {
            post('/members', options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">First name</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus placeholder="Jane" />
                    <InputError message={errors.name} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="surname">Surname</Label>
                    <Input id="surname" value={data.surname} onChange={(e) => setData('surname', e.target.value)} placeholder="Whitfield" />
                    <InputError message={errors.surname} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={data.gender} onValueChange={(v) => setData('gender', v)}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <InputError message={errors.gender} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" value={data.profession} onChange={(e) => setData('profession', e.target.value)} placeholder="Architect" />
                    <InputError message={errors.profession} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth">Date of birth</Label>
                    <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                    <InputError message={errors.date_of_birth} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="date_of_death">Date of death</Label>
                    <Input id="date_of_death" type="date" value={data.date_of_death} onChange={(e) => setData('date_of_death', e.target.value)} />
                    <InputError message={errors.date_of_death} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="birth_place">Birth place</Label>
                    <Input id="birth_place" value={data.birth_place} onChange={(e) => setData('birth_place', e.target.value)} placeholder="York, England" />
                    <InputError message={errors.birth_place} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="death_place">Death place</Label>
                    <Input id="death_place" value={data.death_place} onChange={(e) => setData('death_place', e.target.value)} />
                    <InputError message={errors.death_place} />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input id="photo_url" type="url" value={data.photo_url} onChange={(e) => setData('photo_url', e.target.value)} placeholder="https://…" />
                <InputError message={errors.photo_url} />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="A short biography…" />
                <InputError message={errors.description} />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={processing}>
                    {processing ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
                    {mode === 'edit' ? 'Save changes' : 'Add member'}
                </Button>
            </DialogFooter>
        </form>
    );
}

const relationLabel: Record<RelateAs, string> = {
    parent: 'parent',
    child: 'child',
    spouse: 'spouse',
};

export function MemberFormDialog({ open, onOpenChange, mode, member, relateTo, relateAs, relateToName }: Props) {
    const title =
        mode === 'edit'
            ? 'Edit member'
            : relateAs && relateToName
              ? `Add ${relationLabel[relateAs]} of ${relateToName}`
              : 'Add family member';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? 'Update the details for this family member.' : 'Only a first name is required — everything else is optional.'}
                    </DialogDescription>
                </DialogHeader>
                {open ? (
                    <MemberForm
                        key={`${mode}-${member?.id ?? 'new'}-${relateTo ?? ''}-${relateAs ?? ''}`}
                        mode={mode}
                        member={member}
                        relateTo={relateTo}
                        relateAs={relateAs}
                        onDone={() => onOpenChange(false)}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
