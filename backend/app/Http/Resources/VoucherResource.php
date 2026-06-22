<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'crew_name'     => $this->crew_name,
            'crew_id'       => $this->crew_id,
            'flight_number' => $this->flight_number,
            'flight_date'   => $this->flight_date,
            'aircraft_type' => $this->aircraft_type,
            'seats'         => [$this->seat1, $this->seat2, $this->seat3],
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
