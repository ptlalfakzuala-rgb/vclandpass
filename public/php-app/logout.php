<?php
require_once __DIR__ . '/config.php';
session_unset();
session_destroy();
session_start();
flash('info', 'You have been logged out safely.');
header('Location: login.php');
exit;
