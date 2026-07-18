<?php

use App\Http\Controllers\GalleryController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\RelationshipController;
use App\Http\Controllers\TreeController;
use Illuminate\Support\Facades\Route;

// Interactive family tree (home).
Route::get('/', [TreeController::class, 'index'])->name('tree');

// Members.
Route::post('/members', [MemberController::class, 'store'])->name('members.store');
Route::put('/members/{member}', [MemberController::class, 'update'])->name('members.update');
Route::delete('/members/{member}', [MemberController::class, 'destroy'])->name('members.destroy');

// Relationships (edges between members).
Route::post('/relationships', [RelationshipController::class, 'store'])->name('relationships.store');
Route::delete('/relationships/{relationship}', [RelationshipController::class, 'destroy'])->name('relationships.destroy');

// Gallery.
Route::get('/gallery', [GalleryController::class, 'index'])->name('gallery.index');
Route::post('/gallery', [GalleryController::class, 'store'])->name('gallery.store');
Route::put('/gallery/{gallery}', [GalleryController::class, 'update'])->name('gallery.update');
Route::delete('/gallery/{gallery}', [GalleryController::class, 'destroy'])->name('gallery.destroy');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
