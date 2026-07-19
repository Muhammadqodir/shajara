import { useForm } from '@inertiajs/react';
import { ImagePlus, LoaderCircle, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { initials } from '@/lib/family-graph';
import { cn } from '@/lib/utils';
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
    /** When adding a child from a couple's shared marriage card, the second parent's id. */
    relateToSpouse?: number | null;
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
    description: string;
    photo: File | null;
    remove_photo: boolean;
    relate_to: number | '';
    relate_as: string;
    relate_to_spouse: number | '';
};

const GENDERS: { value: string; label: string }[] = [
    { value: 'male', label: 'Erkak' },
    { value: 'female', label: 'Ayol' },
];

function GenderChips({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="flex gap-2">
            {GENDERS.map((option) => {
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(active ? '' : option.value)}
                        className={cn(
                            'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-[color,box-shadow] outline-none',
                            'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                            active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

function PhotoField({
    name,
    preview,
    onSelect,
    onRemove,
    error,
}: {
    name: string;
    preview: string | null;
    onSelect: (file: File) => void;
    onRemove: () => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onSelect(file);
        e.target.value = '';
    };

    return (
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-[color,box-shadow] outline-none',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    preview ? 'border-border' : 'border-input border-dashed hover:bg-secondary',
                )}
                aria-label="Rasm yuklash"
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : name ? (
                    <span className="text-muted-foreground text-xl font-medium">{initials({ name, surname: null })}</span>
                ) : (
                    <ImagePlus className="text-muted-foreground size-6" />
                )}
            </button>

            <div className="space-y-1.5">
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                        <ImagePlus className="mr-1.5 size-3.5" />
                        {preview ? "O'zgartirish" : 'Rasm yuklash'}
                    </Button>
                    {preview ? (
                        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={onRemove}>
                            <X className="mr-1 size-3.5" /> O'chirish
                        </Button>
                    ) : null}
                </div>
                <p className="text-muted-foreground text-xs">JPG, PNG, WEBP yoki GIF · 5 MB gacha.</p>
                <InputError message={error} />
            </div>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </div>
    );
}

function MemberForm({
    mode,
    member,
    relateTo,
    relateAs,
    relateToSpouse,
    onDone,
}: Omit<Props, 'open' | 'onOpenChange' | 'relateToName'> & { onDone: () => void }) {
    const { data, setData, transform, post, processing, errors } = useForm<FormShape>({
        name: member?.name ?? '',
        surname: member?.surname ?? '',
        gender: member?.gender ?? '',
        date_of_birth: member?.date_of_birth ?? '',
        date_of_death: member?.date_of_death ?? '',
        profession: member?.profession ?? '',
        birth_place: member?.birth_place ?? '',
        death_place: member?.death_place ?? '',
        description: member?.description ?? '',
        photo: null,
        remove_photo: false,
        relate_to: relateTo ?? '',
        relate_as: relateAs ?? '',
        relate_to_spouse: relateToSpouse ?? '',
    });

    const [deceased, setDeceased] = useState<boolean>(Boolean(member?.date_of_death || member?.death_place));
    const [preview, setPreview] = useState<string | null>(member?.photo_url ?? null);
    const objectUrl = useRef<string | null>(null);

    const setPhotoFile = (file: File) => {
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = URL.createObjectURL(file);
        setPreview(objectUrl.current);
        setData((prev) => ({ ...prev, photo: file, remove_photo: false }));
    };

    const removePhoto = () => {
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = null;
        setPreview(null);
        setData((prev) => ({ ...prev, photo: null, remove_photo: true }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        transform((payload) => {
            const out = { ...payload };
            if (!deceased) {
                out.date_of_death = '';
                out.death_place = '';
            }
            if (mode === 'edit') {
                (out as Record<string, unknown>)._method = 'put';
            }
            return out;
        });

        const url = mode === 'edit' && member ? `/members/${member.id}` : '/members';
        post(url, { forceFormData: true, preserveScroll: true, onSuccess: () => onDone() });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <PhotoField name={data.name} preview={preview} onSelect={setPhotoFile} onRemove={removePhoto} error={errors.photo} />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Ism</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus placeholder="Dilnoza" />
                    <InputError message={errors.name} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="surname">Familiya</Label>
                    <Input id="surname" value={data.surname} onChange={(e) => setData('surname', e.target.value)} placeholder="Karimova" />
                    <InputError message={errors.surname} />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Jinsi</Label>
                <GenderChips value={data.gender} onChange={(v) => setData('gender', v)} />
                <InputError message={errors.gender} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="profession">Kasbi</Label>
                    <Input id="profession" value={data.profession} onChange={(e) => setData('profession', e.target.value)} placeholder="Arxitektor" />
                    <InputError message={errors.profession} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="date_of_birth">Tug'ilgan sana</Label>
                    <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                    <InputError message={errors.date_of_birth} />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="birth_place">Tug'ilgan joyi</Label>
                <Input id="birth_place" value={data.birth_place} onChange={(e) => setData('birth_place', e.target.value)} placeholder="Toshkent, O'zbekiston" />
                <InputError message={errors.birth_place} />
            </div>

            <label className="hover:bg-secondary/50 flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5">
                <Checkbox checked={deceased} onCheckedChange={(c) => setDeceased(Boolean(c))} />
                <span className="text-sm font-medium">Vafot etgan</span>
                <span className="text-muted-foreground text-xs">Vafot sanasi va joyini qo'shish</span>
            </label>

            {deceased ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="date_of_death">Vafot sanasi</Label>
                        <Input id="date_of_death" type="date" value={data.date_of_death} onChange={(e) => setData('date_of_death', e.target.value)} />
                        <InputError message={errors.date_of_death} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="death_place">Vafot joyi</Label>
                        <Input id="death_place" value={data.death_place} onChange={(e) => setData('death_place', e.target.value)} placeholder="Toshkent, O'zbekiston" />
                        <InputError message={errors.death_place} />
                    </div>
                </div>
            ) : null}

            <div className="space-y-1.5">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Qisqacha tarjimai hol…" />
                <InputError message={errors.description} />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={processing}>
                    {processing ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
                    {mode === 'edit' ? "O'zgarishlarni saqlash" : "A'zo qo'shish"}
                </Button>
            </DialogFooter>
        </form>
    );
}

const relationLabel: Record<RelateAs, string> = {
    parent: 'ota-ona',
    child: 'farzand',
    spouse: "turmush o'rtoq",
};

export function MemberFormDialog({ open, onOpenChange, mode, member, relateTo, relateAs, relateToName, relateToSpouse }: Props) {
    const title =
        mode === 'edit'
            ? "A'zoni tahrirlash"
            : relateAs && relateToName
              ? `${relateToName} uchun ${relationLabel[relateAs]} qo'shish`
              : "Oila a'zosini qo'shish";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit' ? "Ushbu oila a'zosining ma'lumotlarini yangilang." : "Faqat ism talab qilinadi — qolganlari ixtiyoriy."}
                    </DialogDescription>
                </DialogHeader>
                {open ? (
                    <MemberForm
                        key={`${mode}-${member?.id ?? 'new'}-${relateTo ?? ''}-${relateAs ?? ''}-${relateToSpouse ?? ''}`}
                        mode={mode}
                        member={member}
                        relateTo={relateTo}
                        relateAs={relateAs}
                        relateToSpouse={relateToSpouse}
                        onDone={() => onOpenChange(false)}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
