FROM node:20.9.0-alpine
WORKDIR /GoLiveBackend
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
# COPY package-lock.json ./
RUN yarn install
# RUN yarn build
# RUN npm install --silent
# RUN npm install react-scripts@4.0.3 -g --silent
COPY . ./
# EXPOSE 3000
CMD ["yarn", "start"]