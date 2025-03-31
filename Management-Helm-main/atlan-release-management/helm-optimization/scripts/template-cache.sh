#!/bin/bash
# Cache Helm templates to avoid redundant processing

CACHE_DIR=".helm-cache"
mkdir -p $CACHE_DIR

# Function to hash a chart's template directory
hash_templates() {
  find $1/templates -type f | sort | xargs cat | md5sum | awk '{print $1}'
}

# Function to check if we have a cached render
check_cache() {
  local chart_dir=$1
  local values_file=$2
  local values_hash=$(md5sum $values_file | awk '{print $1}')
  local template_hash=$(hash_templates $chart_dir)
  local cache_key="${chart_dir}-${template_hash}-${values_hash}"
  
  if [ -f "$CACHE_DIR/$cache_key" ]; then
    echo "Cache hit: Using cached render for $chart_dir"
    cat "$CACHE_DIR/$cache_key"
    return 0
  fi
  
  return 1
}

# Function to cache a rendered template
cache_render() {
  local chart_dir=$1
  local values_file=$2
  local output=$3
  local values_hash=$(md5sum $values_file | awk '{print $1}')
  local template_hash=$(hash_templates $chart_dir)
  local cache_key="${chart_dir}-${template_hash}-${values_hash}"
  
  echo "$output" > "$CACHE_DIR/$cache_key"
  echo "Cached render for $chart_dir"
}

# Usage example
chart_dir="./charts/api"
values_file="./values.yaml"

# Try to get from cache first
if ! check_cache $chart_dir $values_file; then
  # Cache miss, render the template
  echo "Cache miss: Rendering template for $chart_dir"
  rendered=$(helm template $chart_dir -f $values_file)
  cache_render $chart_dir $values_file "$rendered"
  echo "$rendered"
fi