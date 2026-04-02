                Tabulation System Installation Guide

-----------CREATED BY: RENDELL GERMAN AND JOHN RICK PORAL-------------


Follow these steps to correctly install, configure, and run the Web-Based Tabulation System in the correct order.



✅ 1. Install XAMPP

	Run the XAMPP Installer.

	Install it using the default settings.

	After installation, launch the XAMPP Control Panel.



✅ 2. Change MySQL Database Password to root

	Open XAMPP Control Panel.

	Start Apache and MySQL.

	Click MySQL Admin or open phpMyAdmin.

	Go to User Accounts.

	Select the root user and click Edit Password.

	Set the password to:

		'root'

	Save the changes.


	⚠ UPDATE phpMyAdmin CONFIG (config.inc.php)

	Open the file:

		C:/xampp/phpMyAdmin/config.inc.php

	Find the line:

		$cfg['Servers'][$i]['password'] = '';

	Change it to:

		$cfg['Servers'][$i]['password'] = 'root';

	Also ensure this line is set:

		$cfg['Servers'][$i]['user'] = 'root';

	Save the file.

	Restart Apache and MySQL.



✅ 3. Copy the System Files into htdocs

	Copy the folder:

	     tabulationsystem

	Paste it into:

	     'C:/xampp/htdocs/'



✅ 4. Import the Database into XAMPP

	Open phpMyAdmin.

	Click Databases.

	Create a new database named:

		'tabdb'

	Select the newly created tabdb database.

	Go to the Import tab.

	Click Choose File and locate:

		-->tabulationsystem
		   -->db
		      -->tabdb.sql

	Click Import to upload the database.



✅ 5. Change Apache Port to 8081

	In XAMPP Control Panel, click Config next to Apache.

	Open --> httpd.conf.

	Modify the following lines:

		'#Listen 12.34.56.78:80'
		'Listen 8081'
		'ServerName localhost:8081'

	If the file contains this commented line, ensure it stays commented:

		'#Listen 12.34.56.78:8081'

	Save the file.

	Restart Apache.



✅ 6. Install Node.js

	Run the Node.js Installer.

	Install using default settings.



✅ 7. Run the System in the Browser

	Step 1: Get Your IPv4 Address

	Open CMD.

	Type:
	  --> ipconfig

	Copy your IPv4 Address.


	Step 2: Access the System

	In any browser, type:

	IPv4:8081/tabulationsystem

Example:

	192.168.1.12:8081/tabulationsystem



✅ 8. Default Admin Account

	The system includes a default administrator login:

		Username: admin
		Password: admin

	The automatic account for judges:

		Username: *YOUR USERNAME CREATED in JUDGES PAGE*
		Password: judge123



✅ System is Now Ready to Use!

	If errors occur, ensure that:

	Apache and MySQL are running.

	Apache port is set to 8081.

	Database password is set to root.

	phpMyAdmin config.inc.php is updated to root.

	Database 'tabdb' is successfully imported.

	The 'tabulationsystem' folder is inside htdocs.



✅ End of README
