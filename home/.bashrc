#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '

export PATH=~/bin:$PATH
export EDITOR=gedit
export ANDROID_HOME=/home/steve/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk
#export USE_NINJA=false
export USE_CCACHE=1

if [ -f /usr/bin/screenfetch ]; 
then screenfetch; 
fi
# archey
