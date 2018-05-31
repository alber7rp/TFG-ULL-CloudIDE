import ovirtsdk4.types as types
import conexion as conn
import sys

connection = conn.createconnection()

# Find the virtual machine:
vms_service = connection.system_service().vms_service()
vm = vms_service.list(search='name='+sys.argv[1])[0]

# Find the service that manages the virtual machine:
vm_service = vms_service.vm_service(vm.id)

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

# Close the connection to the server:
connection.close()
