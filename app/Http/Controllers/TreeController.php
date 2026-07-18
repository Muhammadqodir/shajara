<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Relationship;
use Inertia\Inertia;
use Inertia\Response;

class TreeController extends Controller
{
    /**
     * Render the interactive family tree.
     */
    public function index(): Response
    {
        $members = Member::query()
            ->orderBy('name')
            ->get();

        $relationships = Relationship::query()->get([
            'id',
            'from_member_id',
            'to_member_id',
            'type',
        ]);

        return Inertia::render('tree', [
            'members' => $members,
            'relationships' => $relationships,
        ]);
    }
}
