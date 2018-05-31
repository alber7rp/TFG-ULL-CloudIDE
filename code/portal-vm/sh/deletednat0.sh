#!/bin/bash

#Ejemplo de uso: ./deletednat.sh ip_source passwordroot
echo $2 | sudo -S su
#echo $1
for line_num in $(sudo iptables -w -n --line-numbers --list PREROUTING -t nat | awk -v ip=$1 '$5==ip {print $8"-"$9"-"$10"-"$11}')
do
  # You can't just delete lines here because the line numbers get reordered
  # after deletion, which would mean after the first one you're deleting the
  # wrong line. Instead put them in a reverse ordered list.
  LINES="$line_num $LINES"
done

#echo $LINES
# Delete the lines, last to first.
for line in $LINES
do
  ej=$(echo $line | tr "-" "\n")

  ip="";
  puerto="";
  dports=0;

  for addr in $ej
  do

      echo "> [$addr]"

      if echo "$addr" | grep -q "to";then
        #echo "encontrado to" ;
        ip=${addr:3};
        #echo "esta es la ip"
        #echo $ip;
      elif echo "$addr" | grep -q "dpt";then
        #echo "encontrado dpt" ;
        puerto=${addr:4};
        #echo $puerto;
      elif echo "$addr" | grep -q ":";then
        puerto=$addr;
        dports=1;
        #echo "dports encontrado";
        #echo $puerto;
      fi

  done

  echo "Proceso de eliminación"
  if [ $dports -eq 1 ] #es dports
  then
    echo "Eliminando multipuertos";
    sudo iptables -w -t nat -p tcp -D PREROUTING -s $1 --match multiport --dports $puerto -j DNAT --to-destination $ip

  else
    echo "Eliminando puerto singular";
    sudo iptables -w -t nat -p tcp -D PREROUTING -s $1 --dport $puerto -j DNAT --to-destination $ip
  fi

done

unset LINES
