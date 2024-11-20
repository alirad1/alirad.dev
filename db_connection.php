<?php
$host = "sql213.infinityfree.com";
$username = "if0_37738660";
$password = "qIoDaPcdTAd";
$database = "if0_37738660_ehr";

// Establish connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>