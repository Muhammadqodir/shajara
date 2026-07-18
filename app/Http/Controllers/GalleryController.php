<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use App\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    /**
     * Render the gallery, plus the member list used for tagging.
     */
    public function index(): Response
    {
        $galleries = Gallery::query()
            ->with('members:id,name,surname,photo_url')
            ->latest()
            ->get();

        $members = Member::query()
            ->orderBy('name')
            ->get(['id', 'name', 'surname', 'photo_url']);

        return Inertia::render('gallery', [
            'galleries' => $galleries,
            'members' => $members,
        ]);
    }

    /**
     * Store a new gallery item and tag members.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateGallery($request);

        $gallery = Gallery::create([
            'image_url' => $data['image_url'],
            'description' => $data['description'] ?? null,
        ]);

        $gallery->members()->sync($data['member_ids'] ?? []);

        return back();
    }

    /**
     * Update a gallery item and its tagged members.
     */
    public function update(Request $request, Gallery $gallery): RedirectResponse
    {
        $data = $this->validateGallery($request);

        $gallery->update([
            'image_url' => $data['image_url'],
            'description' => $data['description'] ?? null,
        ]);

        $gallery->members()->sync($data['member_ids'] ?? []);

        return back();
    }

    /**
     * Delete a gallery item.
     */
    public function destroy(Gallery $gallery): RedirectResponse
    {
        $gallery->delete();

        return back();
    }

    protected function validateGallery(Request $request): array
    {
        return $request->validate([
            'image_url' => ['required', 'url', 'max:2048'],
            'description' => ['nullable', 'string'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'exists:members,id'],
        ]);
    }
}
