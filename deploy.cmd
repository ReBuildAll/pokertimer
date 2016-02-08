@echo off
echo "NPM"
call npm install
echo "BOWER"
call bower install
echo "Generate static file"
call gulp build --environment Production
echo "Deploy"
xcopy %DEPLOYMENT_SOURCE%\dist %DEPLOYMENT_TARGET% /Y /E
