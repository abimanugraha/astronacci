<?php

namespace Tests\Feature;

use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_returns_false_when_no_voucher_exists(): void
    {
        $response = $this->postJson('/api/check', [
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
        ]);

        $response->assertOk();
        $response->assertJson(['exists' => false]);
    }

    public function test_check_returns_true_when_voucher_exists(): void
    {
        Voucher::create([
            'crew_name' => 'Jane', 'crew_id' => 'C001',
            'flight_number' => 'GA101', 'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '2C', 'seat3' => '3D',
        ]);

        $response = $this->postJson('/api/check', [
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
        ]);

        $response->assertOk();
        $response->assertJson(['exists' => true]);
    }

    public function test_generate_creates_voucher_and_returns_resource_shape(): void
    {
        $response = $this->postJson('/api/generate', [
            'crew_name' => 'Jane Doe',
            'crew_id' => 'C001',
            'flight_number' => 'GA102',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
        ]);

        $response->assertCreated();
        $response->assertJsonStructure([
            'data' => [
                'id', 'crew_name', 'crew_id', 'flight_number', 'flight_date',
                'aircraft_type', 'seats', 'created_at', 'updated_at',
            ],
        ]);

        $seats = $response->json('data.seats');
        $this->assertCount(3, $seats);
        $this->assertEquals(3, count(array_unique($seats)));

        $this->assertDatabaseHas('vouchers', [
            'flight_number' => 'GA102',
            'flight_date' => '2026-06-22',
        ]);
    }

    public function test_generate_rejects_duplicate_flight_and_date_with_409(): void
    {
        Voucher::create([
            'crew_name' => 'Existing', 'crew_id' => 'C099',
            'flight_number' => 'GA103', 'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '2C', 'seat3' => '3D',
        ]);

        $response = $this->postJson('/api/generate', [
            'crew_name' => 'New Crew',
            'crew_id' => 'C001',
            'flight_number' => 'GA103',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'ATR',
        ]);

        $response->assertStatus(409);
        $response->assertJson(['message' => 'Voucher already exists for this flight and date.']);
    }

    public function test_generate_with_airbus_320_produces_valid_seats(): void
    {
        $response = $this->postJson('/api/generate', [
            'crew_name' => 'Jane', 'crew_id' => 'C001',
            'flight_number' => 'GA104', 'flight_date' => '2026-06-22',
            'aircraft_type' => 'Airbus 320',
        ]);

        $response->assertCreated();
        foreach ($response->json('data.seats') as $seat) {
            preg_match('/^(\d+)([A-Z])$/', $seat, $m);
            $this->assertNotEmpty($m);
            $this->assertGreaterThanOrEqual(1, (int) $m[1]);
            $this->assertLessThanOrEqual(32, (int) $m[1]);
            $this->assertContains($m[2], ['A', 'B', 'C', 'D', 'E', 'F']);
        }
    }

    public function test_index_returns_all_vouchers_as_resource_collection(): void
    {
        Voucher::create([
            'crew_name' => 'Putri', 'crew_id' => 'CRW001',
            'flight_number' => 'GA102', 'flight_date' => '2026-07-01',
            'aircraft_type' => 'ATR',
            'seat1' => '1A', 'seat2' => '14C', 'seat3' => '18F',
        ]);
        Voucher::create([
            'crew_name' => 'Budi', 'crew_id' => 'CRW002',
            'flight_number' => 'GA205', 'flight_date' => '2026-07-03',
            'aircraft_type' => 'Airbus 320',
            'seat1' => '5A', 'seat2' => '6B', 'seat3' => '7C',
        ]);

        $response = $this->getJson('/api/vouchers');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'crew_name', 'crew_id', 'flight_number', 'flight_date', 'aircraft_type', 'seats', 'created_at', 'updated_at'],
            ],
        ]);
        $response->assertJsonPath('data.0.seats', ['1A', '14C', '18F']);
        $response->assertJsonPath('data.1.seats', ['5A', '6B', '7C']);
    }
}
