#!/bin/bash

# First we append the saved layout of worspace N to workspace M
i3-msg "workspace 2 ;  append_layout /home/steve/.config/i3/workspaces/workspace-2.json"

# And finally we fill the containers with the programs they had
(chromium &)

