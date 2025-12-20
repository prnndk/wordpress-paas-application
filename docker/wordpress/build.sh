# Build and push WordPress PaaS custom image

# Build the image
docker build -t wp-paas-wordpress:latest .

docker tag wp-paas-wordpress:latest prnndk/wp-paas-wordpress:latest

docker push prnndk/wp-paas-wordpress:latest
