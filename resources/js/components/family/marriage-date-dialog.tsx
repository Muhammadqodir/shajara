import { router, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    relationshipId: number | null;
    marriedAt: string | null;
}

function MarriageDateForm({ relationshipId, marriedAt, onDone }: { relationshipId: number; marriedAt: string | null; onDone: () => void }) {
    const { data, setData, put, processing } = useForm<{ married_at: string }>({
        married_at: marriedAt ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/relationships/${relationshipId}`, { preserveScroll: true, onSuccess: onDone });
    };

    const clear = () => {
        router.put(`/relationships/${relationshipId}`, { married_at: '' }, { preserveScroll: true, onSuccess: onDone });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="married_at">Turmush qurgan sana</Label>
                <Input id="married_at" type="date" value={data.married_at} onChange={(e) => setData('married_at', e.target.value)} autoFocus />
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
                {marriedAt ? (
                    <Button type="button" variant="ghost" className="text-muted-foreground" onClick={clear}>
                        Tozalash
                    </Button>
                ) : (
                    <span />
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
                    Saqlash
                </Button>
            </DialogFooter>
        </form>
    );
}

export function MarriageDateDialog({ open, onOpenChange, relationshipId, marriedAt }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Turmush sanasi</DialogTitle>
                    <DialogDescription>Er-xotinning turmush qurgan sanasini belgilang.</DialogDescription>
                </DialogHeader>
                {open && relationshipId ? (
                    <MarriageDateForm key={relationshipId} relationshipId={relationshipId} marriedAt={marriedAt} onDone={() => onOpenChange(false)} />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
