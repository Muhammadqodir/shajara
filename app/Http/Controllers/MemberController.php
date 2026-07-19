<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Relationship;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
     *
     * When adding a child from a couple's shared "marriage" card, `relate_to_spouse`
     * carries the second parent's id so both parent links are created at once.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        $link = $request->validate([
            'relate_to' => ['nullable', 'exists:members,id'],
            'relate_as' => ['nullable', 'in:parent,child,spouse'],
            'relate_to_spouse' => ['nullable', 'exists:members,id', 'different:relate_to'],
        ]);

        $data['photo_url'] = $this->resolvePhoto($request, null);

        DB::transaction(function () use ($data, $link) {
            $member = Member::create($data);

            if (! empty($link['relate_to']) && ! empty($link['relate_as'])) {
                $this->linkMember($member->id, (int) $link['relate_to'], $link['relate_as']);

                if ($link['relate_as'] === 'child' && ! empty($link['relate_to_spouse'])) {
                    $this->linkMember($member->id, (int) $link['relate_to_spouse'], 'child');
                }
            }
        });

        return back();
    }

    /**
     * Update an existing member.
     */
    public function update(Request $request, Member $member): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['photo_url'] = $this->resolvePhoto($request, $member);

        $member->update($data);

        return back();
    }

    /**
     * Delete a member (relationships & gallery links cascade automatically).
     */
    public function destroy(Member $member): RedirectResponse
    {
        $this->deleteLocalPhoto($member->photo_url);
        $member->delete();

        return back();
    }

    /**
     * Validate & return the member's own column values (photo handled separately).
     */
    protected function validatedData(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'surname' => ['nullable', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'date_of_death' => ['nullable', 'date', 'after_or_equal:date_of_birth'],
            'profession' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'gender' => ['nullable', 'in:male,female'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'death_place' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
        ]);

        return Arr::only($validated, [
            'name', 'surname', 'date_of_birth', 'date_of_death', 'profession',
            'description', 'gender', 'birth_place', 'death_place',
        ]);
    }

    /**
     * Work out the photo_url: a new upload wins, otherwise honour removal or keep existing.
     */
    protected function resolvePhoto(Request $request, ?Member $member): ?string
    {
        if ($request->hasFile('photo')) {
            $this->deleteLocalPhoto($member?->photo_url);
            $path = $request->file('photo')->store('photos', 'public');

            return '/storage/'.$path;
        }

        if ($request->boolean('remove_photo')) {
            $this->deleteLocalPhoto($member?->photo_url);

            return null;
        }

        return $member?->photo_url;
    }

    /**
     * Delete an uploaded photo from local storage (ignores external URLs).
     */
    protected function deleteLocalPhoto(?string $url): void
    {
        if (! $url || ! str_starts_with($url, '/storage/')) {
            return;
        }

        Storage::disk('public')->delete(substr($url, strlen('/storage/')));
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
