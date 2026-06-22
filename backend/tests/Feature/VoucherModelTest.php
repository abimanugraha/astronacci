<?php

namespace Tests\Feature;

use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_voucher_can_be_created_with_all_fields(): void
    {
        $voucher = Voucher::create([
            'crew_name' => 'Jane Doe',
            'crew_id' => 'C001',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A',
            'seat2' => '2C',
            'seat3' => '3D',
        ]);

        $this->assertDatabaseHas('vouchers', [
            'crew_name' => 'Jane Doe',
            'flight_number' => 'GA101',
            'seat1' => '1A',
        ]);
    }

    public function test_composite_unique_constraint_rejects_duplicate_flight_and_date(): void
    {
        Voucher::create([
            'crew_name' => 'Jane',
            'crew_id' => 'C001',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '2C', 'seat3' => '3D',
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        Voucher::create([
            'crew_name' => 'Other Crew',
            'crew_id' => 'C002',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '4A', 'seat2' => '5C', 'seat3' => '6D',
        ]);
    }
}
