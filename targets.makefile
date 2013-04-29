#========  Backend ==============

LOADNVMCMD =. ~/.nvm/nvm.sh && nvm use 0.10.3 > /dev/null 
TOBACKEND = cd $(BACKENDDIR)

build_backend: build_prep
	@echo "Building Backend...$(BACKENDDIR)"
	$(HIDECMD) $(HIDECMD) $(BACKENDDIR)/scripts/selfsigngen.sh $(LOG) 2>&1
	$(HIDECMD) $(LOADNVMCMD) && $(TOBACKEND) && npm install
	$(HIDECMD) $(LOADNVMCMD) && $(TOBACKEND) && jshint .
.PHONY:build_backend

clean_backend:
	@echo "Cleaning Backend...$(BUILDDIR)/test_backend"
	@rm -rf $(BUILDDIR)/test_backend
.PHONY: clean_backend

test_backend_unit:
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/unit
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/unit/logs
	$(HIDECMD) $(TOBACKEND) && cp -r * $(BUILDDIR)/test_backend/unit
	$(HIDECMD) $(LOADNVMCMD) && cd $(BUILDDIR)/test_backend/unit && mocha -R spec test
.PHONY: test_backend_unit


test_backend_cov:
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/cov
	$(HIDECMD) mkdir -p $(BUILDDIR)/test_backend/cov/logs
	$(HIDECMD) $(TOBACKEND) && cp -r * $(BUILDDIR)/test_backend/cov
	$(HIDECMD) rm -rf $(BUILDDIR)/test_backend/cov/lib
	$(HIDECMD) $(LOADNVMCMD) && jscover $(BACKENDDIR)/lib $(BUILDDIR)/test_backend/cov/lib
#	$(HIDECMD) cp -r ./node_modules ./$(BUILDDIR)/test_backend/cov/
##Enable this when problems running coverage to check if non coverage unit tests are passing
#$(HIDECMD) $(LOADNVMCMD) && mocha -R spec $(BUILDDIR)/test_backend/cov/backend/test
	$(HIDECMD) $(LOADNVMCMD) && cd $(BUILDDIR)/test_backend/cov && JSCOV=1 mocha -R json-cov test > coverage.json
	$(HIDECMD) $(LOADNVMCMD) && cd $(BUILDDIR)/test_backend/cov && JSCOV=1 mocha -R html-cov test > coverage.html
	$(HIDECMD) echo "coverage at file://$(BUILDDIR)/test_backend/cov/coverage.html"
	$(HIDECMD) $(LOADNVMCMD) && $(TOBACKEND) && node scripts/checkCov.js $(BUILDDIR)/test_backend/cov/coverage.json
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
	$(HIDECMD) $(MAKE) pre_run_backend
	$(HIDECMD) echo 'Running Backend...'
	-$(HIDECMD) $(TOBACKEND) && scripts/run_backend.sh $(NODECONFIG)
	$(HIDECMD) $(MAKE) post_run_backend

