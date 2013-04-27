SHELL := /bin/bash
BUILDDIR ?= .build
all: help
help:
	@echo
	@echo "Usage: make <target>"
	@echo
	@echo "target = "
	@echo
	@echo -e "\t help\t\t - this help" 
	@echo
	@echo -e "\t prep\t\t - prepares your system for development" 
	@echo
	@echo -e "\t build\t\t - builds app and backend"
	@echo
	@echo -e "\t test\t\t - test app and backend"
	@echo
	@echo -e "\t clean\t\t - test app and backend"
	@echo
	@echo -e "\t rebuild\t - clean and build app and backend"
	@echo
	@echo -e "\t run\t - Run the backend server"
	@echo
.PHONY:all help


VERBOSE?=0
ifeq ($(VERBOSE), 0)
	LOGFILE = $(shell pwd -P)/$(BUILDDIR)/build.log
	LOG= >> $(LOGFILE)
	HIDECMD=@
else
	LOGFILE=$(shell pwd -P)/$(BUILDDIR)/build.log
	LOG=
	HIDECMD=
endif

build: build_backend

build_prep:
	@mkdir -p $(BUILDDIR)
	$(HIDECMD) touch $(LOGFILE)

clean: clean_backend
	@mkdir -p $(BUILDDIR)
	@rm -f $(LOGFILE)
	@rmdir -p $(BUILDDIR)
test: test_backend
rebuild: rebuild_backend
run: run_backend
.PHONY: build clean rebuild test build_prep run


#========= Prepare ==========
prep:
	$(HIDECMD) ./scripts/prep.sh
.PHONY: prep

#========  Backend ==============

LOADNVMCMD=. ~/.nvm/nvm.sh && nvm use 0.10.3 > /dev/null

build_backend: build_prep
	@echo "Building Backend..."
	$(HIDECMD) $(HIDECMD) scripts/selfsigngen.sh $(LOG) 2>&1
	$(HIDECMD) $(LOADNVMCMD) && npm install
	$(HIDECMD) $(LOADNVMCMD) && jshint .
.PHONY:build_backend

clean_backend:
	@echo "Cleaning Backend..."
	@rm -rf $(BUILDDIR)/test_backend
.PHONY: clean_backend

test_backend_unit:
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/unit
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/unit/logs
	$(HIDECMD) cp -r * $(BUILDDIR)/test_backend/unit
	$(HIDECMD) $(LOADNVMCMD) && cd $(BUILDDIR)/test_backend/unit && mocha -R spec test
.PHONY: test_backend_unit


test_backend_cov:
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/cov
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/cov/logs
	$(HIDECMD) cp -r * $(BUILDDIR)/test_backend/cov
	$(HIDECMD) rm -rf $(BUILDDIR)/test_backend/cov/lib
	$(HIDECMD) $(LOADNVMCMD) && jscover ./lib $(BUILDDIR)/test_backend/cov/lib
#	$(HIDECMD) cp -r ./node_modules ./$(BUILDDIR)/test_backend/cov/
##Enable this when problems running coverage to check if non coverage unit tests are passing
#$(HIDECMD) $(LOADNVMCMD) && mocha -R spec $(BUILDDIR)/test_backend/cov/backend/test
	$(HIDECMD) $(LOADNVMCMD) && cd $(BUILDDIR)/test_backend/cov && JSCOV=1 mocha -R json-cov test > coverage.json
	$(HIDECMD) $(LOADNVMCMD) && cd $(BUILDDIR)/test_backend/cov && JSCOV=1 mocha -R html-cov test > coverage.html
	$(HIDECMD) echo "coverage at file://`pwd -P`/$(BUILDDIR)/test_backend/cov/coverage.html"
	$(HIDECMD) $(LOADNVMCMD) && node scripts/checkCov.js $(BUILDDIR)/test_backend/cov/coverage.json
.PHONY: test_backend_cov

test_backend: build_backend
	@echo "Testing Backend..."
	$(HIDECMD) $(MAKE) test_backend_unit
	$(HIDECMD) $(MAKE) test_backend_cov
	$(HIDECMD) echo 'Backend Tests Successfull'
.PHONY: test_backend

rebuild_backend: clean_backend
	$(HIDECMD)$(MAKE) build_backend
.PHONY: rebuild_backend


kill_backend:
	-$(HIDECMD) killall node-dev
	-$(HIDECMD) killall node-inspector
.PHONY: kill_backend

debug_backend: kill_backend
	-$(HIDECMD) $(LOADNVMCMD) && node-inspector &
	-$(HIDECMD) open http://0.0.0.0:8080/debug?port=5858
	-$(HIDECMD) $(LOADNVMCMD) && node-dev --debug-brk backend | bunyan
	$(MAKE) kill_backend
.PHONY: debug_backend

run_backend: build_backend
	$(HIDECMD) echo 'Running Backend...'
	-$(HIDECMD) ./scripts/run_backend.sh

