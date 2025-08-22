#  Cloudflare Zola Workers

This sample project explains how to build Zola static pages using Cloudflare Workers and how to simply 
password protect the Zola page as well.


## Only Static Content


When using Cloudflare Workers (not pages), you can configure them to serve all the static content without starting any worker 
(saving on free/paid worker execution)

You will need a very minimal wrangler config to serve static content, check: [wrangler.toml](wrangler.toml)


## Using Workers

If you want to add extra compute capabilities using Cloudflare Workers, e.g. password protect every request, you will need to 
adapt a bit the config file, check [wrangler_pw_protected.toml](wrangler_pw_protected.toml)

But the main changes are:

```
# specify the main entry point for the worker
main = "cf_worker/index.ts"

[assets]
# needed for the worker to access the asset
binding = "ASSETS"
# specify to run the worker handler before asset resolution on these paths
# since we want to protect everything we put "/*"
run_worker_first = [ "/*" ]
```

For this example, you would need to configure an env "CFP_PASSWORD" in Cloudflare with the password to 
protect your site.

---

### Credits
* Credit on how to build Zola in Cloudflare goes to Pablo Martí Gamboa for https://pablomarti.dev/deploy-zola-to-cloudflare-workers/
* Credit on the password protected code goes to [Maxi Ferreira](https://github.com/Charca) where I used https://github.com/Charca/cloudflare-pages-auth as basis
