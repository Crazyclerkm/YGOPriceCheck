<?php

    $json = file_get_contents('vendors.json');

    $json_data = json_decode($json,true);

    echo $json_data;

?>