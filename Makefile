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

include targets.makefile

