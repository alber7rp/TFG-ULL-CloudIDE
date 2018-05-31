
echo $1 | sudo -S su

sudo docker rmi $(sudo docker images | awk '$1 !~ /(alpine)|(eclipse\/che$)|(eclipse\/che-action)|(eclipse\/che-test)|(eclipse\/che-server)|(eclipse\/che-init)|(eclipse\/che-dir)|(eclipse\/che-mount)|(eclipse\/che-ip)|(docker\/compose)/ {print $3}')
