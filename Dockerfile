FROM node:stretch-slim as base

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# Dependencies
FROM base as dependencies
RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production
# copy production node_modules aside
RUN cp -R node_modules prod_node_modules
# install ALL node_modules, including 'devDependencies'
RUN npm install



# Test image
# run linters, setup and tests
FROM dependencies AS test
COPY . .
RUN  npm run test

# Release image
FROM base AS release
# copy production node_modules
COPY --from=dependencies /usr/src/app/prod_node_modules ./node_modules
# copy app sources
COPY . .
# expose port and define CMD
ENV NODE_ENV=production
EXPOSE 2000
CMD [ "node", "index.js" ]
