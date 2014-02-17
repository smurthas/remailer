.PHONY: test build

build:
	@docker build -rm -t stdinbox .

# install system level dependencies into deps/
test: build
	@mkdir -p coverage
	@docker run -d -p 4001:4001 -name stdinbox_test_etcd coreos/etcd
	@docker run -v `pwd`/coverage:/app/coverage stdinbox npm test
	@docker stop stdinbox_test_etcd
	@docker rm stdinbox_test_etcd
