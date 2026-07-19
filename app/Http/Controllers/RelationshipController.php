<?php

namespace App\Http\Controllers;

use App\Models\Relationship;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RelationshipController extends Controller
{
    /**
     * Create a relationship between two members.
     *
     * For "parent": from_member_id is the parent of to_member_id.
     * For "spouse": order does not matter (stored once, checked both ways).
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'from_member_id' => ['required', 'exists:members,id'],
            'to_member_id' => ['required', 'exists:members,id', 'different:from_member_id'],
            'type' => ['required', 'in:parent,spouse'],
        ]);

        if ($data['type'] === 'spouse') {
            $alreadyLinked = Relationship::query()
                ->where('type', 'spouse')
                ->where(function ($q) use ($data) {
                    $q->where([
                        'from_member_id' => $data['from_member_id'],
                        'to_member_id' => $data['to_member_id'],
                    ])->orWhere([
                        'from_member_id' => $data['to_member_id'],
                        'to_member_id' => $data['from_member_id'],
                    ]);
                })
                ->exists();

            if ($alreadyLinked) {
                return back()->withErrors([
                    'relationship' => "Bu a'zolar allaqachon turmush o'rtoqlari sifatida bog'langan.",
                ]);
            }
        } else {
            // Prevent creating a loop: the child must not already be an ancestor of the parent.
            if ($this->isAncestor($data['to_member_id'], $data['from_member_id'])) {
                return back()->withErrors([
                    'relationship' => "Bu bog'lanish daraxtda halqa hosil qiladi.",
                ]);
            }
        }

        Relationship::firstOrCreate($data);

        return back();
    }

    /**
     * Update a relationship (currently just the marriage date on spouse links).
     */
    public function update(Request $request, Relationship $relationship): RedirectResponse
    {
        $data = $request->validate([
            'married_at' => ['nullable', 'date'],
        ]);

        $relationship->update($data);

        return back();
    }

    /**
     * Delete a relationship.
     */
    public function destroy(Relationship $relationship): RedirectResponse
    {
        $relationship->delete();

        return back();
    }

    /**
     * Determine whether $ancestorId is an ancestor of $memberId (walking parents).
     */
    protected function isAncestor(int $ancestorId, int $memberId): bool
    {
        $visited = [];
        $stack = [$memberId];

        while ($stack) {
            $current = array_pop($stack);

            if (in_array($current, $visited, true)) {
                continue;
            }
            $visited[] = $current;

            $parentIds = Relationship::query()
                ->where('type', 'parent')
                ->where('to_member_id', $current)
                ->pluck('from_member_id');

            foreach ($parentIds as $parentId) {
                if ((int) $parentId === $ancestorId) {
                    return true;
                }
                $stack[] = (int) $parentId;
            }
        }

        return false;
    }
}
