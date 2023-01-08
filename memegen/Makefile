export PYTHONBREAKPOINT=ipdb.set_trace

.PHONY: all
all: install

.PHONY: ci
ci: format check test

###############################################################################
# System Dependencies

.PHONY: doctor
doctor:
	bin/verchew --exit-code

###############################################################################
# Project Dependencies

BACKEND_DEPENDENCIES := .venv/.flag

.PHONY: install
install: $(BACKEND_DEPENDENCIES)

$(BACKEND_DEPENDENCIES): poetry.lock runtime.txt requirements.txt
	@ poetry config virtualenvs.in-project true
	poetry run python -m pip install --upgrade pip setuptools
ifdef CI
	poetry install
else
	poetry install --extras testing
endif
	@ touch $@

ifndef CI
poetry.lock: pyproject.toml
	poetry lock --no-update
	@ touch $@
runtime.txt: .python-version
	echo "python-$(shell cat $<)" > $@
requirements.txt: poetry.lock
	poetry export --format requirements.txt --output $@ --without-hashes
endif

site: install
	poetry run mkdocs build --strict
	sed -i -e 's/http:\/\/localhost:5000/https:\/\/api.memegen.link/g' site/examples/index.html
	echo memegen.link > site/CNAME
ifeq ($(CIRCLE_BRANCH),main)
	@ echo
	git config --global user.name CircleCI
	poetry run mkdocs gh-deploy --dirty
endif

.PHONY: clean
clean:
	rm -rf images site templates/_custom-* templates/*/_*

.PHONY: clean-all
clean-all: clean
	rm -rf app/tests/images
	rm -rf *.egg-info .venv

###############################################################################
# Development Tasks

PACKAGES := app scripts

.PHONY: run
run: install
	poetry run honcho start --procfile Procfile.dev

.PHONY: format
format: install
	poetry run autoflake --recursive $(PACKAGES) --in-place --remove-all-unused-imports --ignore-init-module-imports
	poetry run isort $(PACKAGES)
	poetry run black $(PACKAGES)

.PHONY: check
check: install
	poetry run mypy $(PACKAGES)

.PHONY: test
test: install
ifdef CI
	poetry run pytest --verbose --junit-xml=results/junit.xml
else
	@ if test -e .cache/pytest/v/cache/lastfailed; then \
		echo "Running failed tests..." && \
		poetry run pytest --last-failed --maxfail=1 --no-cov && \
		echo "Running all tests..." && \
		poetry run pytest --cache-clear; \
	else \
		echo "Running all tests..." && \
		poetry run pytest --new-first --maxfail=1; \
	fi
endif
ifdef SKIP_SLOW
	poetry run coveragespace update unit
else
	poetry run coveragespace update overall
endif

.PHONY: test-fast
test-fast: install
	poetry run pytest -m "not slow" --durations=10

.PHONY: test-slow
test-slow: install
	poetry run pytest -m slow --durations=0 --durations-min=0.05

.PHONY: dev
dev: install
	@ sleep 2 && touch */__init__.py &
	@ poetry run watchmedo shell-command --recursive --pattern="*.py" --command="clear && make test check format SKIP_SLOW=true && echo && echo ✅ && echo" --wait --drop

###############################################################################
# Delivery Tasks

.PHONY: run-production
run-production: install .env
	poetry run heroku local web

.PHONY: deploy
deploy: .envrc
	@ echo
	git diff --exit-code
	heroku git:remote -a memegen-staging
	@ echo
	git push heroku main

.PHONY: promote
promote: install .envrc
	@ echo
	SITE=https://staging.memegen.link poetry run pytest scripts/check_deployment.py --verbose --no-cov
	@ echo
	heroku pipelines:promote --app memegen-staging --to memegen-production
	@ echo
	sleep 30
	@ echo
	SITE=https://api.memegen.link poetry run pytest scripts/check_deployment.py --verbose --no-cov

.env:
	echo WEB_CONCURRENCY=2 >> $@
	echo MAX_REQUESTS=0 >> $@
	echo MAX_REQUESTS_JITTER=0 >> $@

.envrc:
	echo dotenv >> $@
	echo >> $@
	echo "export CF_API_KEY=???" >> $@
	echo "export REMOTE_TRACKING_URL=???" >> $@
	echo "export DEBUG=true" >> $@
