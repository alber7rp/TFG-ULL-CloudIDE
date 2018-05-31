
echo $1 | sudo -S su

if [ $2 -eq 1 ]
then

sudo rm -Rf $3/$4-$5

fi

if [ $2 -eq 2 ]
then

sudo rm -Rf $3/*-$4

fi
