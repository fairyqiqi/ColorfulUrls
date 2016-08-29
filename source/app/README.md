# How does it work
 
1. When visiting "http://localhost" (or the actual host) in the browser, the browser makes a get request to server
2. NodeJs server receives it as a "/" request, so the express routes it to indexRouter
3. indexRouter only does one thing: sending back the "index.html" file
4. In the head of the index.html file, it firstly downloads some scripts using path of e.g. "/public/scripts/app.js"
5. This download request goes to server as a get request again
6. NodeJs express server receives it as a "/public" request, and sends back the static file using the actual path of that file on the server
7. index.html gets interpreted down and encountered an Angular directive which defines an ng-app called "tinyurlApp"
8. "tinyurlApp" is configured in app.js which was loaded before, so now it gets configured with the view/controller selectors
9. index.html then gets interpreted down again and encountered an ng-view, which triggers the selection of view/controller
10. app.js says if it's "/", replace the view with "home.html" and use homeController
11. home.html then gets displayed and it has a "Get Your Short Url" button associated with an ng-submit action: submit() 
12. User types in the long url and clicks the button. On clicking the button, submit() function gets called
13. homeController has defined the submit() function: it sends a post request with "/api/v1/urls" to server with a long url
14. NodeJs express server now sees "/api/v1", then it routes the request to restRouter
15. restRouter sees "urls", then goes to urlService to get back the shortUrl say "2" as well as the original long url and return
16. Once the post call is returned, homeController changes the address bar address to, say "/urls/2"
17. In app.js, there's a config saying that if it's "/urls/:shortUrl" ("urls/2" in this case), replace the view with "url.html" and use urlController
18. Then "url.html" gets displayed and urlController starts working
19. What urlController does is: it creates an "api/v1/urls/2" get request to server
20. NodeJs express sees "api/v1" again so routes to restRouter
21. restRouter sees "urls/:shortUrl", then it goes to urlService to get back the long url as well as the short url and return back to urlController
22. urlController gets the response and sets the variable values to be displayed in url.html
23. Now in the shortUrl field of url.html, it has a url populated: "http://localhost/2"
24. If user clicks on that shortUrl, there's no router rules in angular for "/2", so it directly goes to server
25. NodeJs express receives "/:shortUrl" now, then routes it to redirectRouter
26. redirectRouter parses out the shortUrl and call urlService to get the long url
27. Once redirectRouter gets the long url, it directly goes to the long url website. 


# Docker in Vagrant How-To

## Vagrant

Use Vagrant to run Ubuntu, then run docker in Ubutntu.
  - Add synced folder in [Vagrantfile](https://github.com/fairyqiqi/TinyUrl/blob/master/playgroud/Vagrantfile)
    * ```config.vm.synced_folder "../source", "/root/tinyUrlSource"```
      - "../source" - Source code path relative to where Vagrantfile is
      - "/root/tinyUrlSource" - Source code path to sync in Ubuntu
  - Mark down the network address of the guest Ubuntu
    * ```s1.vm.network :private_network, ip: "192.168.77.101"```
  
## Without Nginx/Redis

1. app docker file
  - Dockerfile is written based on the guest Ubuntu's path.
  - See [App Dockerfile](https://github.com/fairyqiqi/TinyUrl/blob/master/source/app/Dockerfile)

2. Run Docker
  ```
  $ cd playground
  $ vagrant up s1
  $ vagrant ssh s1
  $ sudo su -
  # cd /root/tinyUrlSource/app
  # docker build -t qiqi-tinyUrl:latest .                  //--> qiqi-tinyurl is the image name, all lower case
  # docker run --name tinyurl -p 7777:7777 -d qiqi-tinyurl //--> tinyurl is the container name
  ```

3. Test
  - In host machine, type this address in browser: `http://192.168.77.101:7777`

## With Nginx/Redis

1. Docker compose
  - Add [docker-compose.yml](https://github.com/fairyqiqi/TinyUrl/blob/master/source/docker-compose.yml)
  - It contains build step for Nginx, apps, redis
  
2. Nginx docker
  - Add nginx docker file: [Nginx Dockerfile](https://github.com/fairyqiqi/TinyUrl/blob/master/source/nginx/Dockerfile)
    * to copy nginx config
  - Add nginx config: [nginx.conf](https://github.com/fairyqiqi/TinyUrl/blob/master/source/nginx/nginx.conf)
    * to config nginx workers, upstream app servers, and listenning port
    
3. Run docker
  ```
  $ cd playground
  $ vagrant up s1
  $ vagrant ssh s1
  $ sudo su -
  # cd /root/tinyUrlSource
  # docker-compose up --build
  ```
  
4. Test
  - In host machine, type this address in browser: `http://192.168.77.101`