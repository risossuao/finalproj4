var loc = window.location.pathname;
var chavePub = null;
var chaveSec = null;
var iVetor = null;
var tempoSave = null;
$(document).ready(function(){
	// Obtem a chave publica do server e coloca em cookie
	chavePub = getCookie("ChaveRVA=");
	if(chavePub == null || chavePub == ""){
		solicitarChave();
	}
	chavePub = atob(chavePub);

	// Define uma chave privada e vetor de inicializacao e os coloca em cookies
	chaveSec = getCookie("ChaveSec=");
	iVetor = getCookie("iv=");
	tempoSave = getCookie("tempoAtu=");
	if(chaveSec == null || chaveSec == ""){
		defChaveSec();
	} else{
		chaveSec = atob(chaveSec);
		iVetor = atob(iVetor);
	}
	// Checa se esta na pagina auth para rodar a autenticacao por token
	if(loc.substring(loc.lastIndexOf('/')+1, loc.lastIndexOf('/')+10) == "auth.html"){	
		autenticarCadastro();
	}
	prepararPagina();
	funcaoClique();
	trocaChave();
});

// Funcao para troca de chave secreta
function trocaChave(){
	if((Date.now() - tempoSave) < 300*1000){
		return;
	}
	novaSec = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(16)).toString();
	novoVetor = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(8)).toString();

	// Cria o pacote com os dados
    var data = {"chave": novaSec, "iv": novoVetor};
    var valores = JSON.stringify(data);

    // cria um objeto da classe JSEncrypt
    var criptografia = new JSEncrypt();
    // adiciona a chave pública ao objeto
    criptografia.setKey(chavePub);

    // Realiza a criptografia
    var mensagem_criptografada = criptografia.encrypt(valores);

	informacoes = {"tipo":'testando',"criptoChave":mensagem_criptografada};
	informacoes = enCripto(informacoes);
	// Pede informacoes da pagina
	$.ajax({
		type: "POST",
		dataType: "json",
		async: false,
		url: "/php/tratarDados.php",
		data: {
			dados: informacoes[0],
			hashDados: informacoes[1] 
		},
		success: function(data) {
			chaveSec = novaSec;
			iVetor = novoVetor;
			tempoSave = Date.now();
			secKey = btoa(novaSec);
			vetorIni = btoa(novoVetor);
			document.cookie = "tempoAtu="+tempoSave+";expires=; path=/";
			document.cookie = "ChaveSec="+secKey+";expires=; path=/";
			document.cookie = "iv="+vetorIni+";expires=; path=/";
		}
	});
}

// Funcao criptografar simetrica
function enCripto(data){
	// vetor de inicialização
    var iv = CryptoJS.enc.Utf8.parse(iVetor);

    // converte para JSON e cria um hash
    var valores = JSON.stringify(data);
	var hashData = CryptoJS.MD5(valores).toString();
    // Converte para ut8 e após, para base64
    valores = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(valores)).toString();

	keyEnc = CryptoJS.enc.Utf8.parse(chaveSec); 

    // criptografa a mensagem
    // https://cryptojs.gitbook.io/docs/
    var criptografado = CryptoJS.AES.encrypt(valores, keyEnc, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.ZeroPadding
    });
 
    var criptografado_string = criptografado.toString();

    return Array(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(criptografado_string)).toString(), hashData);
}

// Funcao descriptografar simetrica
function deCripto(data){
	// Chave e IV
	var iv = CryptoJS.enc.Utf8.parse(iVetor);
	keyEnc = CryptoJS.enc.Utf8.parse(chaveSec);

	// Efetua a descriptografia
	var decripto = CryptoJS.AES.decrypt(data, keyEnc, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7
    });

	// Passa a mensagem para Utf8
	var msg = CryptoJS.enc.Utf8.stringify(decripto);

	// Separa a mensagem em pares, e forma um array com seus valores originais
	var sepPar = msg.split(';');
	var strFinal = [];
	var cont = 0;
	for(cont = 0; cont < sepPar.length; cont++){
		if(sepPar[cont] == ""){break;}
		var strTemp = sepPar[cont].split(':');
		strFinal[strTemp[0]] = strTemp[1];
	}

	return strFinal;
}

