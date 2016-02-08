@echo off
npm install
bower install
gulp build --environment Production
xcopy %DEPLOYMENT_SOURCE%\dist %DEPLOYMENT_TARGET% /Y /E
