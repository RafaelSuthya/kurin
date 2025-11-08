<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ShippingController extends Controller
{
    private function rajaKey(): ?string { return env('RAJAONGKIR_API_KEY'); }
    private function rajaBase(): string { return env('RAJAONGKIR_API_BASE', 'https://api.rajaongkir.com/starter'); }
    private function provider(): string { return env('SHIPPING_PROVIDER', 'woongkir'); }
    private function woongkirKey(): ?string { return env('WOONGKIR_API_KEY'); }
    private function woongkirBase(): string { return env('WOONGKIR_API_BASE', 'https://api.woongkir.com/starter'); }
 
     /**
      * List provinces (supports Woongkir or RajaOngkir)
      */
     public function provinces()
    {
        $provider = $this->provider();
        $key = $provider === 'woongkir' ? $this->woongkirKey() : $this->rajaKey();
        $base = $provider === 'woongkir' ? $this->woongkirBase() : $this->rajaBase();

        if (!$key) {
            // Fallback demo data saat API key belum diisi
            $data = [
                ['province_id' => '6', 'province' => 'DKI Jakarta'],
                ['province_id' => '3', 'province' => 'Banten'],
                ['province_id' => '9', 'province' => 'Jawa Barat'],
            ];
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo provinces because provider key not set',
                'data' => $data,
            ]);
        }

        $cacheKey = 'shipping_provinces_' . $provider;
        $data = Cache::remember($cacheKey, now()->addHours(12), function () use ($key, $base) {
            $res = Http::withHeaders(['key' => $key])->get($base . '/province');
            if (!$res->ok()) { return null; }
            $json = $res->json();
            $results = $json['rajaongkir']['results'] ?? ($json['results'] ?? []);
            return array_map(function ($p) {
                return [
                    'province_id' => $p['province_id'] ?? null,
                    'province' => $p['province'] ?? null,
                ];
            }, $results);
        });

        if ($data === null) {
            // Graceful fallback to demo data when external fetch fails
            $demo = [
                ['province_id' => '6', 'province' => 'DKI Jakarta'],
                ['province_id' => '3', 'province' => 'Banten'],
                ['province_id' => '9', 'province' => 'Jawa Barat'],
            ];
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo provinces due to fetch failure',
                'data' => $demo,
            ]);
        }
        return response()->json(['ok' => true, 'data' => $data]);
    }

    /**
     * List cities by province_id (supports Woongkir or RajaOngkir)
     */
    public function cities(Request $request)
    {
        $provider = $this->provider();
        $key = $provider === 'woongkir' ? $this->woongkirKey() : $this->rajaKey();
        $base = $provider === 'woongkir' ? $this->woongkirBase() : $this->rajaBase();

        $provinceId = $request->query('province_id');
        if (!$provinceId) {
            return response()->json(['ok' => false, 'message' => 'province_id is required'], 422);
        }

        if (!$key) {
            // Fallback demo data kota saat API key belum diisi
            $demo = [
                '6' => [ // DKI Jakarta
                    ['city_id' => '151', 'city_name' => 'Jakarta Barat', 'type' => 'Kota', 'postal_code' => '11220'],
                    ['city_id' => '152', 'city_name' => 'Jakarta Selatan', 'type' => 'Kota', 'postal_code' => '12240'],
                ],
                '3' => [ // Banten
                    ['city_id' => '153', 'city_name' => 'Tangerang', 'type' => 'Kota', 'postal_code' => '15111'],
                    ['city_id' => '154', 'city_name' => 'Tangerang Selatan', 'type' => 'Kota', 'postal_code' => '15310'],
                ],
                '9' => [ // Jawa Barat
                    ['city_id' => '114', 'city_name' => 'Bekasi', 'type' => 'Kota', 'postal_code' => '17111'],
                ],
            ];
            $data = $demo[$provinceId] ?? [];
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo cities because provider key not set',
                'data' => $data,
            ]);
        }

        $cacheKey = 'shipping_cities_' . $provider . '_' . $provinceId;
        $data = Cache::remember($cacheKey, now()->addHours(12), function () use ($key, $base, $provinceId) {
            $res = Http::withHeaders(['key' => $key])->get($base . '/city', [
                'province' => $provinceId,
            ]);
            if (!$res->ok()) { return null; }
            $json = $res->json();
            $results = $json['rajaongkir']['results'] ?? ($json['results'] ?? []);
            return array_map(function ($c) {
                return [
                    'city_id' => $c['city_id'] ?? null,
                    'city_name' => $c['city_name'] ?? null,
                    'type' => $c['type'] ?? null,
                    'postal_code' => $c['postal_code'] ?? null,
                ];
            }, $results);
        });

        if ($data === null) {
            // Graceful fallback to demo cities when external fetch fails
            $demo = [
                '6' => [ // DKI Jakarta
                    ['city_id' => '151', 'city_name' => 'Jakarta Barat', 'type' => 'Kota', 'postal_code' => '11220'],
                    ['city_id' => '152', 'city_name' => 'Jakarta Selatan', 'type' => 'Kota', 'postal_code' => '12240'],
                ],
                '3' => [ // Banten
                    ['city_id' => '153', 'city_name' => 'Tangerang', 'type' => 'Kota', 'postal_code' => '15111'],
                    ['city_id' => '154', 'city_name' => 'Tangerang Selatan', 'type' => 'Kota', 'postal_code' => '15310'],
                ],
                '9' => [ // Jawa Barat
                    ['city_id' => '114', 'city_name' => 'Bekasi', 'type' => 'Kota', 'postal_code' => '17111'],
                ],
            ];
            $data = $demo[$provinceId] ?? [];
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo cities due to fetch failure',
                'data' => $data,
            ]);
        }
        return response()->json(['ok' => true, 'data' => $data]);
    }

    /**
     * Get shipping costs for JNE & J&T (supports Woongkir or RajaOngkir)
     */
    public function cost(Request $request)
    {
        $provider = $this->provider();
        $key = $provider === 'woongkir' ? $this->woongkirKey() : $this->rajaKey();
        if (!$key) {
            // fallback demo tanpa API key
            $weight = (int) $request->input('weight', 1000);
            $length = (float) $request->input('length', 0);
            $width  = (float) $request->input('width', 0);
            $height = (float) $request->input('height', 0);
            $volumetricKg = ($length > 0 && $width > 0 && $height > 0) ? (($length * $width * $height) / 6000) : 0; // cm-based divisor 6000
            $chargeableKg = max($volumetricKg, $weight / 1000);
            $kg = max(1, (int) ceil($chargeableKg));
            $baseJne = 10000; // IDR
            $baseJnt = 12000; // IDR
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo rates because provider key not set',
                'data' => [
                    'jne' => [
                        [ 'service' => 'REG', 'cost' => $baseJne * $kg, 'etd' => '2-3 HARI' ],
                    ],
                    'jnt' => [
                        [ 'service' => 'EZ', 'cost' => $baseJnt * $kg, 'etd' => '2-3 HARI' ],
                    ],
                ]
            ]);
        }

        $destination = $request->input('destination_city_id');
        $destSub = $request->input('destination_subdistrict_id');
        $weight = (int) $request->input('weight', 0);
        $length = (float) $request->input('length', 0);
        $width  = (float) $request->input('width', 0);
        $height = (float) $request->input('height', 0);
        $originCity = $provider === 'woongkir' ? env('WOONGKIR_ORIGIN_CITY_ID') : env('RAJAONGKIR_ORIGIN_CITY_ID');
        $originSub  = $provider === 'woongkir' ? env('WOONGKIR_ORIGIN_SUBDISTRICT_ID') : env('RAJAONGKIR_ORIGIN_SUBDISTRICT_ID');
        $base = $provider === 'woongkir' ? $this->woongkirBase() : $this->rajaBase();
        $isPro = str_contains($base, 'pro');

        if (!$originCity && !$originSub) {
            return response()->json(['ok' => false, 'message' => 'Origin must be set in .env (ORIGIN_CITY_ID or ORIGIN_SUBDISTRICT_ID)'], 400);
        }

        $volumetricKg = ($length > 0 && $width > 0 && $height > 0) ? (($length * $width * $height) / 6000) : 0; // cm-based divisor 6000
        $chargeableGrams = max(1, (int) ceil(max($weight / 1000, $volumetricKg) * 1000));

        if (!$destination && !$destSub) {
            return response()->json(['ok' => false, 'message' => 'destination_city_id or destination_subdistrict_id is required'], 422);
        }

        $couriers = ['jne', 'jnt'];
        $results = [];

        foreach ($couriers as $courier) {
            $params = [
                'origin' => $originCity ?: $originSub,
                'destination' => $destination ?: $destSub,
                'weight' => $chargeableGrams,
                'courier' => $courier,
            ];

            if ($isPro && $originSub && $destSub) {
                $params['origin'] = $originSub;
                $params['destination'] = $destSub;
                $params['originType'] = 'subdistrict';
                $params['destinationType'] = 'subdistrict';
            }

            $res = Http::withHeaders(['key' => $key])->post($base . '/cost', $params);

            if (!$res->ok()) {
                $results[$courier] = ['error' => 'Failed: ' . $res->status()];
                continue;
            }
            $json = $res->json();
            $raw = $json['rajaongkir']['results'][0]['costs'] ?? ($json['results'][0]['costs'] ?? []);
            $results[$courier] = array_map(function ($c) {
                $costVal = $c['cost'][0]['value'] ?? null;
                return [
                    'service' => $c['service'] ?? 'UNKNOWN',
                    'description' => $c['description'] ?? null,
                    'etd' => $c['cost'][0]['etd'] ?? null,
                    'cost' => $costVal,
                ];
            }, $raw);
        }

        return response()->json(['ok' => true, 'data' => $results]);
    }

    public function subdistricts(Request $request)
    {
        $cityId = $request->query('city_id');
        if (!$cityId) {
            return response()->json(['ok' => false, 'message' => 'city_id is required'], 422);
        }

        $provider = $this->provider();
        $key = $provider === 'woongkir' ? $this->woongkirKey() : $this->rajaKey();
        $base = $provider === 'woongkir' ? $this->woongkirBase() : $this->rajaBase();

        if (!$key || !str_contains($base, 'pro')) {
            // Fallback demo subdistricts (kecamatan) saat API key belum diisi atau base starter
            $demo = [
                '114' => [ // Kota Bekasi
                    ['subdistrict_id' => '1141', 'subdistrict_name' => 'Bekasi Barat'],
                    ['subdistrict_id' => '1142', 'subdistrict_name' => 'Bekasi Timur'],
                    ['subdistrict_id' => '1143', 'subdistrict_name' => 'Rawalumbu'],
                    ['subdistrict_id' => '1144', 'subdistrict_name' => 'Pondokgede'],
                ],
                '153' => [ // Kota Tangerang
                    ['subdistrict_id' => '1531', 'subdistrict_name' => 'Larangan'],
                    ['subdistrict_id' => '1532', 'subdistrict_name' => 'Ciledug'],
                    ['subdistrict_id' => '1533', 'subdistrict_name' => 'Karang Tengah'],
                    ['subdistrict_id' => '1534', 'subdistrict_name' => 'Pinang'],
                ],
                '151' => [ // Jakarta Barat
                    ['subdistrict_id' => '1511', 'subdistrict_name' => 'Kebon Jeruk'],
                    ['subdistrict_id' => '1512', 'subdistrict_name' => 'Kalideres'],
                    ['subdistrict_id' => '1513', 'subdistrict_name' => 'Palmerah'],
                ],
            ];
            $data = $demo[$cityId] ?? [];
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo subdistricts (kecamatan) because key not set or starter plan.',
                'data' => $data,
            ]);
        }

        // Jika PRO: ambil data kecamatan dari provider
        $res = Http::withHeaders(['key' => $key])->get($base . '/subdistrict', [
            'city' => $cityId,
        ]);
        if (!$res->ok()) {
            // Graceful fallback to demo subdistricts when external fetch fails
            $demo = [
                '114' => [ // Kota Bekasi
                    ['subdistrict_id' => '1141', 'subdistrict_name' => 'Bekasi Barat'],
                    ['subdistrict_id' => '1142', 'subdistrict_name' => 'Bekasi Timur'],
                    ['subdistrict_id' => '1143', 'subdistrict_name' => 'Rawalumbu'],
                    ['subdistrict_id' => '1144', 'subdistrict_name' => 'Pondokgede'],
                ],
                '153' => [ // Kota Tangerang
                    ['subdistrict_id' => '1531', 'subdistrict_name' => 'Larangan'],
                    ['subdistrict_id' => '1532', 'subdistrict_name' => 'Ciledug'],
                    ['subdistrict_id' => '1533', 'subdistrict_name' => 'Karang Tengah'],
                    ['subdistrict_id' => '1534', 'subdistrict_name' => 'Pinang'],
                ],
                '151' => [ // Jakarta Barat
                    ['subdistrict_id' => '1511', 'subdistrict_name' => 'Kebon Jeruk'],
                    ['subdistrict_id' => '1512', 'subdistrict_name' => 'Kalideres'],
                    ['subdistrict_id' => '1513', 'subdistrict_name' => 'Palmerah'],
                ],
            ];
            $data = $demo[$cityId] ?? [];
            return response()->json([
                'ok' => true,
                'warning' => 'Using demo subdistricts due to fetch failure',
                'data' => $data,
            ]);
        }
        $json = $res->json();
        $results = $json['rajaongkir']['results'] ?? ($json['results'] ?? []);
        $data = array_map(function ($s) {
            return [
                'subdistrict_id' => $s['subdistrict_id'] ?? null,
                'subdistrict_name' => $s['subdistrict_name'] ?? null,
            ];
        }, $results);

        return response()->json(['ok' => true, 'data' => $data]);
    }
 }