# Common makefile commands & variables between projects
include .make/common.mk

## Not defined? Use default repo name which is the application
ifeq ($(REPO_NAME),)
	REPO_NAME="tonicpow-js"
endif

## Not defined? Use default repo owner
ifeq ($(REPO_OWNER),)
	REPO_OWNER="tonicpow"
endif

.PHONY: clean release test

audit: ## Checks for vulnerabilities in dependencies
	@npm audit

clean: ## Remove previous builds and any test cache data
	@if [ -d $(DISTRIBUTIONS_DIR) ]; then rm -r $(DISTRIBUTIONS_DIR); fi
	@if [ -d node_modules ]; then rm -r node_modules; fi

install: ## Installs the dependencies for the packge
	@npm install

lint: ## Runs the standard-js lint tool
	@npm run lint

outdated: ## Checks for outdated packages via npm
	@npm outdated

publish: ## Will publish the version to npm
	@npm run deploy

release:: ## Run after releasing - deploy to npm
	@$(MAKE) publish

test: ## Will run unit tests
	@npm run test
