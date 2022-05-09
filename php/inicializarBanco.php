<?php
	// Parametros do banco
	$user = 'root';
	$password = 'pj4dtbs-IcU5768';
	$db = '';
	$host = '172.19.0.3';
	$port = 3306;

	// Inicia uma conexao com o banco
	$link = mysqli_init();
	$success = mysqli_real_connect(
   		$link, 
   		$host, 
   		$user, 
   		$password, 
   		$db,
		$port
	);

	// Cria o banco nomeado "banco_RVA" e comeca a usa-lo
	$resultado = mysqli_query($link, "CREATE DATABASE IF NOT EXISTS banco_RVA");
	$resultado = mysqli_query($link, "USE banco_RVA");

	// Cria a table pessoa
	$resultado = mysqli_query($link, "CREATE TABLE IF NOT EXISTS pessoa(
		id_user INT(4)  NOT NULL AUTO_INCREMENT ,
		nome VARCHAR(40)  NOT NULL ,
		email VARCHAR(100)  NOT NULL ,
		data_nascimento date  NOT NULL ,
		senha VARCHAR(32)  NOT NULL ,
		autenticado TINYINT(1) ,
		PRIMARY KEY(id_user))");

	// Cria a table autenticar
	$resultado = mysqli_query($link, "CREATE TABLE IF NOT EXISTS seguranca(
		id_user INT(4)  NOT NULL,
		token_autenticar VARCHAR(128) ,
		token_sessao VARCHAR(32) ,
		token_senha VARCHAR(64) ,
		PRIMARY KEY(id_user))");

	// Cria a table cartao
	$resultado = mysqli_query($link, "CREATE TABLE IF NOT EXISTS cartao(
		id_cartao INT(4) NOT NULL AUTO_INCREMENT ,
		id_user INT(4)  NOT NULL ,
		nome VARCHAR(64) NOT NULL ,
		numero VARCHAR(1000) NOT NULL ,
		CVV VARCHAR(1000) NOT NULL ,
		PRIMARY KEY(id_cartao))");

?>
