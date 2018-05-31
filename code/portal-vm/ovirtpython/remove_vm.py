import ovirtsdk4.types as types
import conexion as conn
import sys

connection = conn.createconnection()

# Find the service that manages VMs:
vms_service = connection.system_service().vms_service()

# Find the VM:
vm = vms_service.list(search='name='+sys.argv[1])[0]

# Note that the "vm" variable that we assigned above contains only the
# data of the VM, it doesn't have any method like "remove". Methods are
# defined in the services. So now that we have the description of the VM
# we can find the service that manages it, calling the locator method
# "vm_service" defined in the "vms" service. This locator method
# receives as parameter the identifier of the VM and retursn a reference
# to the service that manages that VM.
vm_service = vms_service.vm_service(vm.id)

# Now that we have the reference to the service that manages the VM we
# can use it to remove the VM. Note that this method doesn't need any
# parameter, as the identifier of the VM is already known by the service
# that we located in the previous step.
vm_service.remove()

# Close the connection to the server:
connection.close()
