@ECHO OFF
ECHO Starting removal.
cd C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\service\
nssm stop PictureSharingInterface
nssm remove PictureSharingInterface confirm
ECHO Uninstall finished.
PAUSE