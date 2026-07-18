<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('surname')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->date('date_of_death')->nullable();
            $table->string('profession')->nullable();
            $table->text('description')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('birth_place')->nullable();
            $table->string('death_place')->nullable();
            $table->string('photo_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
