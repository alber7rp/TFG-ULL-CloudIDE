echo $1 | sudo -S su

echo "" > /etc/network/interfaces

echo "auto lo" >> /etc/network/interfaces
echo "iface lo inet loopback" >> /etc/network/interfaces
echo "auto eth0" >> /etc/network/interfaces
echo "iface eth0 inet static" >> /etc/network/interfaces
echo "address "$2 >> /etc/network/interfaces
echo "netmask 255.255.255.0" >> /etc/network/interfaces
