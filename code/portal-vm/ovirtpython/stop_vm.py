import ovirtsdk4.types as types
import time
import sys
import conexion as conn

connection = conn.createconnection()


# Get the reference to the "vms" service:
vms_service = connection.system_service().vms_service()

# Find the virtual machine:
vm = vms_service.list(search='name='+sys.argv[1])[0]

# Locate the service that manages the virtual machine, as that is where
# the action methods are defined:
vm_service = vms_service.vm_service(vm.id)

# Call the "stop" method of the service to stop it:
vm_service.stop()

# Wait till the virtual machine is down:
while True:
    time.sleep(5)
    vm = vm_service.get()
    if vm.status == types.VmStatus.DOWN:
        break

# Close the connection to the server:
