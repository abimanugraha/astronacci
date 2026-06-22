import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { checkVoucher, generateVoucher, listVouchers } from '../api';

vi.mock('axios');

const OK_CHECK_BODY = { exists: false, message: 'No voucher found for this flight and date.' };
const GENERATE_BODY = {
  data: {
    id: 1,
    crew_name: 'Putri',
    crew_id: 'CRW001',
    flight_number: 'GA102',
    flight_date: '2026-07-01',
    aircraft_type: 'ATR',
    seats: ['1A', '14C', '18F'],
    created_at: '2026-06-22T00:00:00.000000Z',
    updated_at: '2026-06-22T00:00:00.000000Z',
  },
};

describe('api client', () => {
  beforeEach(() => {
    axios.post.mockReset();
    import.meta.env.VITE_API_BASE_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkVoucher', () => {
    it('POSTs to /api/check with flight_number and flight_date', async () => {
      axios.post.mockResolvedValueOnce({ status: 200, data: OK_CHECK_BODY });

      const result = await checkVoucher({ flight_number: 'GA102', flight_date: '2026-07-01' });

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/check',
        { flight_number: 'GA102', flight_date: '2026-07-01' },
      );
      expect(result).toEqual(OK_CHECK_BODY);
    });

    it('returns the parsed body as-is', async () => {
      axios.post.mockResolvedValueOnce({ status: 200, data: { exists: true, message: 'exists' } });
      const result = await checkVoucher({ flight_number: 'GA102', flight_date: '2026-07-01' });
      expect(result).toEqual({ exists: true, message: 'exists' });
    });

    it('propagates the axios error on non-2xx', async () => {
      const error = new Error('Request failed with status code 422');
      error.response = { status: 422, data: { message: 'invalid', errors: { flight_number: ['required'] } } };
      axios.post.mockRejectedValueOnce(error);
      await expect(
        checkVoucher({ flight_number: '', flight_date: '2026-07-01' }),
      ).rejects.toBe(error);
    });
  });

  describe('generateVoucher', () => {
    it('POSTs to /api/generate with the full payload', async () => {
      axios.post.mockResolvedValueOnce({ status: 201, data: GENERATE_BODY });

      const payload = {
        crew_name: 'Putri',
        crew_id: 'CRW001',
        flight_number: 'GA102',
        flight_date: '2026-07-01',
        aircraft_type: 'ATR',
      };

      const result = await generateVoucher(payload);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/generate',
        payload,
      );
      expect(result).toEqual(GENERATE_BODY.data);
    });

    it('returns only the inner data field, not the wrapper', async () => {
      axios.post.mockResolvedValueOnce({ status: 201, data: GENERATE_BODY });
      const result = await generateVoucher({
        crew_name: 'Putri',
        crew_id: 'CRW001',
        flight_number: 'GA102',
        flight_date: '2026-07-01',
        aircraft_type: 'ATR',
      });
      expect(result).toHaveProperty('seats', ['1A', '14C', '18F']);
      expect(result).not.toHaveProperty('data');
    });

    it('propagates the axios error on 409 duplicate', async () => {
      const error = new Error('Request failed with status code 409');
      error.response = { status: 409, data: { message: 'Voucher already exists for this flight and date.' } };
      axios.post.mockRejectedValueOnce(error);
      await expect(
        generateVoucher({
          crew_name: 'Putri',
          crew_id: 'CRW001',
          flight_number: 'GA102',
          flight_date: '2026-07-01',
          aircraft_type: 'ATR',
        }),
      ).rejects.toBe(error);
    });
  });

  describe('listVouchers', () => {
    beforeEach(() => {
      axios.get.mockReset();
      import.meta.env.VITE_API_BASE_URL = 'http://localhost:8000';
    });

    it('GETs /api/vouchers and returns the parsed data array', async () => {
      const body = {
        data: [
          {
            id: 1, crew_name: 'Putri', crew_id: 'CRW001',
            flight_number: 'GA102', flight_date: '2026-07-01',
            aircraft_type: 'ATR',
            seats: ['1A', '14C', '18F'],
            created_at: '2026-06-22T00:00:00.000000Z',
            updated_at: '2026-06-22T00:00:00.000000Z',
          },
          {
            id: 2, crew_name: 'Budi', crew_id: 'CRW002',
            flight_number: 'GA205', flight_date: '2026-07-03',
            aircraft_type: 'Airbus 320',
            seats: ['5A', '6B', '7C'],
            created_at: '2026-06-22T00:00:00.000000Z',
            updated_at: '2026-06-22T00:00:00.000000Z',
          },
        ],
      };
      axios.get.mockResolvedValueOnce({ status: 200, data: body });

      const result = await listVouchers();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/vouchers');
      expect(result).toEqual(body.data);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('seats', ['1A', '14C', '18F']);
    });

    it('propagates the axios error on non-2xx', async () => {
      const error = new Error('Request failed with status code 500');
      error.response = { status: 500, data: { message: 'boom' } };
      axios.get.mockRejectedValueOnce(error);

      await expect(listVouchers()).rejects.toBe(error);
    });
  });
});