// Funcao definir chave secreta
function defChaveSec(){
	// Gera uma chave privada e vetor de inicializacao
	chaveSec = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(16)).toString();
	iVetor = CryptoJS.enc.Hex.stringify(CryptoJS.lib.WordArray.random(8)).toString();

	// Cria o pacote com os dados e o hash dele
    var data = {"chave": chaveSec, "iv": iVetor};
    var valores = JSON.stringify(data);
	var dataHash = CryptoJS.MD5(valores).toString();

    // cria um objeto da classe JSEncrypt
    var criptografia = new JSEncrypt();
    // adiciona a chave pública ao objeto
    criptografia.setKey(chavePub);

    // Realiza a criptografia
    var mensagem_criptografada = criptografia.encrypt(valores);

	// Manda os dados e o hash dele
    $.ajax({
        url: "/php/tratarDados.php",
		async: false, 
        type: 'post', 
        data: {dados: mensagem_criptografada,
			   hashDados: dataHash
			}, 
        dataType: "json",
		success: function(data) {
			tempoSave = Date.now();
			secKey = btoa(chaveSec);
			vetorIni = btoa(iVetor);
			document.cookie = "tempoAtu="+tempoSave+";expires=; path=/";
			document.cookie = "ChaveSec="+secKey+";expires=; path=/";
			document.cookie = "iv="+vetorIni+";expires=; path=/";
		}
    });
}

// Funcao pega cookie
function getCookie(nome){
	// Pega o cookie e o divide em um array
	var cookie = decodeURIComponent(document.cookie);
	var co = cookie.split(';');
	var i;
	for(i = 0; i < co.length; i++) {
		var c = co[i];
		// Testa se o primeiro caractere esta vazio
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		// Testa se o cookie e igual ao que esta procurando, e retorna o valor
		if (c.indexOf(nome) == 0) {
			return c.substring(nome.length, c.length);
		}
	}
	return null;
}

// Funcao para pedir chave publica
function solicitarChave(){
	// Solicita a chave publica do server
	$.ajax({
		type: "POST",
		dataType: "json",
		url: "/php/tratarDados.php",
		async: false,
		data: {},
		// Caso sucesso volta com a chave e hash
		success: function(data) {
			// compara o hash com o hash da chave
			if(data.hash == CryptoJS.MD5(data.chave).toString()){
				var ch = btoa(data.chave);
				document.cookie = "ChaveRVA="+ch+";expires=; path=/";
				chavePub = ch;
			}
			else{
				solicitarChave();
			}
		}
	});
}

// Funcao para preparar as paginas
function prepararPagina(){
	informacoes = {"tipo":'preparaUser'};
	informacoes = enCripto(informacoes);
	// Pede informacoes da pagina
	$.ajax({
		type: "POST",
		dataType: "json",
		async: false,
		url: "/php/tratarDados.php",
		data: {
			dados: informacoes[0],
			hashDados: informacoes[1] 
		},
		// Caso sucesso volta com as informacoes e forma a pagina
		success: function(data) {
			data = deCripto(data);
			if(data.status == 'n'){
				// Testa se o usuario esta em uma pagina indevida e joga ele para a index
				if(loc.substring(loc.lastIndexOf('/')+1, loc.lastIndexOf('/')+50) == "user.html"){
					window.location.href = "https://192.168.4.4/index.html";
				}
				return;
			}
			// Se a sessao for expirada
			if(data.status == 'e'){
				document.cookie = "tempoAtu=;expires=; path=/";
				document.cookie = "ChaveSec=;expires=; path=/";
				document.cookie = "iv=;expires=; path=/";
				window.location.href = "https://192.168.4.4/index.html";
				return;
			}
			// Muda o login para imagem de usuario
			$("#loginUsuario").html("<a href='https://192.168.4.4/pages/user.html' class='nav-link'>Usuario</a>");

			// PREPARA A PAGINA USER.HTML //
			if(window.location.pathname == "/192.168.4.4/pages/user.html"){
				$("#nomePessoaId").html(data.nome);
				if(data.cartao != ''){
					var cartoes = data.cartao.split('/');
					var cont = 0;
					for(cont = 0; cont < cartoes.length-1; cont++){
						var cardAtual = cartoes[cont].split('=');
						var cardAp = '<a class="cartao" id_card="'+cardAtual[0]+'">'+cardAtual[1]+'</a><br>'
						$("#cartoesUserId").append(cardAp);
					}
				}
			}
		}
	});
}

