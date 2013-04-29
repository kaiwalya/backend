SHELL := /bin/bash
BACKENDDIR ?= $(shell pwd -P)
BUILDDIR ?= $(BACKENDDIR)/.build
LOGFILE ?= $(BUILDDIR)/build.log
NODECONFIG ?= --configurationFile=$(BACKENDDIR)/config/debug.json

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
	LOG= >> $(LOGFILE)
	HIDECMD=@
else
	LOG=
	HIDECMD=
endif

build: build_prep
	$(MAKE) build_backend

build_prep:
	@mkdir -p $(BUILDDIR)
	$(HIDECMD) touch $(LOGFILE)

clean: clean_backend
	@mkdir -p $(BUILDDIR)
	@rm -f $(LOGFILE)
	@rm -r "$(BUILDDIR)"
test: test_backend
rebuild: rebuild_backend
run: run_backend
.PHONY: build clean rebuild test build_prep run

pre_run_backend:

.PHONY: pre_run_backend

post_run_backend:

.PHONY: post_run_backend

#========= Prepare ==========
prep:
	$(HIDECMD) $(BACKENDDIR)/scripts/prep.sh
.PHONY: prep

include targets.makefile

