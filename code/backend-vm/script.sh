echo $4 | sudo -S su



if [ $1 -eq 1 ]
then


sudo docker run --rm -e CHE_CONTAINER_PREFIX='ULLcloudIDE' -e CHE_WORKSPACE_AGENT_DEV_INACTIVE__STOP__TIMEOUT__MS=2592000000 -v /var/run/docker.sock:/var/run/docker.sock -v $7$2:/data -e CHE_PORT=$3 -e CHE_HOST=$5 -e CHE_DOCKER_IP_EXTERNAL=$6 eclipse/che:6.0.0-M4 start --skip:preflight


a=$(sudo docker ps -qf "name=ULLcloudIDE-$3")
sudo docker update --restart no $a

fi

if [ $1 -eq 0 ]
then
sudo docker run --rm -e CHE_CONTAINER_PREFIX='ULLcloudIDE' -e CHE_WORKSPACE_AGENT_DEV_INACTIVE__STOP__TIMEOUT__MS=2592000000 -v /var/run/docker.sock:/var/run/docker.sock -v $7$2:/data -e CHE_PORT=$3 -e CHE_HOST=$5 -e CHE_DOCKER_IP_EXTERNAL=$6 eclipse/che:6.0.0-M4 stop --skip:preflight


fi
