<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Only the rules actually used by this app's forms (members, relationships,
    | gallery) are translated here. Anything not listed falls back to Laravel's
    | built-in English messages via APP_FALLBACK_LOCALE.
    |
    */

    'required' => ':attribute maydoni to\'ldirilishi shart.',
    'string' => ':attribute matn bo\'lishi kerak.',
    'date' => ':attribute yaroqli sana bo\'lishi kerak.',
    'after_or_equal' => ':attribute :date dan keyin yoki unga teng bo\'lishi kerak.',
    'in' => 'Tanlangan :attribute yaroqsiz.',
    'image' => ':attribute rasm bo\'lishi kerak.',
    'mimes' => ':attribute quyidagi turlardan biri bo\'lishi kerak: :values.',
    'url' => ':attribute to\'g\'ri havola bo\'lishi kerak.',
    'exists' => 'Tanlangan :attribute yaroqsiz.',
    'array' => ':attribute ro\'yxat bo\'lishi kerak.',
    'integer' => ':attribute butun son bo\'lishi kerak.',
    'different' => ':attribute va :other bir xil bo\'lmasligi kerak.',
    'boolean' => ':attribute maydoni ha/yo\'q qiymatida bo\'lishi kerak.',

    'max' => [
        'numeric' => ':attribute :max dan katta bo\'lmasligi kerak.',
        'file' => ':attribute :max kilobaytdan katta bo\'lmasligi kerak.',
        'string' => ':attribute :max ta belgidan oshmasligi kerak.',
        'array' => ':attribute :max tadan ko\'p elementga ega bo\'lmasligi kerak.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | Human-readable (Uzbek) field names, substituted into ":attribute" above.
    |
    */

    'attributes' => [
        'name' => 'Ism',
        'surname' => 'Familiya',
        'date_of_birth' => 'Tug\'ilgan sana',
        'date_of_death' => 'Vafot sanasi',
        'profession' => 'Kasb',
        'description' => 'Tavsif',
        'gender' => 'Jins',
        'birth_place' => 'Tug\'ilgan joy',
        'death_place' => 'Vafot joyi',
        'photo' => 'Rasm',
        'image_url' => 'Rasm havolasi',
        'member_ids' => 'A\'zolar',
        'from_member_id' => 'Birinchi a\'zo',
        'to_member_id' => 'Ikkinchi a\'zo',
        'type' => 'Turi',
        'relate_to' => 'Bog\'lanadigan a\'zo',
        'relate_as' => 'Bog\'lanish turi',
    ],

];
