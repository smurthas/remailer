# -*- mode: ruby -*-
# # vi: set ft=ruby :

Vagrant.configure("2") do |config|

	# Define the CoreOS box
	config.vm.box = "coreos"
	config.vm.box_url = "http://storage.core-os.net/coreos/amd64-generic/dev_channel/coreos_production_vagrant.box"

  config.vm.network "private_network", ip: "172.12.8.150"
  config.vm.synced_folder ".", "/home/core/share", id: "core", :nfs => true,  :mount_options   => ['nolock,vers=3,udp']
	# Share the current folder via NFS
#	config.vm.synced_folder ".", "/home/core/share"

end
