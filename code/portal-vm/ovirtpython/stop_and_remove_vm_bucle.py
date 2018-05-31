import ovirtsdk4.types as types
import time
import sys
import conexion as conn
sys.setrecursionlimit(100000)

connection = conn.createconnection()


# Get the reference to the "vms" service:
vms_service = connection.system_service().vms_service()

# Find the virtual machine:
vm = vms_service.list(search='name='+sys.argv[1])[0]

# Locate the service that manages the virtual machine, as that is where
# the action methods are defined:
vm_service = vms_service.vm_service(vm.id)

def bucle():
	try:
		# Call the "stop" method of the service to stop it:
		vm_service.stop()

		print "Stopping VM"
	except:
		print "intentando"
		time.sleep(10)
		vm = vm_service.get()
    		if vm.status == types.VmStatus.DOWN:
        		return
		else:
			bucle()

bucle()
# Wait till the virtual machine is down:
while True:
    time.sleep(5)
    vm = vm_service.get()
    if vm.status == types.VmStatus.DOWN:
        break

print "VM stopped"


# Now that we have the reference to the service that manages the VM we
# can use it to remove the VM. Note that this method doesn't need any
# parameter, as the identifier of the VM is already known by the service
# that we located in the previous step.

print "Removing VM"

def bucle2():
        try:
                # Call the "stop" method of the service to stop it:
                vm_service.remove()

                print "Removing VM"
        except:

		print "intentando"
		time.sleep(10)
		if(len(vms_service.list(search='name='+sys.argv[1]))!= 0):
			bucle2()
		else:
			return

bucle2()

print "VM removed"

# Close the connection to the server:
connection.close()
