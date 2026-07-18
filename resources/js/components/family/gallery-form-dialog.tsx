import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fullName, initials } from '@/lib/family-graph';
import type { GalleryItem, MemberSummary } from '@/types/family';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    item?: GalleryItem | null;
    members: MemberSummary[];
}

type FormShape = {
    image_url: string;
    description: string;
    member_ids: number[];
};

function GalleryForm({ mode, item, members, onDone }: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) {
    const { data, setData, post, put, processing, errors } = useForm<FormShape>({
        image_url: item?.image_url ?? '',
        description: item?.description ?? '',
        member_ids: item?.members.map((m) => m.id) ?? [],
    });

    const toggleMember = (id: number, checked: boolean) => {
        setData('member_ids', checked ? [...data.member_ids, id] : data.member_ids.filter((m) => m !== id));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => onDone() };
        if (mode === 'edit' && item) {
            put(`/gallery/${item.id}`, options);
        } else {
            post('/gallery', options);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" type="url" value={data.image_url} onChange={(e) => setData('image_url', e.target.value)} placeholder="https://…" autoFocus />
                <InputError message={errors.image_url} />
            </div>

            {data.image_url ? (
                <div className="bg-secondary aspect-video w-full overflow-hidden rounded-md border">
                    <img src={data.image_url} alt="Preview" className="h-full w-full object-cover" />
                </div>
            ) : null}

            <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Where and when was this taken?" />
                <InputError message={errors.description} />
            </div>

            <div className="space-y-1.5">
                <Label>Tagged members</Label>
                {members.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Add family members first to tag them.</p>
                ) : (
                    <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-2">
                        {members.map((m) => (
                            <label key={m.id} className="hover:bg-secondary/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5">
                                <Checkbox checked={data.member_ids.includes(m.id)} onCheckedChange={(c) => toggleMember(m.id, Boolean(c))} />
                                <Avatar className="size-6 rounded-md">
                                    {m.photo_url ? <AvatarImage src={m.photo_url} alt={fullName(m)} className="object-cover" /> : null}
                                    <AvatarFallback className="bg-secondary rounded-md text-[10px]">{initials(m)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{fullName(m)}</span>
                            </label>
                        ))}
                    </div>
                )}
                <InputError message={errors.member_ids} />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={processing}>
                    {processing ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
                    {mode === 'edit' ? 'Save changes' : 'Add photo'}
                </Button>
            </DialogFooter>
        </form>
    );
}

export function GalleryFormDialog({ open, onOpenChange, mode, item, members }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit photo' : 'Add photo'}</DialogTitle>
                    <DialogDescription>Link a photo by URL and tag the family members in it.</DialogDescription>
                </DialogHeader>
                {open ? <GalleryForm key={`${mode}-${item?.id ?? 'new'}`} mode={mode} item={item} members={members} onDone={() => onOpenChange(false)} /> : null}
            </DialogContent>
        </Dialog>
    );
}
