<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crew_name'      => ['required', 'string'],
            'crew_id'        => ['required', 'string'],
            'flight_number'  => ['required', 'string'],
            'flight_date'    => ['required', 'string'],
            'aircraft_type'  => ['required', 'string', 'in:ATR,Airbus 320,Boeing 737 Max'],
        ];
    }

    public function messages(): array
    {
        return [
            'crew_name.required'     => 'Nama crew wajib diisi.',
            'crew_id.required'       => 'ID crew wajib diisi.',
            'flight_number.required' => 'Nomor penerbangan wajib diisi.',
            'flight_date.required'   => 'Tanggal penerbangan wajib diisi.',
            'aircraft_type.required' => 'Tipe pesawat wajib diisi.',
            'aircraft_type.in'       => 'Tipe pesawat tidak valid.',
        ];
    }
}
