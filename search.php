<?php
//header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
// add this if you need POST/PUT:
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Origin: http://127.0.0.1:5173");
header("Access-Control-Allow-Credentials: true");
?>

<?php
    $db_config = parse_ini_file("db.ini");
    
    $servername = $db_config["servername"];
    $database = $db_config["database"];
    $username = $db_config["username"];
    $password = $db_config["password"];
    
    $conn = new mysqli($servername, $username, $password, $database);

    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    function getProducts($conn, $search = null, $index = -1, $count = -1) {
        $vendors = null;
        
        if(isset($_COOKIE['Vendors'])) {
            $vendor_string = $_COOKIE['Vendors'];
            $vendors = array_filter(explode('|', $vendor_string));
        }
        
        try {
            $query = "SELECT * FROM Products WHERE 1=1";
            $bind_str = '';
            $data = array();
            
            $conditions = array();

            if ($search !== null) {
                $keywords = array_filter(explode(' ', $search));
                foreach ($keywords as $word) {
                    $conditions[] = " AND LOWER(name) LIKE LOWER(?)";
                    $bind_str.= 's';
                    $data[] = "%".$word."%";
                }
                
            }
            /* 
            if ($vendors !== null && count($vendors) > 0) {
                $conditions[] = " AND vendor IN (" . str_repeat('?,', max(0, count($vendors)-1)) . "?)";
                $bind_str .= str_repeat('s', count($vendors));
                $data = array_merge($data, $vendors);

            }
            */
            $query .= "".implode('', $conditions);

            $orders = array("Name","Price desc","Price asc", "Vendor");

            if (isset($_COOKIE['Sort']) and $_COOKIE['Sort'] !== '') {
                $sort = urldecode($_COOKIE['Sort']);

                if (in_array($sort, $orders)) {
                    $query .= " ORDER BY $sort";
                }
                //echo $sort;
                //$query .= " ORDER BY $sort";
            }

            if (is_numeric($index) && is_numeric($count) && $index != -1 && $count != -1) {
                $query .= " LIMIT $count OFFSET $index";
            }
            
            $stmt = $conn->prepare($query);

            if ($bind_str !== '') {
                $stmt->bind_param($bind_str, ...$data);
            }
            
            $stmt->execute();
            
            $result = $stmt->get_result();
            $products = $result->fetch_all(MYSQLI_ASSOC);
            
           sendResponse($products);
        } catch (Exception $e) {
            sendResponse([]);
        }
    }
 
    function getWishlist($conn) {
        $wishlist = json_decode(file_get_contents('php://input'), true);
        $products = array();

        $vendors = null;

        if(isset($_COOKIE['Vendors'])) {
            $vendor_string = $_COOKIE['Vendors'];
            $vendors = str_replace("'", "\'", array_filter(explode('|', $vendor_string)));
        }

        try {
            $query = "SELECT * FROM Products WHERE variant_id=? AND vendor=?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ss", $var_id, $vendor);
            
            foreach ($wishlist as $item) {
                $var_id = $item['variant_id'];
                $vendor = $item['vendor'];
    
                if ($vendors !== null && in_array($vendor, $vendors)) {
                    $vendor = str_replace("\\'", "'", $item['vendor']);
    
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    if ($result->num_rows !== 0) {
                        $products[] = $result->fetch_assoc();
                    }
                }
            }
            
            sendResponse($products);
        } catch (Exception $e) {
            sendResponse([]);
        }
    }

    function sendResponse($products) {
        header('Content-Type: application/json');
        echo json_encode($products);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $search = isset($_GET['name']) ? $_GET['name'] : null;
        $index = isset($_GET['index']) ? $_GET['index'] : -1;
        $count = isset($_GET['count']) ? $_GET['count'] : -1;
        getProducts($conn, $search, $index, $count);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        getWishlist($conn);
    }
?>