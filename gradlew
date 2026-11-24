#!/bin/sh
APP_HOME=$(cd "$(dirname "$0")" && pwd)
WRAPPER_JAR="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"
if [ ! -f "$WRAPPER_JAR" ]; then
  echo "gradle-wrapper.jar missing"
  exit 1
fi
exec java -jar "$WRAPPER_JAR" "$@"
