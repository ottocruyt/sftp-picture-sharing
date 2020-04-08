- installation of service needs admin rights
- running the service needs node.exe installed (for this specific application)

Install using GUI:
- start cmd as ADMIN!
- navigate to the folder where nssm.exe is (not necessary if nssm.exe is in PATH)
- nssm install PictureSharingInterface (PictureSharingInterface is the name of the service for nssm, bash:  ./nssm install PictureSharingInterface).
- This will start the GUI to install the service.
    ** mandatory **
	- Application path: the path the to program you want to run, eg. node => C:\Program Files\nodejs\node.exe
	- Startup directory: the path were the program eg. node will have to run. This will be the folder with the files being served on the webpage (C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\sftp-client)
	- arguments: the file the program has to run in that folder eg. app.js
	** optional **
	- In the details page you can add more information that is displayed in the services tab of the windows task manager/Microsoft Management Console services.
	- for logging output, go to the IO tab and specify folder + "filename.log" in Output and Error to output console logs to a file, eg. C:\Users\cruyto\Desktop\webserverRack\nodejsSFTP\service\PSI.log
	
- after installation, you have to actually start it using nssm: start PictureSharingInterface
- now the webserver is reachable on http://localhost:3000
