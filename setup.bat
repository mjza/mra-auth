@echo off

REM Configure Git to use the commit message template locally
git config --local commit.template .gitmessage.txt

REM Configure Git to use the custom hooks directory
git config --local core.hooksPath .githooks

REM No need to set executable permissions on Windows
REM Ensure hook scripts are compatible with Windows

echo Setup completed successfully.
