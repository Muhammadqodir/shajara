import { Head, router, usePage } from '@inertiajs/react';
import {
    Background,
    BackgroundVariant,
    Controls,
    type Connection,
    type Edge,
    type EdgeMouseHandler,
    MiniMap,
    type Node,
    type NodeMouseHandler,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Info, Plus, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MemberDetailSheet } from '@/components/family/member-detail-sheet';
import { MemberFormDialog, type RelateAs } from '@/components/family/member-form-dialog';
import { MemberNode } from '@/components/family/member-node';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { computeFamilyLayout, fullName } from '@/lib/family-graph';
import SiteLayout from '@/layouts/site-layout';
import type { Member, Relationship } from '@/types/family';

const nodeTypes = { member: MemberNode };

interface TreeProps {
    members: Member[];
    relationships: Relationship[];
}

interface FormState {
    open: boolean;
    mode: 'create' | 'edit';
    member: Member | null;
    relateTo: number | null;
    relateAs: RelateAs | null;
    relateToName: string | null;
}

const closedForm: FormState = { open: false, mode: 'create', member: null, relateTo: null, relateAs: null, relateToName: null };

export default function Tree({ members, relationships }: TreeProps) {
    const { appearance } = useAppearance();
    const { props } = usePage<{ errors: Record<string, string> }>();

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [form, setForm] = useState<FormState>(closedForm);
    const [notice, setNotice] = useState<string | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const layout = useMemo(() => computeFamilyLayout(members, relationships), [members, relationships]);

    // Rebuild nodes & edges whenever the underlying data changes.
    useEffect(() => {
        setNodes(
            members.map((m) => ({
                id: String(m.id),
                type: 'member',
                position: layout.positions[m.id] ?? { x: 0, y: 0 },
                data: { member: m, isSelected: selectedId === m.id },
            })),
        );

        const parentEdges: Edge[] = layout.parentEdges.map((e) => ({
            id: `p-${e.id}`,
            source: String(e.parentId),
            target: String(e.childId),
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'smoothstep',
            style: { stroke: 'var(--color-muted-foreground)', strokeWidth: 1.5 },
            data: { relationshipId: e.id },
        }));

        const spouseEdges: Edge[] = layout.spouseEdges.map((e) => ({
            id: `s-${e.id}`,
            source: String(e.leftId),
            target: String(e.rightId),
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'straight',
            style: { stroke: 'var(--color-muted-foreground)', strokeWidth: 1.5, strokeDasharray: '4 4' },
            data: { relationshipId: e.id },
        }));

        setEdges([...parentEdges, ...spouseEdges]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [members, relationships, layout]);

    // Toggle selection styling without resetting node positions.
    useEffect(() => {
        setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isSelected: n.id === String(selectedId) } })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    // Surface relationship validation errors as a transient notice.
    useEffect(() => {
        if (props.errors?.relationship) {
            setNotice(props.errors.relationship);
            const t = setTimeout(() => setNotice(null), 4000);
            return () => clearTimeout(t);
        }
    }, [props.errors]);

    const selectedMember = useMemo(() => members.find((m) => m.id === selectedId) ?? null, [members, selectedId]);

    // Close the sheet if the selected member was deleted.
    useEffect(() => {
        if (sheetOpen && selectedId !== null && !selectedMember) {
            setSheetOpen(false);
            setSelectedId(null);
        }
    }, [sheetOpen, selectedId, selectedMember]);

    const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
        setSelectedId(Number(node.id));
        setSheetOpen(true);
    }, []);

    const onConnect = useCallback((c: Connection) => {
        if (!c.source || !c.target || c.source === c.target) return;
        const isSpouse = c.sourceHandle === 'right' || c.sourceHandle === 'left' || c.targetHandle === 'left' || c.targetHandle === 'right';
        router.post(
            '/relationships',
            {
                from_member_id: Number(c.source),
                to_member_id: Number(c.target),
                type: isSpouse ? 'spouse' : 'parent',
            },
            { preserveScroll: true },
        );
    }, []);

    const onEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
        const relationshipId = (edge.data as { relationshipId?: number } | undefined)?.relationshipId;
        if (!relationshipId) return;
        if (window.confirm('Remove this relationship?')) {
            router.delete(`/relationships/${relationshipId}`, { preserveScroll: true });
        }
    }, []);

    const openCreate = () => setForm({ ...closedForm, open: true, mode: 'create' });
    const openEdit = (member: Member) => setForm({ ...closedForm, open: true, mode: 'edit', member });
    const openAddRelative = (member: Member, relateAs: RelateAs) => {
        setSheetOpen(false);
        setForm({ open: true, mode: 'create', member: null, relateTo: member.id, relateAs, relateToName: fullName(member) });
    };

    return (
        <SiteLayout>
            <Head title="Family Tree" />

            <div className="relative h-full w-full">
                {members.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                        <div className="bg-secondary flex size-14 items-center justify-center rounded-full">
                            <Users className="text-muted-foreground size-7" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Start your family tree</h2>
                            <p className="text-muted-foreground text-sm">Add the first member, then connect parents, children and spouses.</p>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 size-4" /> Add member
                        </Button>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onEdgeClick={onEdgeClick}
                        nodeTypes={nodeTypes}
                        colorMode={appearance}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        minZoom={0.2}
                        maxZoom={1.75}
                        proOptions={{ hideAttribution: false }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={22} size={1} className="!bg-background" />
                        <Controls showInteractive={false} className="!shadow-sm" />
                        <MiniMap
                            pannable
                            zoomable
                            className="!bg-card !border-border rounded-md border"
                            nodeColor="var(--color-muted-foreground)"
                            maskColor="color-mix(in oklab, var(--color-background) 70%, transparent)"
                        />
                    </ReactFlow>
                )}

                {/* Toolbar */}
                {members.length > 0 ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
                        <div className="bg-card/90 pointer-events-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm backdrop-blur">
                            <Users className="text-muted-foreground size-4" />
                            <span className="font-medium">{members.length}</span>
                            <span className="text-muted-foreground">members</span>
                        </div>
                        <Button className="pointer-events-auto shadow-sm" onClick={openCreate}>
                            <Plus className="mr-2 size-4" /> Add member
                        </Button>
                    </div>
                ) : null}

                {/* Hint */}
                {members.length > 0 ? (
                    <div className="text-muted-foreground pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
                        <Info className="size-3.5" />
                        Click a card for details · drag between cards to connect · click a line to remove it
                    </div>
                ) : null}

                {/* Relationship error notice */}
                {notice ? (
                    <div className="absolute left-1/2 top-4 z-10 w-80 -translate-x-1/2">
                        <Alert variant="destructive" className="bg-card shadow-md">
                            <AlertDescription>{notice}</AlertDescription>
                        </Alert>
                    </div>
                ) : null}
            </div>

            <MemberDetailSheet
                member={selectedMember}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                members={members}
                relationships={relationships}
                onEdit={openEdit}
                onAddRelative={openAddRelative}
                onSelectMember={(id) => setSelectedId(id)}
            />

            <MemberFormDialog
                open={form.open}
                onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
                mode={form.mode}
                member={form.member}
                relateTo={form.relateTo}
                relateAs={form.relateAs}
                relateToName={form.relateToName}
            />
        </SiteLayout>
    );
}
