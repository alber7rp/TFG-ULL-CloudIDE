import ovirtsdk4.types as types
import conexion as conn
import time
import sys

connection = conn.createconnection()

# Get the reference to the root of the tree of services:
system_service = connection.system_service()

# Get the reference to the service that manages the storage domains:
storage_domains_service = system_service.storage_domains_service()

# Get the reference to the service that manages the templates:
templates_service = system_service.templates_service()

print "Adding VM"

# When a template has multiple versions they all have the same name, so
# we need to explicitly find the one that has the version name or
# version number that we want to use. In this case we want to use
# version 3 of the template.
templates = templates_service.list(search='name=ULL-CloudIDE-backend-tpl')
template_id = None
for template in templates:
    if template.version.version_number == 5:
        template_id = template.id
        break



# Get the reference to the service that manages the virtual machines:
vms_service = system_service.vms_service()

# Add a new virtual machine explicitly indicating the identifier of the
# template version that we want to use and indicating that template disk
# should be created on specific storage domain for the virtual machine:
vm = vms_service.add(
    types.Vm(
        name=sys.argv[1],
        cluster=types.Cluster(
            name='Cluster-Rojo'
        ),
        template=types.Template(
            id=template_id
        ),
    )
)

print "VM added"


# Get a reference to the service that manages the virtual machine that
# was created in the previous step:
vm_service = vms_service.vm_service(vm.id)

# Wait till the virtual machine is down, which indicats that all the
# disks have been created:
while True:
    time.sleep(5)
    vm = vm_service.get()
    if vm.status == types.VmStatus.DOWN:
        break

print "VM created"

print "Starting VM"

# Start the virtual machine enabling cloud-init and providing the
# password for the `root` user and the network configuration:
vm_service.start(
    use_cloud_init=True,
    vm=types.Vm(
        initialization=types.Initialization(
            nic_configurations=[
                types.NicConfiguration(
                    name='eth0',
                    on_boot=True,
                    boot_protocol=types.BootProtocol.STATIC,
                    ip=types.Ip(
                        version=types.IpVersion.V4,
                        address=sys.argv[2],
                        netmask='255.255.255.0'
                    )
                )
            ]
        )
    )
)

print "VM started"

# Close the connection to the server:
connection.close()
