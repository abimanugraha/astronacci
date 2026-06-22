<?php

namespace App\Services;

class SeatGeneratorService
{
    /**
     * Aircraft seat matrices. Keys are the exact aircraft_type strings
     * accepted by the API. Letters are the only valid seat letters for
     * that aircraft (ATR has no B or E).
     */
    private const SEAT_MATRIX = [
        'ATR' => [
            'rows' => [1, 18],
            'letters' => ['A', 'C', 'D', 'F'],
        ],
        'Airbus 320' => [
            'rows' => [1, 32],
            'letters' => ['A', 'B', 'C', 'D', 'E', 'F'],
        ],
        'Boeing 737 Max' => [
            'rows' => [1, 32],
            'letters' => ['A', 'B', 'C', 'D', 'E', 'F'],
        ],
    ];

    /**
     * Draw exactly 3 unique, non-repeating valid seats for the given aircraft.
     *
     * @return string[] Always length 3, e.g. ["5A", "12D", "1F"].
     *
     * @throws \InvalidArgumentException If $aircraftType is unknown.
     */
    public function draw(string $aircraftType): array
    {
        if (!isset(self::SEAT_MATRIX[$aircraftType])) {
            throw new \InvalidArgumentException("Unknown aircraft type: {$aircraftType}");
        }

        ['rows' => [$min, $max], 'letters' => $letters] = self::SEAT_MATRIX[$aircraftType];

        $all = [];
        for ($row = $min; $row <= $max; $row++) {
            foreach ($letters as $letter) {
                $all[] = $row . $letter;
            }
        }

        shuffle($all);

        return array_slice($all, 0, 3);
    }
}