// Funcao de autenticar usuario
function autenticarCadastro(){
	// Pega o token da URL
	var tokenAuth = window.location.href.split("#").pop();
	informacoes = {"tipo":'autenticar',"token":tokenAuth};
	informacoes = enCripto(informacoes);
	if(tokenAuth.length == 128){
		// Manda o token para autenticar a conta no php
		$.ajax({
			type: "POST",
			dataType: "json",
			url: "../php/tratarDados.php",
			data: {
				dados: informacoes[0],
				hashDados: informacoes[1]
			},
			// Caso sucesso volta a pagina principal
			success: function(data) {
				data = deCripto(data);
				if(data.status == 's'){
					window.location.href = "https://192.168.4.4/index.html";
				}
			}
		});
	}
	else{
		mudarSenha(tokenAuth);
	}
}

function mudarSenha(token){
	var over =  '<div class="caixa-overlay" id="caixaOverId"><div class="table-overlay"><table>'+
				'<tr><td colspan="2" class="botaox-sair"><img src="../img/close.png" class="img-xfechar" alt="..." id="fechaOverlayId"></td></tr>'+
				'<tr><td colspan="2"><h4 class="alinha-texto-centro">Insira uma nova senha</h4></td></tr>'+
				'<tr><td colspan="2" class="pad-especial"><input type="password" id="novaSenhaId" placeholder="Nova senha"></td></tr>'+
				'<tr><td colspan="2"><button id="botaoNovaSenhaId" class="botao-email">Mudar senha</td></tr>'+
				'<tr><td id="formRespostaId" class="form-erro"></td></tr>'+
				'</table></div></div>';
		
		// Ativa o overlay
		$("#dOverlay").html(over);
		$("#caixaOverId").css("height", "210px");
		$("#dOverlay").show();

		// Fecha a janela
		$("#fechaOverlayId").click(function(){
			$("#dOverlay").hide();
			$("#dOverlay").html("");
		});

		// Manda a nova senha para o php
		$("#botaoNovaSenhaId").click(function(){
			var senha = $("#novaSenhaId").val();

			var testeCad = false;
			// Testa se a senha tem 8 caracteres e letras minusculas e maiuscula
			if(senha.length < 12 || senha == senha.toLowerCase() || senha == senha.toUpperCase()){
				testeCad = true;
			}

			var testeSimbolo = "!@#$%^&*";
			var simboloTodos = true;
			for(cont = 0; cont < testeSimbolo.length; cont++){
				if(senha.indexOf(testeSimbolo.charAt(cont)) != -1){
					simboloTodos = false;
					break;
				}
			}
			if(testeCad || simboloTodos){
				$("#novaSenhaId").addClass("erro-login");
				$("#novaSenhaId").val("");
				$("#formRespostaId").css("background-color", "white");
				$("#formRespostaId").html("Senha precisa ter no mínimo 12 caracteres, letras maiúsculas e minúsculas, e 1 simbolo!");
				return;
			}

			// Transforma a senha em hash
			senha = $.MD5(senha+"aexh452");

			informacoes = {"tipo":'mudancaSenha',"novaSenha":senha,"tokenA":token};
			informacoes = enCripto(informacoes);
			// Manda o formulario para o php buscar os dados no banco
			$.ajax({
				type: "POST",
				dataType: "json",
				url: "../php/tratarDados.php",
				data: {
					dados: informacoes[0],
					hashDados: informacoes[1]
				},
				// Se a mudança der certo, volta para o index
				success: function(data) {
					data = deCripto(data);
					console.log(data);
					if(data.status == 's'){
						$("#dOverlay").hide();
						$("#dOverlay").html("");
						document.cookie = "tempoAtu=;expires=; path=/";
						document.cookie = "ChaveSec=;expires=; path=/";
						document.cookie = "iv=;expires=; path=/";
						window.location.href = "https://192.168.4.4/index.html";
					}
					$("#formRespostaId").css("background-color", "white");
					$("#formRespostaId").html(data.mensagem);
				}
			});
		});
}

