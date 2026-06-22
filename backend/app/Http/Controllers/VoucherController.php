<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckVoucherRequest;
use App\Http\Requests\GenerateVoucherRequest;
use App\Http\Resources\VoucherResource;
use App\Models\Voucher;
use App\Services\SeatGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherController extends Controller
{
    public function __construct(
        private readonly SeatGeneratorService $seatGenerator,
    ) {}

    public function index(): JsonResource
    {
        return VoucherResource::collection(Voucher::all());
    }

    public function check(CheckVoucherRequest $request): JsonResponse
    {
        $exists = Voucher::where('flight_number', $request->flight_number)
            ->where('flight_date', $request->flight_date)
            ->exists();

        return response()->json([
            'exists'  => $exists,
            'message' => $exists
                ? 'A voucher already exists for this flight and date.'
                : 'No voucher found for this flight and date.',
        ]);
    }

    public function generate(GenerateVoucherRequest $request): JsonResource|JsonResponse
    {
        $alreadyExists = Voucher::where('flight_number', $request->flight_number)
            ->where('flight_date', $request->flight_date)
            ->exists();

        if ($alreadyExists) {
            return response()->json([
                'message' => 'Voucher already exists for this flight and date.',
            ], 409);
        }

        [$seat1, $seat2, $seat3] = $this->seatGenerator->draw($request->aircraft_type);

        $voucher = Voucher::create([
            'crew_name'      => $request->crew_name,
            'crew_id'        => $request->crew_id,
            'flight_number'  => $request->flight_number,
            'flight_date'    => $request->flight_date,
            'aircraft_type'  => $request->aircraft_type,
            'seat1'          => $seat1,
            'seat2'          => $seat2,
            'seat3'          => $seat3,
        ]);

        return (new VoucherResource($voucher))
            ->response()
            ->setStatusCode(201);
    }
}
