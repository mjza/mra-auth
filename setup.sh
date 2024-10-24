#!/bin/bash

# Configure Git to use the commit message template locally
git config --local commit.template .gitmessage.txt

# Configure Git to use the custom hooks directory
git config --local core.hooksPath .githooks

# Make sure all hook scripts are executable
chmod +x .githooks/*
