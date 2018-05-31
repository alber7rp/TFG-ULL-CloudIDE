echo $1 | sudo -S su

tcpkill host $2 and portrange 8082-8089 and portrange 32768-65535  &

sleep 20

kill -9 $!
