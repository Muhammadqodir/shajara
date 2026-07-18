<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Relationship extends Model
{
    protected $fillable = [
        'from_member_id',
        'to_member_id',
        'type',
    ];

    public function from(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'from_member_id');
    }

    public function to(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'to_member_id');
    }
}
