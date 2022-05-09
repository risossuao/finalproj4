<?php
    if(!isset($_SESSION['id'])){
        $retorno['status'] = 'n';
        $retorno['mensagem'] = 'Não existe sessão';
    }
    else{
        $segundos = time() - $_SESSION['tempo'];

        if($segundos > $_SESSION['sessao']){
            $retorno['status'] = 'e';
            $retorno['mensagem'] = 'Sessão expirada';
        }
        else{
            $segundosAuth = time() - $_SESSION['tempoAuth'];
            $_SESSION['tempo'] = time();
            $retorno['status'] = 's';
            $retorno['mensagem'] = 'Sessão válida!';
            if($segundosAuth > $_SESSION['autenticado']){
                $retorno['auth'] = 'n';
            }
            else{$retorno['auth'] = 's';}
        }
    }
?>