@ECHO OFF
ECHO starting installation
cd C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\service\
nssm install PictureSharingInterface "C:\Program Files\nodejs\node.exe" "app.js"
nssm set PictureSharingInterface AppDirectory "C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\sftp-client"
nssm set PictureSharingInterface DisplayName "Picture Sharing Interface"
nssm set PictureSharingInterface Description "KION MA Picture Sharing Interface"
nssm set PictureSharingInterface AppStdout "C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\service\PSI.log"
nssm set PictureSharingInterface AppStderr "C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\service\PSI.log"
nssm start PictureSharingInterface
ECHO End installation
PAUSE