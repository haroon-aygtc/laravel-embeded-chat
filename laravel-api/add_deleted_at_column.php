<?php

// This script adds the deleted_at column to the widgets table

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
    if (!Schema::hasColumn('widgets', 'deleted_at')) {
        Schema::table('widgets', function (Blueprint $table) {
            $table->softDeletes();
        });
        echo "Successfully added deleted_at column to widgets table.\n";
    } else {
        echo "The deleted_at column already exists in the widgets table.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
