#!/bin/bash
# Compare current chart with previous version and deploy only changed components

# Get the list of changed files
CHANGED_FILES=$(git diff --name-only HEAD HEAD~1)

# Determine which components were changed
COMPONENTS_TO_UPDATE=""

if echo "$CHANGED_FILES" | grep -q "charts/api"; then
  COMPONENTS_TO_UPDATE="$COMPONENTS_TO_UPDATE api"
fi

if echo "$CHANGED_FILES" | grep -q "charts/frontend"; then
  COMPONENTS_TO_UPDATE="$COMPONENTS_TO_UPDATE frontend"
fi

if echo "$CHANGED_FILES" | grep -q "charts/database"; then
  COMPONENTS_TO_UPDATE="$COMPONENTS_TO_UPDATE database"
fi

if echo "$CHANGED_FILES" | grep -q "charts/jobs"; then
  COMPONENTS_TO_UPDATE="$COMPONENTS_TO_UPDATE jobs"
fi

if echo "$CHANGED_FILES" | grep -q "charts/shared"; then
  COMPONENTS_TO_UPDATE="$COMPONENTS_TO_UPDATE shared"
fi

if [ -z "$COMPONENTS_TO_UPDATE" ]; then
  echo "No components need updating"
  exit 0
fi

echo "Updating components: $COMPONENTS_TO_UPDATE"

# Update only the required components
for component in $COMPONENTS_TO_UPDATE; do
  echo "Deploying component: $component"
  helm upgrade --install $component ./charts/$component
done