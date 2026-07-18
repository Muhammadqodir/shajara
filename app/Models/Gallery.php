<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Gallery extends Model
{
    protected $fillable = [
        'image_url',
        'description',
    ];

    /**
     * Members featured in this gallery item.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Member::class)->withTimestamps();
    }
}
