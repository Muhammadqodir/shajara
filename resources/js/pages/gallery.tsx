import { Head, router } from '@inertiajs/react';
import { ImageOff, Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { GalleryFormDialog } from '@/components/family/gallery-form-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { fullName, initials } from '@/lib/family-graph';
import SiteLayout from '@/layouts/site-layout';
import type { GalleryItem, MemberSummary } from '@/types/family';

interface GalleryProps {
    galleries: GalleryItem[];
    members: MemberSummary[];
}

function GalleryImage({ src, alt }: { src: string; alt: string }) {
    const [failed, setFailed] = useState(false);
    if (failed) {
        return (
            <div className="bg-secondary text-muted-foreground flex aspect-video w-full items-center justify-center">
                <ImageOff className="size-8" />
            </div>
        );
    }
    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="aspect-video w-full object-cover" />;
}

function GalleryCard({ item, onEdit }: { item: GalleryItem; onEdit: (item: GalleryItem) => void }) {
    const remove = () => {
        if (window.confirm('Delete this photo?')) {
            router.delete(`/gallery/${item.id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="group bg-card overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
            <div className="relative">
                <GalleryImage src={item.image_url} alt={item.description ?? 'Family photo'} />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="secondary" className="size-8 shadow-sm" onClick={() => onEdit(item)}>
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="secondary" className="text-destructive size-8 shadow-sm" onClick={remove}>
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>
            <div className="space-y-3 p-4">
                {item.description ? <p className="text-sm leading-relaxed">{item.description}</p> : null}
                {item.members.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {item.members.slice(0, 5).map((m) => (
                                <Avatar key={m.id} className="border-background size-7 rounded-full border-2">
                                    {m.photo_url ? <AvatarImage src={m.photo_url} alt={fullName(m)} className="object-cover" /> : null}
                                    <AvatarFallback className="bg-secondary text-[10px]">{initials(m)}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        <span className="text-muted-foreground truncate text-xs">{item.members.map((m) => fullName(m)).join(', ')}</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

interface DialogState {
    open: boolean;
    mode: 'create' | 'edit';
    item: GalleryItem | null;
}

export default function Gallery({ galleries, members }: GalleryProps) {
    const [dialog, setDialog] = useState<DialogState>({ open: false, mode: 'create', item: null });

    return (
        <SiteLayout>
            <Head title="Gallery" />

            <div className="h-full overflow-y-auto">
                <div className="mx-auto w-full max-w-6xl px-6 py-8">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
                            <p className="text-muted-foreground text-sm">Shared family photos, tagged with the people in them.</p>
                        </div>
                        <Button onClick={() => setDialog({ open: true, mode: 'create', item: null })}>
                            <Plus className="mr-2 size-4" /> Add photo
                        </Button>
                    </div>

                    {galleries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
                            <div className="bg-secondary flex size-14 items-center justify-center rounded-full">
                                <Images className="text-muted-foreground size-7" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">No photos yet</h2>
                                <p className="text-muted-foreground text-sm">Add your first family photo to get started.</p>
                            </div>
                            <Button variant="outline" onClick={() => setDialog({ open: true, mode: 'create', item: null })}>
                                <Plus className="mr-2 size-4" /> Add photo
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {galleries.map((item) => (
                                <GalleryCard key={item.id} item={item} onEdit={(it) => setDialog({ open: true, mode: 'edit', item: it })} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <GalleryFormDialog
                open={dialog.open}
                onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
                mode={dialog.mode}
                item={dialog.item}
                members={members}
            />
        </SiteLayout>
    );
}
