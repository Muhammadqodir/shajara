<?php

namespace Tests\Feature;

use App\Models\Gallery;
use App\Models\Member;
use App\Models\Relationship;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FamilyTest extends TestCase
{
    use RefreshDatabase;

    public function test_tree_page_renders_with_members_and_relationships(): void
    {
        $a = Member::create(['name' => 'Ada']);
        $b = Member::create(['name' => 'Ben']);
        Relationship::create(['from_member_id' => $a->id, 'to_member_id' => $b->id, 'type' => 'parent']);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('tree')
                ->has('members', 2)
                ->has('relationships', 1)
            );
    }

    public function test_it_creates_a_member(): void
    {
        $this->post('/members', [
            'name' => 'Grace',
            'surname' => 'Hopper',
            'gender' => 'female',
            'date_of_birth' => '1906-12-09',
            'profession' => 'Computer Scientist',
        ])->assertRedirect();

        $this->assertDatabaseHas('members', ['name' => 'Grace', 'surname' => 'Hopper']);
    }

    public function test_it_validates_member_input(): void
    {
        $this->post('/members', ['name' => 'X', 'photo_url' => 'not-a-url'])
            ->assertSessionHasErrors('photo_url');

        $this->post('/members', ['name' => 'X', 'date_of_birth' => '2000-01-01', 'date_of_death' => '1990-01-01'])
            ->assertSessionHasErrors('date_of_death');

        $this->post('/members', ['surname' => 'NoFirstName'])
            ->assertSessionHasErrors('name');
    }

    public function test_it_creates_a_member_and_links_it_as_a_child(): void
    {
        $parent = Member::create(['name' => 'Parent']);

        $this->post('/members', [
            'name' => 'Kid',
            'relate_to' => $parent->id,
            'relate_as' => 'child',
        ])->assertRedirect();

        $kid = Member::where('name', 'Kid')->firstOrFail();

        $this->assertDatabaseHas('relationships', [
            'from_member_id' => $parent->id,
            'to_member_id' => $kid->id,
            'type' => 'parent',
        ]);
    }

    public function test_it_creates_a_parent_relationship(): void
    {
        $a = Member::create(['name' => 'A']);
        $b = Member::create(['name' => 'B']);

        $this->post('/relationships', [
            'from_member_id' => $a->id,
            'to_member_id' => $b->id,
            'type' => 'parent',
        ])->assertRedirect();

        $this->assertDatabaseCount('relationships', 1);
    }

    public function test_it_prevents_a_loop_in_the_tree(): void
    {
        $grandparent = Member::create(['name' => 'GP']);
        $child = Member::create(['name' => 'C']);
        Relationship::create(['from_member_id' => $grandparent->id, 'to_member_id' => $child->id, 'type' => 'parent']);

        $this->post('/relationships', [
            'from_member_id' => $child->id,
            'to_member_id' => $grandparent->id,
            'type' => 'parent',
        ])->assertSessionHasErrors('relationship');

        $this->assertDatabaseCount('relationships', 1);
    }

    public function test_it_rejects_duplicate_spouse_links_in_either_direction(): void
    {
        $a = Member::create(['name' => 'A']);
        $b = Member::create(['name' => 'B']);
        Relationship::create(['from_member_id' => $a->id, 'to_member_id' => $b->id, 'type' => 'spouse']);

        $this->post('/relationships', [
            'from_member_id' => $b->id,
            'to_member_id' => $a->id,
            'type' => 'spouse',
        ])->assertSessionHasErrors('relationship');

        $this->assertDatabaseCount('relationships', 1);
    }

    public function test_deleting_a_member_cascades_relationships(): void
    {
        $a = Member::create(['name' => 'A']);
        $b = Member::create(['name' => 'B']);
        Relationship::create(['from_member_id' => $a->id, 'to_member_id' => $b->id, 'type' => 'parent']);

        $this->delete("/members/{$a->id}")->assertRedirect();

        $this->assertDatabaseMissing('members', ['id' => $a->id]);
        $this->assertDatabaseCount('relationships', 0);
    }

    public function test_it_creates_a_gallery_item_and_tags_members(): void
    {
        $a = Member::create(['name' => 'A']);
        $b = Member::create(['name' => 'B']);

        $this->post('/gallery', [
            'image_url' => 'https://example.com/photo.jpg',
            'description' => 'A day out',
            'member_ids' => [$a->id, $b->id],
        ])->assertRedirect();

        $this->assertCount(2, Gallery::firstOrFail()->members);
    }

    public function test_gallery_page_renders(): void
    {
        $this->get('/gallery')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('gallery')->has('galleries')->has('members'));
    }
}
