const express = require('express');
const httpProxy = require('http-proxy');
const app = express();
const PORT = 8000;
const BASEPATH = 'https://deploying-outpurs-1-clone.s3.us-east-1.amazonaws.com/__outputs'

const proxy = httpProxy.createProxy();
app.use((req,res)=>{
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    const resolvesTo = `${BASEPATH}/${subdomain}`
    proxy.web(req,res,{target:resolvesTo, changeOrigin:true})
})
proxy.on('proxyReq',(proxyReq,req,res)=>{
    const url = req.url;
    if(url === '/'){
        proxyReq.path += 'index.html'
    }return proxyReq;
})
app.listen(PORT,()=>console.log(`Reverse proxy running on ${PORT}`))
