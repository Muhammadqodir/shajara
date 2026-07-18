<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * A relationship connects two members.
     *  - type "parent": from_member_id is the PARENT of to_member_id.
     *  - type "spouse": from_member_id and to_member_id are spouses (stored once).
     */
    public function up(): void
    {
        Schema::create('relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('to_member_id')->constrained('members')->cascadeOnDelete();
            $table->enum('type', ['parent', 'spouse'])->default('parent');
            $table->timestamps();

            $table->unique(['from_member_id', 'to_member_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('relationships');
    }
};
