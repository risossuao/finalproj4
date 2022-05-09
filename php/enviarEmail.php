<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\OAuth;
use League\OAuth2\Client\Provider\Google;
require 'vendor/autoload.php';

date_default_timezone_set('Etc/UTC');

$mail = new PHPMailer(true);

try {
    //Server settings
    $mail->SMTPDebug = SMTP::DEBUG_SERVER;                      //Enable verbose debug output
    $mail->isSMTP();                                            //Send using SMTP
    $mail->Host       = 'smtp.gmail.com';                     //Set the SMTP server to send through
    $mail->SMTPAuth   = true;                                   //Enable SMTP authentication
    $email = 'rafazeteste@gmail.com';
    $clientId = '587732476690-ckups0bohb1bfd1soep60jhq1arh40sh.apps.googleusercontent.com';
    $clientSecret = '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';
    $refreshToken = '1//04lYujbpkZJilCgYIARAAGAQSNwF-L9IrR3owxBgXXRDL6iMUgYVu0srRm8kh2xFwPsOhwoN2jhA9Y12oP8c8lpGdwmpIEzOMsXw';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            //Enable implicit TLS encryption
    $mail->AuthType = 'XOAUTH2';
    $mail->Port       = 465;                                    //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS
    $provider = new Google(
        [
            'clientId' => $clientId,
            'clientSecret' => $clientSecret,
        ]
    );
    $mail->setOAuth(
        new OAuth(
            [
                'provider' => $provider,
                'clientId' => $clientId,
                'clientSecret' => $clientSecret,
                'refreshToken' => $refreshToken,
                'userName' => $email,
            ]
        )
    );

    //Recipients
    $mail->setFrom('rafazeteste@gmail.com', 'Mailer');
    $mail->addAddress('rafaselner@gmail.com');     //Add a recipiet

    //Content
    $mail->isHTML(true);                                  //Set email format to HTML
    $mail->Subject = 'Here is the subject';
    $mail->Body    = 'This is the HTML message body <b>in bold!</b>';
    $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
}
?>
