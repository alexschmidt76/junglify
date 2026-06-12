# JUNGLIFY

## About

Junglify is a browser extension that turns the boring old internet into a world of jungles to be explored. 
While in 'the jungle', you can find jungles that other users have planted and grown, collect bananas, and try to find where other users are hiding their bananas (to STEAL them >:})!

## Project Structure
```
junglify/
├───apps/
│   ├───api/ <- junglify serverless api (configured for vercel)
│   ├───web/ <- junglify.org astro project
│   └───wxt-extension/ <- junglify browser extension
├───packages/ <- contains files that multiple apps use
│   ├───auth/ <- get client auth fn
│   ├───eslint.config/
│   ├───react-components/ <- shared react components
│   └───typescript.config/
└───turbo.json <- monorepo config
```