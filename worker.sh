export NODE_PATH=lib
shut_down() {
  printf "\rSIGINT caught, shutting down\n"
  exit
}
trap 'shut_down' SIGINT

while [ 1 -lt 2 ]; do
  node index.js
  echo "process died, sleeping 10 seconds and restarting..."
  sleep 10
done
