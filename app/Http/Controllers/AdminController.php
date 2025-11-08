<?php 
 
namespace App\Http\Controllers; 
 
use App\Models\Admin; 
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Hash; 
use Illuminate\Support\Facades\Validator; 
use Illuminate\Support\Facades\Auth;
 
class AdminController extends Controller 
{ 
    public function register(Request $request) 
    { 
        // Validasi data 
        $validator = Validator::make($request->all(), [ 
            'name' => 'required|string|max:255', 
            'email' => 'required|email|unique:admins', 
            'password' => 'required|min:6|confirmed' 
        ]); 
 
        if ($validator->fails()) { 
            return response()->json([ 
                'error' => $validator->errors()->first() 
            ], 422); 
        } 
 
        try { 
            // Create admin 
            $admin = Admin::create([ 
                'name' => $request->name, 
                'email' => $request->email, 
                'password' => Hash::make($request->password) 
            ]); 
 
            // Create token 
            $token = $admin->createToken('admin-token')->plainTextToken; 
 
            return response()->json([ 
                'token' => $token, 
                'admin' => $admin, 
                'message' => 'Admin registered successfully' 
            ], 201); 
 
        } catch (\Exception $e) { 
            return response()->json([ 
                'error' => 'Registration failed: ' . $e->getMessage() 
            ], 500); 
        } 
    } 
 
    public function login(Request $request) 
    { 
        $validator = Validator::make($request->all(), [ 
            'email' => 'required|email', 
            'password' => 'required' 
        ]); 
 
        if ($validator->fails()) { 
            return response()->json([ 
                'error' => $validator->errors()->first() 
            ], 422); 
        } 
 
        try { 
            // Coba login dengan Auth guard
            if (Auth::guard('admin')->attempt(['email' => $request->email, 'password' => $request->password])) {
                $admin = Auth::guard('admin')->user();
                $token = $admin->createToken('admin-token')->plainTextToken;
                
                return response()->json([
                    'token' => $token,
                    'admin' => $admin,
                    'message' => 'Login successful'
                ]);
            }
            
            // Jika gagal, coba cari admin secara manual
            $admin = Admin::where('email', $request->email)->first(); 
 
            if (!$admin || !Hash::check($request->password, $admin->password)) { 
                return response()->json([ 
                    'error' => 'Invalid credentials' 
                ], 401); 
            } 
 
            $token = $admin->createToken('admin-token')->plainTextToken; 
            
            return response()->json([ 
                'token' => $token, 
                'admin' => $admin, 
                'message' => 'Login successful' 
            ]); 
 
        } catch (\Exception $e) { 
            return response()->json([ 
                'error' => 'Login failed: ' . $e->getMessage() 
            ], 500); 
        } 
    } 
}