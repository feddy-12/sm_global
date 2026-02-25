<?php
/**
 * GE-Express API - Backend de Producción
 * Maneja la persistencia en MySQL para Clientes, Paquetes y Usuarios.
 */
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Configuración de la base de datos
$db_host = 'localhost';
$db_name = 'ge_express_db';
$db_user = 'root'; // Cambiar por tu usuario de Hostinger (ej: u123456_admin)
$db_pass = '';     // Cambiar por tu contraseña de base de datos

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method == 'OPTIONS') { exit; }

switch ($action) {
    case 'login':
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $conn->prepare("SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE email = ?");
        $stmt->execute([$data->email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Simulación de verificación (en producción usar password_verify)
        if ($user) {
            echo json_encode([
                "id" => $user['id'],
                "name" => $user['fullname'],
                "email" => $user['email'],
                "role" => $user['role'],
                "branch" => "Sede Central"
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Credenciales no válidas"]);
        }
        break;

    case 'parcels':
        if ($method == 'GET') {
            $stmt = $conn->query("SELECT * FROM parcels ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($method == 'POST') {
            $data = json_decode(file_get_contents("php://input"));
            $stmt = $conn->prepare("INSERT INTO parcels (tracking_code, sender_id, receiver_name, receiver_phone, receiver_address, origin_province, destination_province, parcel_type, weight, cost, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data->trackingCode, $data->senderId, $data->receiverName, 
                $data->receiverPhone, $data->receiverAddress, $data->origin, 
                $data->destination, $data->type, $data->weight, $data->cost, $data->createdById
            ]);
            echo json_encode(["success" => true, "id" => $conn->lastInsertId()]);
        }
        break;

    case 'customers':
        if ($method == 'GET') {
            $stmt = $conn->query("SELECT * FROM customers");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($method == 'POST') {
            $data = json_decode(file_get_contents("php://input"));
            $stmt = $conn->prepare("INSERT INTO customers (fullname, phone, dni_passport, email, address) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data->fullName, $data->phone, $data->dni, $data->email, $data->address]);
            echo json_encode(["success" => true]);
        }
        break;

    default:
        echo json_encode(["status" => "GE-Express API is running"]);
        break;
}
?>