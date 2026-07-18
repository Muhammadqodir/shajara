<?php

namespace Database\Seeders;

use App\Models\Gallery;
use App\Models\Member;
use App\Models\Relationship;
use Illuminate\Database\Seeder;

class FamilySeeder extends Seeder
{
    /**
     * Seed a small three-generation sample family so the tree isn't empty.
     */
    public function run(): void
    {
        $make = fn (array $attrs): Member => Member::create($attrs);

        // ---- Generation 1 (grandparents) ----
        $george = $make([
            'name' => 'George',
            'surname' => 'Whitfield',
            'gender' => 'male',
            'date_of_birth' => '1928-04-12',
            'date_of_death' => '2009-11-03',
            'profession' => 'Carpenter',
            'birth_place' => 'Leeds, England',
            'death_place' => 'York, England',
            'description' => 'Founder of the family workshop. Loved woodworking and Sunday roasts.',
            'photo_url' => 'https://i.pravatar.cc/300?img=12',
        ]);

        $margaret = $make([
            'name' => 'Margaret',
            'surname' => 'Whitfield',
            'gender' => 'female',
            'date_of_birth' => '1931-08-27',
            'date_of_death' => '2015-02-19',
            'profession' => 'Schoolteacher',
            'birth_place' => 'Manchester, England',
            'death_place' => 'York, England',
            'description' => 'Taught primary school for 35 years. Kept the whole family together.',
            'photo_url' => 'https://i.pravatar.cc/300?img=45',
        ]);

        // ---- Generation 2 (children + their spouses) ----
        $robert = $make([
            'name' => 'Robert',
            'surname' => 'Whitfield',
            'gender' => 'male',
            'date_of_birth' => '1955-06-02',
            'profession' => 'Civil Engineer',
            'birth_place' => 'York, England',
            'description' => 'Built bridges across three continents.',
            'photo_url' => 'https://i.pravatar.cc/300?img=15',
        ]);

        $linda = $make([
            'name' => 'Linda',
            'surname' => 'Whitfield',
            'gender' => 'female',
            'date_of_birth' => '1958-01-14',
            'profession' => 'Nurse',
            'birth_place' => 'Bristol, England',
            'photo_url' => 'https://i.pravatar.cc/300?img=32',
        ]);

        $susan = $make([
            'name' => 'Susan',
            'surname' => 'Clarke',
            'gender' => 'female',
            'date_of_birth' => '1959-09-30',
            'profession' => 'Architect',
            'birth_place' => 'York, England',
            'photo_url' => 'https://i.pravatar.cc/300?img=44',
        ]);

        $david = $make([
            'name' => 'David',
            'surname' => 'Clarke',
            'gender' => 'male',
            'date_of_birth' => '1957-03-21',
            'profession' => 'Journalist',
            'birth_place' => 'Edinburgh, Scotland',
            'photo_url' => 'https://i.pravatar.cc/300?img=50',
        ]);

        // ---- Generation 3 (grandchildren) ----
        $emily = $make([
            'name' => 'Emily',
            'surname' => 'Whitfield',
            'gender' => 'female',
            'date_of_birth' => '1985-07-11',
            'profession' => 'Software Engineer',
            'birth_place' => 'London, England',
            'description' => 'Loves rock climbing and machine learning.',
            'photo_url' => 'https://i.pravatar.cc/300?img=47',
        ]);

        $james = $make([
            'name' => 'James',
            'surname' => 'Whitfield',
            'gender' => 'male',
            'date_of_birth' => '1988-12-05',
            'profession' => 'Chef',
            'birth_place' => 'London, England',
            'photo_url' => 'https://i.pravatar.cc/300?img=13',
        ]);

        $oliver = $make([
            'name' => 'Oliver',
            'surname' => 'Clarke',
            'gender' => 'male',
            'date_of_birth' => '1990-04-18',
            'profession' => 'Musician',
            'birth_place' => 'Edinburgh, Scotland',
            'photo_url' => 'https://i.pravatar.cc/300?img=51',
        ]);

        // ---- Spouse relationships ----
        $spouse = fn (Member $a, Member $b) => Relationship::create([
            'from_member_id' => $a->id,
            'to_member_id' => $b->id,
            'type' => 'spouse',
        ]);

        $spouse($george, $margaret);
        $spouse($robert, $linda);
        $spouse($susan, $david);

        // ---- Parent relationships (from = parent, to = child) ----
        $parentOf = fn (Member $parent, Member $child) => Relationship::create([
            'from_member_id' => $parent->id,
            'to_member_id' => $child->id,
            'type' => 'parent',
        ]);

        foreach ([$robert, $susan] as $child) {
            $parentOf($george, $child);
            $parentOf($margaret, $child);
        }

        foreach ([$emily, $james] as $child) {
            $parentOf($robert, $child);
            $parentOf($linda, $child);
        }

        $parentOf($susan, $oliver);
        $parentOf($david, $oliver);

        // ---- A couple of gallery items ----
        Gallery::create([
            'image_url' => 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200',
            'description' => 'Whitfield family reunion, summer 2003.',
        ])->members()->sync([$george->id, $margaret->id, $robert->id, $susan->id]);

        Gallery::create([
            'image_url' => 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200',
            'description' => "Emily's graduation day.",
        ])->members()->sync([$emily->id, $robert->id, $linda->id]);
    }
}
