<?php

namespace Tests\Feature;

use App\Services\SeatGeneratorService;
use Tests\TestCase;

class SeatGeneratorServiceTest extends TestCase
{
    private SeatGeneratorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SeatGeneratorService();
    }

    public function test_draw_returns_exactly_three_seats(): void
    {
        $seats = $this->service->draw('ATR');

        $this->assertCount(3, $seats);
    }

    public function test_draw_returns_unique_seats(): void
    {
        $seats = $this->service->draw('Airbus 320');

        $this->assertEquals(3, count(array_unique($seats)));
    }

    public function test_atr_seats_only_use_valid_letters_and_rows(): void
    {
        // Run multiple draws to exercise the shuffler.
        for ($i = 0; $i < 50; $i++) {
            $seats = $this->service->draw('ATR');

            foreach ($seats as $seat) {
                preg_match('/^(\d+)([A-Z])$/', $seat, $m);
                $this->assertNotEmpty($m, "ATR seat '{$seat}' is not in <row><letter> format");
                [$row, $letter] = [(int) $m[1], $m[2]];

                $this->assertGreaterThanOrEqual(1, $row);
                $this->assertLessThanOrEqual(18, $row);
                $this->assertContains($letter, ['A', 'C', 'D', 'F'], "ATR seat '{$seat}' has invalid letter");
                $this->assertNotContains($letter, ['B', 'E'], "ATR must never produce B or E");
            }
        }
    }

    public function test_airbus_320_seats_use_valid_letters_and_rows(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $seats = $this->service->draw('Airbus 320');

            foreach ($seats as $seat) {
                preg_match('/^(\d+)([A-Z])$/', $seat, $m);
                [$row, $letter] = [(int) $m[1], $m[2]];

                $this->assertGreaterThanOrEqual(1, $row);
                $this->assertLessThanOrEqual(32, $row);
                $this->assertContains($letter, ['A', 'B', 'C', 'D', 'E', 'F']);
            }
        }
    }

    public function test_boeing_737_max_seats_use_valid_letters_and_rows(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $seats = $this->service->draw('Boeing 737 Max');

            foreach ($seats as $seat) {
                preg_match('/^(\d+)([A-Z])$/', $seat, $m);
                [$row, $letter] = [(int) $m[1], $m[2]];

                $this->assertGreaterThanOrEqual(1, $row);
                $this->assertLessThanOrEqual(32, $row);
                $this->assertContains($letter, ['A', 'B', 'C', 'D', 'E', 'F']);
            }
        }
    }

    public function test_unknown_aircraft_type_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->service->draw('Boeing 747');
    }
}
