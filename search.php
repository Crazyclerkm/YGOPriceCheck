<?php
    $servername = "localhost";
    $database = "ygoprice_YGOPriceCheck";
    $username = "ygoprice_admin";
    $password = "@Bt*=4tssjh]";
    
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
            
            if ($vendors !== null) {
                $conditions[] = " AND vendor IN (" . str_repeat('?,', count($vendors)-1) . "?)";
                $bind_str .= str_repeat('s', count($vendors));
                $data = array_merge($data, $vendors);

            }

            $query .= "".implode('', $conditions);

            $orders = array("Name","Price desc","Price asc", "Vendor");
            
            if (isset($_COOKIE['Sort']) and $_COOKIE['Sort'] !== '' and in_array($_COOKIE['Sort'], $orders)) {
                $sort = $_COOKIE['Sort'];
                $query .= " ORDER BY $sort";
            }

            if (is_numeric($index) && is_numeric($count) && $index != -1 && $count != -1) {
                $query .= " LIMIT $count OFFSET $index";
            }
            

            $stmt = $conn->prepare($query);
            $stmt->bind_param($bind_str, ...$data);
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