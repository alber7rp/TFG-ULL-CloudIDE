# Ejemplo de uso: ./dnat.sh 1/2/3/4 ip_origen ip_destino puerto_server passwordroot
echo $5 | sudo -S su
echo $1

if [ $1 -eq 1 ]
then
sudo iptables -w -t nat -p tcp -A PREROUTING -s $2 --match multiport --dports 32768:65535 -j DNAT --to-destination $3
sudo iptables -w -t nat -p tcp -A PREROUTING -s $2 --dport 8000 -j DNAT --to-destination $3
sudo iptables -w -t nat -p tcp -A PREROUTING -s $2 --dport $4 -j DNAT --to-destination $3

fi

if [ $1 -eq 2 ]
then
sudo iptables -w -t nat -p tcp -A PREROUTING -s $2 --match multiport --dports 32768:65535 -j DNAT --to-destination $3
sudo iptables -w -t nat -p tcp -A PREROUTING -s $2 --dport 8000 -j DNAT --to-destination $3

fi

if [ $1 -eq 3 ]
then
sudo iptables -w -t nat -p tcp -A PREROUTING -s $2 --dport $4 -j DNAT --to-destination $3

fi

if [ $1 -eq 4 ]
then

	#echo $1
	d="to:$3";
	p="dpt:$4";

	acumulador=0;

	for line_num in $(sudo iptables -w -n --line-numbers --list PREROUTING -t nat | awk -v ip=$2 -v ipd=$d -v ipp=$p '$5==ip && $9==ipd && $8==ipp {print $8"-"$9"-"$10"-"$11}')
	do

	acumulador=$((acumulador+1));

	done

	#echo "Total de repeticiones $acumulador";

	for i in `seq 1 $acumulador`;
	do
		#echo $i
		sudo iptables -w -t nat -p tcp -D PREROUTING -s $2 --dport $4 -j DNAT --to-destination $3
	done

fi