// Armazena funcoes de clique
function funcaoClique(){
	// Redireciona para cursos
	$(".botao-redi").click(function(){
		window.location.href = "./pages/cursos.html";
	});

	// Funcao clique para formatar a pagina para cadastro
	$("#formularioCadastroId").click(function(){
		trocaChave();
		var form =  '<tr><td><h1>Cadastro</h1></td></tr>'+
					'<tr><td><input type="text" id="usuarioId" placeholder="Nome de usuario"></td></tr>'+
	      			'<tr><td><input type="email" id="emailId" placeholder="E-mail"></td></tr>'+
					'<tr><td><input type="date" id="dataId" placeholder="DD/MM/AAAA"></td></tr>'+
					'<tr><td><input type="password" id="senhaId" placeholder="Senha"></td></tr>'+
					'<tr><td><input type="password" id="confSenhaId" placeholder="Confirmar senha"></td></tr>'+
					'<tr><td><span>Ja tem conta?<a id="formularioLoginId" class="esquecer-senha mover-texto">Logue aqui!</a></span></td></tr>'+
					'<tr><td colspan="2"><button id="botaoCadastroId" class="botao-login">Cadastrar</td></tr>'+
					'<tr><td id="formRespostaId" class="form-erro"></td></tr>';
		
		$("#cadastroLoginId").html(form);
		funcaoClique();
	});

	// Funcao clique para formatar a pagina para login
	$("#formularioLoginId").click(function(){
		trocaChave();
		document.location.reload();
	});

	// Funcao clique sair
	$("#sairContaId").click(function(){
		informacoes = {"tipo":'sair'};
		informacoes = enCripto(informacoes);
		// Manda o formulario para o php buscar os dados no banco
		$.ajax({
			type: "POST",
			dataType: "json",
			url: "../php/tratarDados.php",
			data: {
				dados: informacoes[0],
				hashDados: informacoes[1]
			},
			// Esconde o overlay
			success: function(data) {
				data = deCripto(data);
				if(data.status == "ok"){
					document.cookie = "tempoAtu=;expires=; path=/";
					document.cookie = "ChaveSec=;expires=; path=/";
					document.cookie = "iv=;expires=; path=/";
					window.location.href = "https://192.168.4.4/index.html";
				}
			}
		});
	});

	// Funcao clique para autenticar
	$("#autenticarUserId").click(function(){
		trocaChave();
		var over =  '<div class="caixa-overlay" id="caixaOverId"><div class="table-overlay">'+
					'<table>'+
            		'<tr><td colspan="2" class="botaox-sair"><img src="../img/close.png" class="img-xfechar" alt="..." id="fechaOverlayId"></td></tr>'+
            		'<tr><td colspan="2"><h4 class="alinha-texto-centro">Confirme sua senha</h4></td></tr>'+
					'<tr><td colspan="2" class="pad-especial"><input type="password" id="senhaAuthId" placeholder="Senha"></td></tr>'+
					'<tr><td colspan="2"><button id="botaoAuthId" class="botao-email">Autenticar</td></tr>'+
					'<tr><td id="formRespostaDelId" class="form-erro"></td></tr>'+
					'</table></div></div>';

		// Ativa o overlay
		$("#dOverlay").html(over);
		$("#caixaOverId").css("height", "210px");
		$("#dOverlay").show();

		// Fecha a janela
		$("#fechaOverlayId").click(function(){
			$("#dOverlay").hide();
			$("#dOverlay").html("");
		});

		// Manda a senha para o php
		$("#botaoAuthId").click(function(){
			trocaChave();
			var senha = $("#senhaAuthId").val();
			// Testa se a senha tem caracteres
			if(senha.length < 12 || senha == senha.toLowerCase() || senha == senha.toUpperCase()){
				$("#formRespostaDelId").css("background-color", "white");
				$("#formRespostaDelId").html("Por favor, digite uma senha válida.");
				return;
			}
			var senhamd5 = $.MD5(senha+"aexh452");

			informacoes = {"tipo":'authC',"senha":senhamd5};
			informacoes = enCripto(informacoes);
			// Manda o formulario para o php buscar os dados no banco
			$.ajax({
				type: "POST",
				dataType: "json",
				url: "../php/tratarDados.php",
				data: {
					dados: informacoes[0],
					hashDados: informacoes[1]
				},
				// Esconde o overlay
				success: function(data) {
					data = deCripto(data);
					if(data.status == 's'){
						$("#dOverlay").hide();
						$("#dOverlay").html("");
					}
					$("#formRespostaDelId").css("background-color", "white");
					$("#formRespostaDelId").html(data.mensagem);
				}
			});
		});
	});

	// Funcao clique esqueceu a senha
	$("#esqueciSenhaId").click(function(){
		trocaChave();
		var over =  '<div class="caixa-overlay"><div class="table-overlay">'+
					'<table><tr><td colspan="2" class="botaox-sair"><img src="../img/close.png" class="img-xfechar" alt="..." id="fechaOverlayId"></td></tr>'+
					'<tr><td colspan="2"><h4 class="alinha-texto-centro">Insira seu email abaixo</h4></td></tr>'+
					'<tr><td colspan="2" class="pad-especial"><input type="email" id="emailRecuperarId" placeholder="Endereco de email da conta"></td></tr>'+
					'<tr><td colspan="2"><button id="botaoRecuperarId" class="botao-email">Recuperar Senha</td></tr>'+
					'<tr><td id="formRecEmailId" class="form-erro"></td></tr>'+
			  		'</table></div></div>';
		
		// Ativa o overlay
		$("#dOverlay").html(over);
		$("#dOverlay").show();

		// Fecha a janela
		$("#fechaOverlayId").click(function(){
			$("#dOverlay").hide();
			$("#dOverlay").html("");
		});

		// Manda o nome de email para o php
		$("#botaoRecuperarId").click(function(){
			trocaChave();
			var nomeEmail = $("#emailRecuperarId").val();

			informacoes = {"tipo":'recuperarConta',"email":nomeEmail};
			informacoes = enCripto(informacoes);
			// Manda o formulario para o php buscar os dados no banco
			$.ajax({
				type: "POST",
				dataType: "json",
				url: "../php/tratarDados.php",
				data: {
					dados: informacoes[0],
					hashDados: informacoes[1]
				},
				// Esconde o overlay
				success: function(data) {
					data = deCripto(data);
					$("#formRespostaId").removeClass("form-correto");
					if(data.status == "s"){
						$("#formRespostaId").addClass("form-correto");
					}
					$("#dOverlay").hide();
					$("#dOverlay").html("");
					$("#formRespostaId").html(data.mensagem);
				}
			});
		});
	});

	// Funcao para puxar dados cartao
	$(".cartao").click(function(){
		trocaChave();
		var idC = $(this).attr("id_card");
		var numC = $(this).html();

		var over =  '<div class="caixa-overlay" id="caixaOverId"><div class="table-overlay">'+
					'<table>'+
            		'<tr><td colspan="3" class="botaox-sair"><img src="../img/close.png" class="img-xfechar" alt="..." id="fechaOverlayId"></td></tr>'+
            		'<tr><td colspan="3"><h4 class="alinha-texto-centro">Cartão ID:'+idC+'</h4></td></tr>'+
					'<tr><td colspan="3"><h5 class="alinha-texto-centro">Número:'+numC+'</h4></td></tr>'+
					'<tr><td colspan="3"><button id="botaoRemoveCartaoId" class="botao-deletar-conta">Remover cartão</td></tr>'+
					'<tr><td colspan="3" id="formRespostaDelId" class="form-erro"></td></tr>'+
					'</table></div></div>';
		
		// Ativa o overlay
		$("#dOverlay").html(over);
		$("#caixaOverId").css("height", "270px");
		$("#caixaOverId").css("top", "26%");
		$("#dOverlay").show();

		// Fecha a janela
		$("#fechaOverlayId").click(function(){
			$("#dOverlay").hide();
			$("#dOverlay").html("");
		});

		// Deleta cartao
		$("#botaoRemoveCartaoId").click(function(){
			informacoes = {"tipo":'deletarCard',"idCard":idC};
			informacoes = enCripto(informacoes);
			// Manda o formulario para o php buscar os dados no banco
			$.ajax({
				type: "POST",
				dataType: "json",
				url: "../php/tratarDados.php",
				data: {
					dados: informacoes[0],
					hashDados: informacoes[1]
				},
				// Esconde o overlay
				success: function(data) {
					data = deCripto(data);
					if(data.status == 's'){
						$("#dOverlay").hide();
			  			$("#dOverlay").html("");
						document.location.reload();
						return;
					}
					$("#formRespostaDelId").css("background-color", "white");
					$("#formRespostaDelId").html(data.mensagem);
				}
			});
		});
	});

	// Funcao de clique adicionar cartao
	$("#adicionarCartaoId").click(function(){
		trocaChave();
		var over =  '<div class="caixa-overlay" id="caixaOverId"><div class="table-overlay">'+
					'<table>'+
            		'<tr><td colspan="3" class="botaox-sair"><img src="../img/close.png" class="img-xfechar" alt="..." id="fechaOverlayId"></td></tr>'+
            		'<tr><td colspan="3"><h4 class="alinha-texto-centro">Digite seu cartão</h4></td></tr>'+
					'<tr><td colspan="2" class="pad-especial"><input type="text" id="nomeProprieId" placeholder="Nome completo"></td>'+
					'<td colspan="1" class="pad-especial"><input type="text" id="numeroCartaoId" placeholder="Numero do cartão" maxlength="16"></td>'+
					'<td colspan="1" class="pad-especial"><input type="text" id="numeroCVVId" placeholder="CVV" maxlength="4"></td></tr>'+
					'<tr><td colspan="3"><button id="botaoAddCartaoId" class="botao-email">Adicionar Cartão</td></tr>'+
					'<tr><td colspan="3" id="formRespostaDelId" class="form-erro"></td></tr>'+
					'</table></div></div>';

		// Ativa o overlay
		$("#dOverlay").html(over);
		$("#caixaOverId").css("height", "270px");
		$("#caixaOverId").css("top", "26%");
		$("#dOverlay").show();

		// Fecha a janela
		$("#fechaOverlayId").click(function(){
			$("#dOverlay").hide();
			$("#dOverlay").html("");
		});

		// Manda o cartao
		$("#botaoAddCartaoId").click(function(){
			trocaChave();
			var nomeP = $("#nomeProprieId").val();
			var card = $("#numeroCartaoId").val();
			var cvv = $("#numeroCVVId").val();
			// Testa se a senha tem caracteres
			if(card.length < 13 || cvv.length < 3 || nomeP == ""){
				$("#nomeProprieId").val("");
				$("#numeroCartaoId").val("");
			    $("#numeroCVVId").val("");
				$("#formRespostaDelId").css("background-color", "white");
				$("#formRespostaDelId").html("Por favor, digite um cartão válido.");
				return;
			}
			var cont = 0;
			var testeNums = "0123456789";
			for(cont = 0; cont < card.length; cont++){
				if(testeNums.includes(card[cont])){
					continue;
				}
				$("#nomeProprieId").val("");
				$("#numeroCartaoId").val("");
			    $("#numeroCVVId").val("");
				$("#formRespostaDelId").css("background-color", "white");
				$("#formRespostaDelId").html("Por favor, digite um cartão válido.");
				return;
			}
			for(cont = 0; cont < cvv.length; cont++){
				if(testeNums.includes(card[cont])){
					continue;
				}
				$("#nomeProprieId").val("");
				$("#numeroCartaoId").val("");
			    $("#numeroCVVId").val("");
				$("#formRespostaDelId").css("background-color", "white");
				$("#formRespostaDelId").html("Por favor, digite um cartão válido.");
				return;
			}

			informacoes = {"tipo":'adicionarCartao',"nome":nomeP,"cartao":card,"CVV":cvv};
			informacoes = enCripto(informacoes);
			// Manda o formulario para o php buscar os dados no banco
			$.ajax({
				type: "POST",
				dataType: "json",
				url: "../php/tratarDados.php",
				data: {
					dados: informacoes[0],
					hashDados: informacoes[1]
				},
				// Esconde o overlay
				success: function(data) {
					data = deCripto(data);
					if(data.status == 's'){
						$("#dOverlay").hide();
			  			$("#dOverlay").html("");
						document.location.reload();
						return;
					}
					$("#formRespostaDelId").css("background-color", "white");
					$("#formRespostaDelId").html(data.mensagem);
				}
			});
		});
	});

	// Funcao de clique chamar alteracao de senha
	$("#alterarSenhaId").click(function(){
		trocaChave();
		mudarSenha(null);
	});

	// Funcao deletar conta
	$("#deletarContaId").click(function(){
		trocaChave();
		var over =  '<div class="caixa-overlay" id="caixaOverId"><div class="table-overlay">'+
					'<table>'+
            		'<tr><td colspan="2" class="botaox-sair"><img src="../img/close.png" class="img-xfechar" alt="..." id="fechaOverlayId"></td></tr>'+
            		'<tr><td colspan="2"><h4 class="alinha-texto-centro">Confirme sua senha</h4></td></tr>'+
					'<tr><td colspan="2" class="pad-especial"><input type="password" id="senhaDeletarContaId" placeholder="Senha"></td></tr>'+
					'<tr><td colspan="2"><button id="botaoDeletarId" class="botao-deletar-conta">Deletar Conta</td></tr>'+
					'<tr><td id="formRespostaDelId" class="form-erro"></td></tr>'+
					'</table></div></div>';

		// Ativa o overlay
		$("#dOverlay").html(over);
		$("#caixaOverId").css("height", "210px");
		$("#dOverlay").show();

		// Fecha a janela
		$("#fechaOverlayId").click(function(){
			$("#dOverlay").hide();
			$("#dOverlay").html("");
		});

		// Manda a senha para o php
		$("#botaoDeletarId").click(function(){
			trocaChave();
			var senha = $("#senhaDeletarContaId").val();
			// Testa se a senha tem caracteres
			if(senha.length < 12 || senha == senha.toLowerCase() || senha == senha.toUpperCase()){
				$("#formRespostaDelId").css("background-color", "white");
				$("#formRespostaDelId").html("Por favor, digite uma senha válida.");
				return;
			}
			var senhamd5 = $.MD5(senha+"aexh452");

			informacoes = {"tipo":'deletarConta',"senha":senhamd5};
			informacoes = enCripto(informacoes);
			// Manda o formulario para o php buscar os dados no banco
			$.ajax({
				type: "POST",
				dataType: "json",
				url: "../php/tratarDados.php",
				data: {
					dados: informacoes[0],
					hashDados: informacoes[1]
				},
				// Esconde o overlay
				success: function(data) {
					data = deCripto(data);
					if(data.status == 's'){
						document.cookie = "tempoAtu=;expires=; path=/";
						document.cookie = "ChaveSec=;expires=; path=/";
						document.cookie = "iv=;expires=; path=/";
						$("#dOverlay").hide();
						$("#dOverlay").html("");
						window.location.href = "https://192.168.4.4/index.html";
					}
					$("#formRespostaDelId").css("background-color", "white");
					$("#formRespostaDelId").html(data.mensagem);
				}
			});
		});
	});

	// Funcao de clique de cadastro
	$("#botaoCadastroId").click(function(){
		trocaChave();

		// Definicao de variaveis auxiliares e limpeza do texto de erro
		var form = ["#usuarioId", "#emailId", "#dataId", "#senhaId", "#confSenhaId"];
		var aux = [];
		var testeCad = false;
		$("#formRespostaId").html("");

		// Obtem os itens do formulario e testa se eles estao vazios para dar erro
		for(cont = 0; cont < form.length; cont++){
			$(form[cont]).removeClass("erro-login");
			aux.push($(form[cont]).val());
			if(aux[cont] == ""){
				testeCad = true;
				$(form[cont]).addClass("erro-login");
				$("#formRespostaId").html("Campos incompletos!");
			}
		}
		if(testeCad){return;}

		// Testa se a senha tem 8 caracteres e letras minusculas e maiuscula
		if(aux[3].length < 12 || aux[3] == aux[3].toLowerCase() || aux[3] == aux[3].toUpperCase()){
			testeCad = true;
		}
		var testeSimbolo = "!@#$%^&*";
		var simboloTodos = true;
		for(cont = 0; cont < testeSimbolo.length; cont++){
			if(aux[3].indexOf(testeSimbolo.charAt(cont)) != -1){
				simboloTodos = false;
				break;
			}
		}
		if(testeCad || simboloTodos){
			$(form[3]).addClass("erro-login");
			$(form[4]).addClass("erro-login");
			$(form[3]).val("");
			$(form[4]).val("");
			$("#formRespostaId").html("Senha precisa ter no mínimo 12 caracteres, letras maiúsculas e minúsculas, e 1 simbolo!");
			return;
		}

		// Testa se a senhas sao iguais
		if(aux[3] != aux[4]){
			testeCad = true;
			$(form[4]).addClass("erro-login");
			$(form[4]).val("");
			$("#formRespostaId").html("Confirmação de senha incorreta!");
			return;
		}

		// Transforma a senha em hash
		aux[3] = $.MD5(aux[3]+"aexh452");


		informacoes = {"tipo":'cadastro',"nome":aux[0],"email":aux[1],"dataNascimento":aux[2],"senha":aux[3]};
		informacoes = enCripto(informacoes);
		// Manda o formulario para o php de tratamento de dados
		$.ajax({
			type: "POST",
			dataType: "json",
			url: "../php/tratarDados.php",
			data: {
				dados: informacoes[0],
				hashDados: informacoes[1]
			},
			// Imprime mensagem de sucesso ou falha
			success: function(data) {
				data = deCripto(data);
				$("#formRespostaId").removeClass("form-correto");
				if(data.status == "s"){
					$("#formRespostaId").addClass("form-correto");
				}
				$("#formRespostaId").html(data.mensagem);
			}
		});
	});


	// Funcao de clique de login
	$("#botaoLoginId").click(function(){
		trocaChave();

		// Definicao de variaveis auxiliares e limpeza do texto de erro
		var form = ["#usuarioId", "#senhaId"];
		var aux = [];
		var testeCad = false;
		$("#formRespostaId").html("");

		// Obtem os itens do formulario e testa se eles estao vazios para dar erro
		for(cont = 0; cont < form.length; cont++){
			$(form[cont]).removeClass("erro-login");
			aux.push($(form[cont]).val());
			if(aux[cont] == ""){
				testeCad = true;
				$(form[cont]).addClass("erro-login");
				$("#formRespostaId").removeClass("form-correto");
				$("#formRespostaId").html("Campos incompletos!");
			}
		}
		if(testeCad){return;}

		// Transforma a senha em hash
		aux[1] = $.MD5(aux[1]+"aexh452");

		informacoes = {"tipo":'login',"nome":aux[0],"senha":aux[1]};
		informacoes = enCripto(informacoes);
		// Manda o formulario para o php buscar os dados no banco
		$.ajax({
			type: "POST",
			dataType: "json",
			url: "../php/tratarDados.php",
			data: {
				dados: informacoes[0],
				hashDados: informacoes[1]
			},
			// Imprime mensagem de sucesso ou falha
			success: function(data) {
				data = deCripto(data);
				$("#formRespostaId").removeClass("form-correto");
				if(data.status == "s"){
					$("#formRespostaId").addClass("form-correto");
					window.location.href = "https://192.168.4.4/index.html";
				}
				$("#formRespostaId").html(data.mensagem);
			}
		});
	});
}
