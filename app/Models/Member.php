<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'surname',
        'date_of_birth',
        'date_of_death',
        'profession',
        'description',
        'gender',
        'birth_place',
        'death_place',
        'photo_url',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
        'date_of_death' => 'date:Y-m-d',
    ];

    /**
     * Members who are children of this member.
     */
    public function children(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'relationships', 'from_member_id', 'to_member_id')
            ->wherePivot('type', 'parent')
            ->withTimestamps();
    }

    /**
     * Members who are parents of this member.
     */
    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(Member::class, 'relationships', 'to_member_id', 'from_member_id')
            ->wherePivot('type', 'parent')
            ->withTimestamps();
    }

    /**
     * Photo galleries this member appears in.
     */
    public function galleries(): BelongsToMany
    {
        return $this->belongsToMany(Gallery::class)->withTimestamps();
    }
}
