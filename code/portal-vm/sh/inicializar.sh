echo $1 | sudo -S su

sudo iptables -t nat -F
sudo echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward
sudo iptables -P FORWARD ACCEPT
sudo iptables -t nat -A POSTROUTING -o $2 -j MASQUERADE
#sudo iptables -t nat -A POSTROUTING -p tcp -o $3 -j SNAT --to $4:1-65535 #aplicamos source nat, no es del todo necesario pero conviene.

echo "Iptables vaciado"
