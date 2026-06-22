<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_endpoint_rejects_missing_fields(): void
    {
        $response = $this->postJson('/api/check', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['flight_number', 'flight_date']);
    }

    public function test_generate_endpoint_rejects_missing_fields(): void
    {
        $response = $this->postJson('/api/generate', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors([
            'crew_name', 'crew_id', 'flight_number', 'flight_date', 'aircraft_type',
        ]);
    }

    public function test_generate_endpoint_rejects_invalid_aircraft_type(): void
    {
        $response = $this->postJson('/api/generate', [
            'crew_name' => 'Jane',
            'crew_id' => 'C001',
            'flight_number' => 'GA101',
            'flight_date' => '2026-06-22',
            'aircraft_type' => 'Boeing 747',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['aircraft_type']);
    }

    public function test_generate_endpoint_uses_custom_error_message(): void
    {
        $response = $this->postJson('/api/generate', [
            'aircraft_type' => 'Boeing 747',
        ]);

        $response->assertStatus(422);
        // Custom message from GenerateVoucherRequest::messages() must appear.
        $response->assertJsonPath('errors.aircraft_type.0', 'Tipe pesawat tidak valid.');
    }
}
