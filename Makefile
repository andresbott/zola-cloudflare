SHELL := /bin/bash

# ======================================================================================
default: help;

ZOLA_VERSION ?= 0.21.0
MAKEFILE_DIR := $(realpath $(dir $(lastword $(MAKEFILE_LIST))))
ZOLA_DIR := $(MAKEFILE_DIR)/.local/zola
ZOLA_TAR := zola-v$(ZOLA_VERSION)-x86_64-unknown-linux-gnu.tar.gz
ZOLA_URL := https://github.com/getzola/zola/releases/download/v$(ZOLA_VERSION)/$(ZOLA_TAR)

install-zola: ## install zola locally
	@echo "Installing Zola $(ZOLA_VERSION)..."
	curl -sLJO "$(ZOLA_URL)"
	mkdir -p "$(ZOLA_DIR)"
	tar -C "$(ZOLA_DIR)" -xf "$(ZOLA_TAR)"
	rm "$(ZOLA_TAR)"
	@echo "Add to PATH: export PATH=$(ZOLA_DIR):$$PATH"

build: ## run the local zola to build the project
	@echo "Building the site..."
	"$(ZOLA_DIR)/zola" build --minify


run: ## run the cf function locally
	npx wrangler dev --local


help: ## Show this help
	@egrep '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST)  | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m·%-20s\033[0m %s\n", $$1, $$2}'
