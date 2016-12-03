#!/bin/bash

# First we append the saved layout of worspace N to workspace M
i3-msg "workspace 1 ; append_layout /home/steve/.config/i3/workspaces/workspace-1.json"

# And finally we fill the containers with the programs they had
(xfce4-terminal &)
(xfce4-terminal &)
(terminator -e vim &)
(termite -e nmon &)
