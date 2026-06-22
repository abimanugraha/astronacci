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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('crew_name');
            $table->string('crew_id');
            $table->string('flight_number');
            $table->string('flight_date');
            $table->string('aircraft_type');
            $table->string('seat1');
            $table->string('seat2');
            $table->string('seat3');
            $table->timestamps();

            // Composite unique constraint — one voucher per flight per date, DB-enforced.
            $table->unique(['flight_number', 'flight_date'], 'vouchers_flight_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
