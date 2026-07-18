<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Relationship;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    /**
     * Store a newly created member.
     *
     * Optionally links the new member to an existing member in one step
     * via `relate_to` (existing member id) and `relate_as`:
     *   - "parent": the NEW member is a parent of relate_to
     *   - "child":  the NEW member is a child of relate_to
     *   - "spouse": the NEW member is a spouse of relate_to
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateMember($request);

        $link = $request->validate([
            'relate_to' => ['nullable', 'exists:members,id'],
            'relate_as' => ['nullable', 'in:parent,child,spouse'],
        ]);

        DB::transaction(function () use ($data, $link) {
            $member = Member::create($data);

            if (! empty($link['relate_to']) && ! empty($link['relate_as'])) {
                $this->linkMember($member->id, (int) $link['relate_to'], $link['relate_as']);
            }
        });

        return back();
    }

    /**
     * Update an existing member.
     */
    public function update(Request $request, Member $member): RedirectResponse
    {
        $member->update($this->validateMember($request));

        return back();
    }

    /**
     * Delete a member (relationships & gallery links cascade automatically).
     */
    public function destroy(Member $member): RedirectResponse
    {
        $member->delete();

        return back();
    }

    /**
     * Shared validation rules for create & update.
     */
    protected function validateMember(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'surname' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'date_of_death' => ['nullable', 'date', 'after_or_equal:date_of_birth'],
            'profession' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'gender' => ['nullable', 'in:male,female,other'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'death_place' => ['nullable', 'string', 'max:255'],
            'photo_url' => ['nullable', 'url', 'max:2048'],
        ]);
    }

    /**
     * Create the relationship row implied by relating the new member to another.
     */
    protected function linkMember(int $newId, int $existingId, string $as): void
    {
        [$from, $to, $type] = match ($as) {
            'parent' => [$newId, $existingId, 'parent'],
            'child' => [$existingId, $newId, 'parent'],
            'spouse' => [$newId, $existingId, 'spouse'],
        };

        Relationship::firstOrCreate([
            'from_member_id' => $from,
            'to_member_id' => $to,
            'type' => $type,
        ]);
    }
}
