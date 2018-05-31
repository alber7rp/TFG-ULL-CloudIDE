#./internet.sh pass enp3s0f2 77.77.77.72/24 77.77.77.71
echo $1 | sudo -S su

#sudo ifconfig $2 $3
sudo route add default gw $2
#echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
