@echo off
setlocal EnableDelayedExpansion

REM Get the commit message file path from the first argument
set commit_msg_file=%1

REM Read the commit message from the file
set "commit_msg="
for /f "usebackq delims=" %%A in ("%commit_msg_file%") do (
    set "commit_msg=!commit_msg!%%A
"
)

REM Split the commit message into lines
(for /f "tokens=*" %%L in ("!commit_msg!") do (
    if not defined line1 (
        set "line1=%%L"
    ) else if not defined line2 (
        set "line2=%%L"
    ) else if not defined line3 (
        set "line3=%%L"
    )
)) >nul

REM Check if the first line matches the required pattern: [Label] Title
echo !line1! | findstr /R "^\[[A-Za-z][^]]*\] .\+" >nul
if errorlevel 1 (
    echo Error: The first line must start with a label (i.e., Feature, Bugfix, Documentation, Git) in square brackets followed by a space and a title.
    exit /b 1
)

REM Check for an empty second line
if not "!line2!"=="" (
    echo Error: The second line must be empty.
    exit /b 1
)

REM Check for the presence of a detailed description starting from the third line
if "!line3!"=="" (
    echo Error: A detailed description is required after the empty line.
    exit /b 1
)

REM All checks passed
exit /b 0
