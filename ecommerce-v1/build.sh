#!/bin/bash
set -e

echo "PULLING FROM REMOTE REPOSITORY\n"

git pull

echo "\nSUCCESSFULLY PULLED\n"
echo "\nINSTALLING DEPENDENCIES\n"

npm install

echo "\nSUCCESSFULLY INSTALLED DEPENDENCIES\n"
echo "\nBUILDING PROJECT\n"

npm run build

echo "\nDONE BUILDING PROJECT\n"
   
